import {inject} from 'aurelia-framework';
import {Pouch}     from '../libs/pouch'
import {Router} from 'aurelia-router';
import {canActivate, expShortcuts, currentDate} from '../resources/helpers'

@inject(Pouch, Router)
export class shopping {

  constructor(db, router){
    this.db      = db
    this.router  = router
    this.pended = {}

    this.shopList = []
    this.shoppingIndex = -1
    this.nextButtonText = '' //This can become 'Finish' or other more intuitive values depending on events
    this.orderSelectedToShop = false
    this.formComplete = false
    this.uniqueDrugsInOrder = []

    this.canActivate     = canActivate
    this.currentDate     = currentDate
  }

  deactivate() { //TODO: not sure if we need this here?
    //window.removeEventListener("hashchange", this.reset)
  }

  activate(params) {

    //console.log($('.mdl-layout mdl-js-layout mdl-layout--fixed-header'))

    this.db.user.session.get().then(session => {

      this.user    = { _id:session._id}
      this.account = { _id:session.account._id} //temporary will get overwritten with full account

      this.db.account.get(session.account._id).then(account => this.account = account)

      this.refreshPended()
    })
  }

  //set this.pended appropriately, called at beginning, and any time we return to the order list (after completing or canceling shopping)
  refreshPended() {
    this.db.transaction.query('currently-pended-by-group-bin', {include_docs:true, startkey:[this.account._id], endkey:[this.account._id, {}]})
    .then(res => {
      this.pended = {}
      this.groupByPended(res.rows.map(row => row.doc))
      //this.refreshPended() //not needed on development without this on production, blank drawer on inital load
    })
    this.pended = Object.assign({}, this.pended)
  }

  //Group pended into order structure
  groupByPended(transactions) {
    for (let transaction of transactions) {

      //skip transaction that are locked down, with priority = null, or that are picked, where the picked property has keys, as opposed
      //to when it's locked
      if((typeof transaction.next[0].pended.priority != 'undefined' && transaction.next[0].pended.priority == null)
      || (transaction.next[0].picked ? transaction.next[0].picked._id : false)) continue

      //We want to group by PendId, don't need to group by generic like in inventory
      let pendId  = this.getPendId(transaction)
      this.pended[pendId] = this.pended[pendId] || {}
      this.pended[pendId].transactions = this.pended[pendId].transactions ? this.pended[pendId].transactions : []
      this.pended[pendId].transactions.push(transaction)
      this.pended[pendId].priority = transaction.next[0].pended.priority ? (transaction.next[0].pended.priority == true) : false
      this.pended[pendId].locked = transaction.next[0].picked && ! transaction.next[0].picked._id
    }
  }

  //Given the pendedkey to identify the order, take all the items in that order
  //and display them one at a time for shopper.
  //requires selecting the right transactions, and creating the shopList array of object to store,
  //for each transaction, the raw data item from the dB, as well as the extra info we need to track while the app is runnign
  selectGroup(isLocked, pendedKey) {

  //  if(isLocked) return; //TODO uncommed this when we're passed initial testing

    const [pendId, label] = pendedKey.split(': ')

    let transactions = this.pended[pendId].transactions //this is the array of transactions as they come straight out of the DB, need to be enriched out for the app

    if(transactions.length == 0) return
    if (transactions) this.term = 'Pended '+pendedKey

    this.prepShoppingData(transactions.sort(this.sortTransactionsForShopping))

    this.saveShoppingResults(this.shopList, 'lockdown').then(_=>{
      this.initializeShopper()
    }).bind(this)

  }

  prepShoppingData(raw_transactions) {

    this.shopList = [] //going to be an array of objects, where each object is {raw:{transaction}, extra:{extra_data}}

    for(var i = 0; i < raw_transactions.length; i++){

      var extra_data = {} //this will track info needed during the miniapp running, and which we'd need to massage later before saving

      extra_data.outcome = {
        'exact_match':false,
        'roughly_equal':false,
        'slot_before':false,
        'slot_after':false,
        'missing':false,
      }

      extra_data.basketNumber = raw_transactions[i].next[0].pended.priority == true ? 'G' : 'R' //a little optimization from the pharmacy, the rest of the basketnumber is just numbers
      if(!(~this.uniqueDrugsInOrder.indexOf(raw_transactions[i].drug.generic))) this.uniqueDrugsInOrder.push(raw_transactions[i].drug.generic)

      this.shopList.push({raw: raw_transactions[i],extra: extra_data})
    }

    this.getImageURLS() //must use an async call to the db
    this.filter = {} //after new transactions set, we need to set filter so checkboxes don't carry over

    console.log("raw transactions:")
    console.log(raw_transactions)
    console.log("shopping list:")
    console.log(this.shopList)
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
    this.uniqueDrugsInOrder = []
    this.orderSelectedToShop = false
    this.formComplete = false
  }


  //Given shopping list, and whether it was completed or cancelled,
  //handle appropriate saving
  saveShoppingResults(arr_enriched_transactions, key){
    if(arr_enriched_transactions.length == 0) return Promise.resolve()

    //go through enriched trasnactions, edit the raw transactions to store the data,
    //then save them
    var transactions_to_save = []

    for(var i = 0; i < arr_enriched_transactions.length; i++){

      var reformated_transaction = arr_enriched_transactions[i].raw
      var outcome = this.getOutcome(arr_enriched_transactions[i].extra)
      let next = reformated_transaction.next

      if(next[0]){
        if(key == 'shopped'){
          next[0].picked = {
            _id:new Date().toJSON(),
            basket:arr_enriched_transactions[i].extra.basketNumber,
            repackQty: reformated_transaction.qty.to ? reformated_transaction.qty.to : reformated_transaction.qty.from,
            matchType:outcome,
            user:this.user,
          }
        } else if(key == 'unlock'){
          let res4 = delete next[0].picked
        } else if(key == 'lockdown'){
          next[0].picked = {}
        }
      }

      reformated_transaction.next = next
      transactions_to_save.push(reformated_transaction)

    }

    console.log("saving these transactions")
    console.log(transactions_to_save)

    return this.db.transaction.bulkDocs(transactions_to_save).then(res => console.log("results of saving" + JSON.stringify(res))).catch(err => this.snackbar.error('Error removing inventory. Please reload and try again', err))
  }



//------------------Button controls-------------------------

  moveShoppingForward(){

    if(this.shoppingIndex == this.shopList.length -1){ //then we're finished

      this.saveShoppingResults([this.shopList[this.shoppingIndex]], 'shopped').
      then(_=>{
        this.refreshPended()
        this.resetShopper()
      }).bind(this)

    } else {

      //if next one has the same drug , then pass the basket number forward
      if(this.shopList[this.shoppingIndex].raw.drug.generic == this.shopList[this.shoppingIndex + 1].raw.drug.generic){
        this.shopList[this.shoppingIndex + 1].extra.basketNumber = this.shopList[this.shoppingIndex].extra.basketNumber
      } else {
        this.snackbar.show('Different drug name, enter new basket number')
      }

       //save at each screen. still keeping shoping list updated, so if we move back and then front again, it updates
      this.saveShoppingResults([this.shopList[this.shoppingIndex]], 'shopped').
      then(_=>{
        this.shoppingIndex += 1
        this.formComplete = (this.shopList[this.shoppingIndex].extra.basketNumber.length > 1) && this.someOutcomeSelected(this.shopList[this.shoppingIndex].extra.outcome) //if returning to a complete page, don't grey out the next/save button
        if(this.shoppingIndex == this.shopList.length -1) this.setNextToSave()
      }).bind(this)

    }
  }

  moveShoppingBackward(){
    if(this.shoppingIndex == 0) return //shouldn't appear, but extra protection :)

    this.setNextToNext()
    this.shoppingIndex -= 1
    this.formComplete = true //you can't have left a screen if it wasn't complete
  }

  //will save all fully shopped items, and unlock remaining ones
  pauseShopping(){
    this.saveShoppingResults(this.shopList.slice(0,this.shoppingIndex), 'shopped').then(_=>{
      this.saveShoppingResults(this.shopList.slice(this.shoppingIndex), 'unlock').then(_=>{
        this.refreshPended() //recalculate in case there were changes, others picked orders, etc
        this.resetShopper()
      }).bind(this)
    }).bind(this)
  }


  //Toggles the radio options on each shopping item, stored as an extra property
  //of the transaction, to be processed after the order is complete and saves all results
  selectShoppingOption(key){
    if(this.shopList[this.shoppingIndex].extra.outcome[key]) return //don't let thme uncheck, because radio buttons

    if(this.shopList[this.shoppingIndex].extra.basketNumber.length > 1){
      this.formComplete = true;
    } else {
      this.snackbar.show('Must enter basket number')
      return
    }

    for(let outcome_option in this.shopList[this.shoppingIndex].extra.outcome){
      if(outcome_option !== key){
         this.shopList[this.shoppingIndex].extra.outcome[outcome_option] = false
      } else {
        this.shopList[this.shoppingIndex].extra.outcome[outcome_option] = true
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
        if(this.shopList[n].raw.drug._id == drug._id) this.shopList[n].extra.image = drug.image
      }
    }).bind(this)

    for(var i = 0; i < this.shopList.length; i++){
      this.db.drug.get(this.shopList[i].raw.drug._id).then(drug => saveImgCallback(drug)).catch(err=>console.log(err))
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
  getOutcome(extraItemData){
    let res = ''
    for(let possibility in extraItemData.outcome){
      if(extraItemData.outcome[possibility]) res += possibility //this could be made to append into a magic string if there's multiple conditions we want to allow
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

}

//Allow user to search by pendId among all pended groups
//also sorts by priority, then by group name in ascending order
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
