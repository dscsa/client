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

  //set this.pended appropriately
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
      //We want to group by PendId, don't need to group by generic like in inventory
      let pendId  = this.getPendId(transaction)

      this.pended[pendId] = this.pended[pendId] || {}
      this.pended[pendId].transactions = this.pended[pendId].transactions ? this.pended[pendId].transactions : []
      this.pended[pendId].transactions.push(transaction)
      this.pended[pendId].priority = transaction.next[0].pended.priority ? (transaction.next[0].pended.priority == true) : false
      this.pended[pendId].locked = transaction.next[0].picked ? Object.keys(transaction.next[0].picked).length == 0 : false
    }
  }


  sortOrders(arr){
    //TODO:sort by priority of the items first
    //then sort by group name
    arr = arr.sort((a,b) => {
      //if(Object.keys(Object.values(a)[1]).length > Object.keys(Object.values(b)[1]).length) return -1 //sorts by number of items
      let urgency1 = a.priority //(Object.values(a.val)[0].transactions[0].next[0].pended.priority) == true //being explicit to avoid mere existence evaluating to true
      let urgency2 = b.priority //(Object.values(b.val)[0].transactions[0].next[0].pended.priority) == true

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
    if(isLocked) return;

    const [pendId, label] = pendedKey.split(': ')

    var transactions = this.pended[pendId].transactions

    if (transactions) this.term = 'Pended '+pendedKey

    this.setShopList(transactions)
    this.initializeShopper()
  }


  //Slightly enhance the transactions to track info about the shopping app
  //and allow for easy reference / cleaner code between view/controller
  //processed and removed appropriately before saving
  setShopList(transactions = [], type, limit) {

    if(transactions.length > 0) this.lockdownGroup(transactions);

    this.shopList = transactions.sort(this.sortTransactionsForShopping)

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
  saveShoppingResults(shoppedItems, key){

    if(shoppedItems.length == 0) return

    let shoppingList = shoppedItems;
    let new_transactions = []

    for(var i = 0; i < shoppingList.length; i++){
      let outcome = this.getOutcome(shoppingList[i])
      let basketNumber = shoppingList[i].basketNumber
      delete shoppingList[i].outcome

      let next = shoppingList[i].next
      if(next){
        if(key == 'shopped'){
          next[0].picked = {
            _id:new Date().toJSON(),
            basket:basketNumber,
            matchType:outcome,
            user:this.user,
          }
        } else if(key == 'remaining'){
          delete next[0].picked
        }

      }
      shoppingList[i].next = next
      new_transactions.push(shoppingList[i])
    }
    console.log("saving the following transactions:")
    console.log(new_transactions)

    this.db.transaction.bulkDocs(new_transactions).catch(err => this.snackbar.error('Error removing inventory. Please reload and try again', err))
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
      //TODO: process the outcomes properties fully into transaction items
      //Offer up more orders
      this.saveShoppingResults(this.shopList,"shopped")
      this.refreshPended()
      this.resetShopper()
      return
    }

    //if next one has the same drug , then pass the basket number forward
    if(this.shopList[this.shoppingIndex].drug.generic == this.shopList[this.shoppingIndex + 1].drug.generic){
      this.shopList[this.shoppingIndex + 1].basketNumber = this.shopList[this.shoppingIndex].basketNumber
    } else {
      this.snackbar.show('Different drug name, enter new basket number')
    }

    this.shoppingIndex += 1
    this.formComplete = (this.shopList[this.shoppingIndex].basketNumber.length > 0) && this.someOutcomeSelected(this.shopList[this.shoppingIndex].outcome) //if returning to a complete page, don't grey out the next/save button
    if(this.shoppingIndex == this.shopList.length -1) this.setNextToSave()

  }


  moveShoppingBackward(){
    this.setNextToNext()
    if(this.shoppingIndex == 0) return
    this.shoppingIndex -= 1
    this.formComplete = true //you can't have left a screen if it wasn't complete

  }


  cancelShopping(){
    //TODO: pop up asking if they're sure they want this
    this.refreshPended()
    let shoppedItems = this.shopList.slice(0,this.shoppingIndex)
    let remainingItems = this.shopList.slice(this.shoppingIndex)
    this.saveShoppingResults(shoppedItems, 'shopped') //previous results need a proper picked property
    this.saveShoppingResults(remainingItems, 'remaining')
    this.resetShopper()
  }


  //Toggles the radio options on each shopping item, stored as an extra property
  //of the transaction, to be processed after the order is complete and saves all results
  shoppingOption(key){
    //TODO: force only one
    if(this.shopList[this.shoppingIndex].outcome[key]) return //don't let thme uncheck, because radio buttons

    if(this.shopList[this.shoppingIndex].basketNumber.length > 0){
      this.formComplete = true;
    } else {
      this.snackbar.show('Must enter basket number')
      //TODO: highlight the basket number field
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

  lockdownGroup(transactions){
      console.log(transactions)
      for(var i = 0; i < transactions.length; i++){
        transactions[i].next[0].picked = {}
      }
      this.db.transaction.bulkDocs(transactions).catch(err => this.snackbar.error('Error removing inventory. Please reload and try again', err))
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


  someOutcomeSelected(outcomeObj){
    for(let key in outcomeObj){
      if(outcomeObj[key] == true) return true
    }
    return false
  }


  highlightRequired(){
    this.snackbar.show('Basket number and outcome are required')
    //TODO: highlight bin field, and the radio buttons
  }


  setNextToSave(){
    this.nextButtonText = 'Save Shopping Results'
  }

  setNextToNext(){
    this.nextButtonText = 'Next'
  }


    //shoppedItem is just a transaction with an extra property for outcome
    getOutcome(shoppedItem){
      let res = ''
      for(let possibility in shoppedItem.outcome){
        if(shoppedItem.outcome[possibility]) res += ";" + possibility
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

      //Get the currectly selected pendId
      //Hacky. Maybe we should set these individually rather than splitting them.
      return this.term.replace('Pended ', '').split(': ')[0]
    }

    getPendQty(transaction) {
      //getPendId from a transaction
      if (transaction) {
        const pendId  = transaction.next[0] ? transaction.next[0].pended.group : null
        return pendId ? pendId : undefined
      }

      return this.term.split(' - ')[1]
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

      let genericMatches = {}

      for (let generic in pended[pendId])
        if ( ~ generic.toLowerCase().indexOf(term))
          genericMatches[generic] = pended[pendId][generic]

      if (Object.keys(genericMatches).length)
        matches.unshift({key:pendId, val:genericMatches, priority:pended[pendId].priority, locked:pended[pendId].locked})
    }
    matches = shopping.prototype.sortOrders(matches)
    return matches
  }
}
