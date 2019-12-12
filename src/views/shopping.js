import {inject} from 'aurelia-framework';
import {Pouch}     from '../libs/pouch'
import {Router} from 'aurelia-router';
import {csv}    from '../libs/csv'
import {canActivate, expShortcuts, saveTransaction, groupDrugs, drugName, waitForDrugsToIndex, currentDate} from '../resources/helpers'

@inject(Pouch, Router)
export class shopping {

  constructor(db, router){
    this.db      = db
    this.router  = router
    this.pended = {}

    this.shopList = [] //an expanded version of this.transactions from inventory.js tracks outcome of shopping each item
    this.shoppingIndex = -1
    this.nextButtonText = '' //This can become 'Finish' or other more intuitive values depending on events
    this.orderSelectedToShop = false
    this.formComplete = false
    this.uniqueDrugsInOrder = []

    this.waitForDrugsToIndex = waitForDrugsToIndex
    this.saveTransaction = saveTransaction
    this.drugName        = drugName
    this.groupDrugs      = groupDrugs
    this.canActivate     = canActivate
    this.currentDate     = currentDate

  }

  deactivate() { //TODO: not sure if we need this here?
    //window.removeEventListener("hashchange", this.reset)
  }

  activate(params) {

    this.db.user.session.get().then(session => {

      this.user    = { _id:session._id}
      this.account = { _id:session.account._id} //temporary will get overwritten with full account

      this.db.account.get(session.account._id).then(account => this.account = account)

      this.refreshPended()
    })
  }

  //set this.pended appropriately, called at beginning, and any time we return to the order list (after completing or canceling shopping)
  refreshPended() {
    this.db.transaction.query('pended-by-name-bin', {include_docs:true, startkey:[this.account._id], endkey:[this.account._id, {}]})
    .then(res => {
      this.pended = {}
      this.groupByPended(res.rows.map(row => row.doc))
      this.refreshPended() //not needed on development without this on production, blank drawer on inital load
    })
    this.pended = Object.assign({}, this.pended)
  }

  //Group pended into order structure
  groupByPended(transactions) {
    for (let transaction of transactions) {

      if(typeof transaction.next[0].pended.priority != 'undefined' && transaction.next[0].pended.priority == null) continue //an extra in between to keep us from seeing limbo-ed transactions

      //We want to group by PendId, don't need to group by generic like in inventory
      let pendId  = this.getPendId(transaction)
      this.pended[pendId] = this.pended[pendId] || {}
      this.pended[pendId].transactions = this.pended[pendId].transactions ? this.pended[pendId].transactions : []
      this.pended[pendId].transactions.push(transaction)
      this.pended[pendId].priority = transaction.next[0].pended.priority ? (transaction.next[0].pended.priority == true) : false
      this.pended[pendId].locked = transaction.next[0].picked ? Object.keys(transaction.next[0].picked).length == 0 : false
    }
  }

  //setting the picked

  //Currently sorts priority orders first, then ascending by group name
  sortOrders(arr){ //given array of orders, sort appropriately.

    arr = arr.sort((a,b) => {
      let urgency1 = a.priority
      let urgency2 = b.priority

      if(urgency1 && !urgency2) return -1
      if(!urgency1 && urgency2) return 1

      let group1 = a.key
      let group2 = b.key
      if(group1 > group2) return 1
      if(group1 < group2) return -1
    })
    return arr
  }


  //Given the pendedkey to identify the order, take all the items in that order
  //and display them one at a time for shopper
  selectGroup(isLocked, pendedKey) {
    //if(isLocked) return;

    const [pendId, label] = pendedKey.split(': ')

    var transactions = this.pended[pendId].transactions

    if (transactions) this.term = 'Pended '+pendedKey
    if(transactions.length == 0) return

    this.saveShoppingResults(transactions, 'lockdown').then(_=>{
      this.setShopList(transactions)
      this.initializeShopper()
    }).bind(this)

  }


  //Slightly enhance the transactions to track info about the shopping app
  //and allow for easy reference / cleaner code between view/controller
  //processed and removed appropriately before saving
  setShopList(transactions = [], type, limit) {

    this.shopList = transactions.slice().sort(this.sortTransactionsForShopping)

    for(var i = 0; i < this.shopList.length; i++){
      this.shopList[i].outcome = {
        'exact_match':false,
        'roughly_equal':false,
        'slot_before':false,
        'slot_after':false,
        'missing':false,
      }
      this.shopList[i].basketNumber = ''
      if(!(~this.uniqueDrugsInOrder.indexOf(this.shopList[i].drug.generic))) this.uniqueDrugsInOrder.push(this.shopList[i].drug.generic)
    }

    this.getImageURLS() //must use an async call to the db
    this.noResults    = this.term && ! transactions.length
    this.filter = {} //after new transactions set, we need to set filter so checkboxes don't carry over
  }


  //Display and set relavant variables to display a group
  initializeShopper(){
    this.shoppingIndex = 0
    this.orderSelectedToShop = true

    if(this.shopList.length == 1){
      this.setNextToSave()
    } else {
      this.setNextToNext()
    }
  }

  //Reset variables that we don't want to perserve from one order to the next
  resetShopper(){
    this.setNextToNext()
    this.uniqueDrugsInOrder = []
    this.orderSelectedToShop = false
    this.formComplete = false
  }

  //Given shopping list, and whether it was completed or cancelled,
  //handle appropriate saving
  saveShoppingResults(provided_transactions, key){

    let transactions = provided_transactions.slice()

    if(transactions.length == 0) return Promise.resolve()

    for(var i = 0; i < transactions.length; i++){
      let current_transaction = transactions[i]
      let outcome = this.getOutcome(current_transaction)
      let next = current_transaction.next

      if(next){
        if(key == 'shopped'){
          next[0].picked = {
            _id:new Date().toJSON(),
            basket:current_transaction.basketNumber,
            matchType:outcome,
            user:this.user,
          }
        } else if(key == 'remaining'){
          let res4 = delete next[0].picked
          console.log("deleting picked:" + res4)
        } else if(key == 'lockdown'){
          next[0].picked = {}
        }

      }

      let res1 = delete current_transaction.outcome
      console.log("deleting outcome" + res1)
      console.log(current_transaction.outcome)
      let res2 = delete current_transaction.basketNumber
      console.log("deleting basketnumber" + res2)
      let res3 = delete current_transaction.image
      console.log("deleting image" + res3)
      current_transaction.next = next

      console.log("stripped transaction")
      console.log(current_transaction)

      transactions[i] = current_transaction
    }
    console.log("saving the following transactions:")
    console.log(transactions)

    return this.db.transaction.bulkDocs(transactions).catch(err => this.snackbar.error('Error removing inventory. Please reload and try again', err))
  }

  selectTerm(type, key) {
    console.log('selectTerm', type, key)

    this.setVisibleChecks(false) //reset selected qty back to 0
    this.repacks = []  //empty and left over repacks

    type == 'pended'
      ? this.selectPended(key)
      : this.selectInventory(type, key, 100)

    this.router.navigate(`inventory?${type}=${key}`, {trigger:false})
  }




//------------------Button controls-------------------------

  moveShoppingForward(){


    if(this.shoppingIndex == this.shopList.length -1){ //then we're finished
      //this.saveShoppingResults(this.shopList,"shopped") //this would save at the end of the full shoplist
      this.saveShoppingResults([this.shopList[this.shoppingIndex]], 'shopped').
      then(_=>{
        this.refreshPended()
        this.resetShopper()
      }).bind(this)
    } else {
      //if next one has the same drug , then pass the basket number forward
      if(this.shopList[this.shoppingIndex].drug.generic == this.shopList[this.shoppingIndex + 1].drug.generic){
        this.shopList[this.shoppingIndex + 1].basketNumber = this.shopList[this.shoppingIndex].basketNumber
      } else {
        this.snackbar.show('Different drug name, enter new basket number')
      }

       //save at each screen. still keeping shoping list updated, so if we move back and then front again, it updates

      this.saveShoppingResults([this.shopList[this.shoppingIndex]], 'shopped').
      then(_=>{
        this.shoppingIndex += 1
        this.formComplete = (this.shopList[this.shoppingIndex].basketNumber.length > 0) && this.someOutcomeSelected(this.shopList[this.shoppingIndex].outcome) //if returning to a complete page, don't grey out the next/save button
        if(this.shoppingIndex == this.shopList.length -1) this.setNextToSave()
      }).bind(this)
    }
  }


  moveShoppingBackward(){
    this.setNextToNext()
    if(this.shoppingIndex == 0) return
    this.shoppingIndex -= 1
    this.formComplete = true //you can't have left a screen if it wasn't complete

  }

  //will sve all fully shopped items, and unlock remaining ones
  cancelShopping(){
    let shoppedItems = this.shopList.slice(0,this.shoppingIndex)
    let remainingItems = this.shopList.slice(this.shoppingIndex)
    this.saveShoppingResults(shoppedItems, 'shopped').then(_=>{
      this.saveShoppingResults(remainingItems, 'remaining').then(_=>{
        this.refreshPended()
        this.resetShopper()
      }).bind(this)
    }).bind(this) //previous results need a proper picked property
  }


  //Toggles the radio options on each shopping item, stored as an extra property
  //of the transaction, to be processed after the order is complete and saves all results
  shoppingOption(key){
    if(this.shopList[this.shoppingIndex].outcome[key]) return //don't let thme uncheck, because radio buttons

    if(this.shopList[this.shoppingIndex].basketNumber.length > 0){
      this.formComplete = true;
    } else {
      this.snackbar.show('Must enter basket number')
      return
    }

    for(let outcome_option in this.shopList[this.shoppingIndex].outcome){
      if(outcome_option !== key){
         this.shopList[this.shoppingIndex].outcome[outcome_option] = false
      } else {
        this.shopList[this.shoppingIndex].outcome[outcome_option] = true
      }
    }

  }


//-------------Helpers--------------------------------

  formatExp(rawStr){
    let substr_arr = rawStr.slice(2,7).split("-")
    return substr_arr[1]+"/"+substr_arr[0]
  }


  sortTransactionsForShopping(a, b) {
    var aName = a.drug.generic;
    var bName = b.drug.generic;

    //sort by drug name first
    if(aName > bName) return -1
    if(aName < bName) return 1

    var aBin = a.bin
    var bBin = b.bin

    var aPack = aBin && aBin.length == 3
    var bPack = bBin && bBin.length == 3

    if (aPack > bPack) return -1
    if (aPack < bPack) return 1

    //Flip columns and rows for sorting, since shopping is easier if you never move backwards
    var aFlip = aBin[0]+aBin[2]+aBin[1]+(aBin[3] || '')
    var bFlip = bBin[0]+bBin[2]+bBin[1]+(bBin[3] || '')

    if (aFlip > bFlip) return 1
    if (aFlip < bFlip) return -1

    return 0
  }

  //makes the async call to drug db to get images for whichever drugs we have one
  getImageURLS(){

    let saveImgCallback = (function(drug){
      for(var n = 0; n < this.shopList.length; n++){
        if(this.shopList[n].drug._id == drug._id) this.shopList[n].image = drug.image
      }
    }).bind(this)

    for(var i = 0; i < this.shopList.length; i++){
      this.db.drug.get(this.shopList[i].drug._id).then(drug => saveImgCallback(drug))
    }
  }

  //shortcut to look at the outcome object and check if any values are set to true
  someOutcomeSelected(outcomeObj){
    return ~Object.values(outcomeObj).indexOf(true)
  }

  warnAboutRequired(){
    this.snackbar.show('Basket number and outcome are required')
  }

  setNextToSave(){
    this.nextButtonText = 'Complete Shopping'
  }

  setNextToNext(){
    this.nextButtonText = 'Next'
  }

  //shoppedItem is just a transaction with an extra property for outcome
  getOutcome(shoppedItem){
    let res = ''
    for(let possibility in shoppedItem.outcome){
      if(shoppedItem.outcome[possibility]) res += possibility //this could be made to append into a magic string if there's multiple conditions we want to allow
    }
    return res
  }


  getPendId(transaction) {
    //getPendId from a transaction
    if (transaction) {

      const pendId  = transaction.next[0] ? transaction.next[0].pended.group : null
      const created = transaction.next[0] ? transaction.next[0].pended._id : transaction._id

      return pendId ? pendId : created.slice(5, 16).replace('T', ' ')  //Google App Script is using Pend Id as "Order# - Qty" and we want to group only by Order#.
    }

    return this.term.replace('Pended ', '').split(': ')[0]
  }
}

//Allow user to search by pendId OR generic name
//have priority and locked getting pushed up to save on code elsewhere
export class pendedFilterValueConverter {

  toView(pended = {}, term = ''){
    term = term.toLowerCase()
    let matches = [] //an array of arrays
    for (let pendId in pended) {
      if ( ~ pendId.toLowerCase().indexOf(term)) {
        matches.unshift({key:pendId, val:pended[pendId], priority:pended[pendId].priority, locked:pended[pendId].locked})
        continue
      }
    }
    matches = shopping.prototype.sortOrders(matches)
    return matches
  }
}
