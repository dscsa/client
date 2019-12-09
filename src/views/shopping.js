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

  deactivate() {
    //window.removeEventListener("hashchange", this.reset)
  }

  activate(params) {
    //TODO find a more elegant way to accomplish this
    //window.addEventListener("hashchange", this.reset)

    this.db.user.session.get().then(session => {

      this.user    = { _id:session._id}
      this.account = { _id:session.account._id} //temporary will get overwritten with full account

      this.db.account.get(session.account._id).then(account => this.account = account)

      //Since pended are set into an object rather than array we don't have control to append to
      //beginning or end (object keys are iterated in the order they are added), this will always
      //push new pended keys to the last keys in the object.  But we want new keys to be listed first
      //in the pended drawer so we use unshift to reverse the order inside the pendedFilter which means
      //we do NOT want to reverse the order here (they would be reversed twice which would negate it)
      this.db.transaction.query('pended-by-name-bin', {include_docs:true, startkey:[this.account._id], endkey:[this.account._id, {}]})
      .then(res => {
        this.setPended(res.rows.map(row => row.doc))
        this.refreshPended() //not needed on development without this on production, blank drawer on inital load
      })
      .then(_ => {
        let keys = Object.keys(params)
        if (keys[0])
          this.selectTerm(keys[0], params[keys[0]])
      })
    })
  }
  formatExp(rawStr){
    let substr_arr = rawStr.slice(2,7).split("-")
    return substr_arr[1]+"/"+substr_arr[0]
  }

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

  //Given the pendedkey to identify the order, take all the items in that order
  //and display them one at a time for shopper
  selectOrder(isLocked, pendedKey) {
    if(isLocked) return;

    const [pendId, label] = pendedKey.split(': ')

    var transactions = []

    for(let key in this.pended[pendId]){
        if((key !== 'priority') && (key !== 'locked')) transactions = transactions.concat(this.pended[pendId][key].transactions)
    }

  /*  let transactions = Object.values(this.pended[pendId] || {}).reduce((arr, pend) => {
         return ! label || pend.label == label ? arr.concat(pend.transactions) : arr
    }, [])*/

    if (transactions)
      this.term = 'Pended '+pendedKey

    this.setShopList(transactions)
    this.initializeShopper()

  }


  moveShoppingForward(){


    if(this.shoppingIndex == this.shopList.length -1){ //then we're finished
      //TODO: process the outcomes properties fully into transaction items
      //Offer up more orders
      this.saveShoppingResults(this.shopList,"shopped")
      this.resetShopper()
      this.refreshPended()
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

  someOutcomeSelected(outcomeObj){
    for(let key in outcomeObj){
      if(outcomeObj[key] == true) return true
    }
    return false
  }

  moveShoppingBackward(){
    this.setNextToNext()
    if(this.shoppingIndex == 0) return
    this.shoppingIndex -= 1
    this.formComplete = true //you can't have left a screen if it wasn't complete

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

  cancelShopping(){
    //TODO: pop up asking if they're sure they want this
    let shoppedItems = this.shopList.slice(0,this.shoppingIndex)
    let remainingItems = this.shopList.slice(this.shoppingIndex)
    this.saveShoppingResults(shoppedItems, 'shopped') //previous results need a proper picked property
    this.saveShoppingResults(remainingItems, 'remaining')
    this.resetShopper()
    this.refreshPended()
  }


  saveShoppingResults(shoppedItems, key){
    console.log(shoppedItems)
    console.log(key)
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

  //TODO: this should not need to happen
  removeOrderFromLocalPended(){
    let order = this.shopList[0].next[0].pended.group
    console.log("pended before")
    console.log(this.pended)
    delete this.pended[order]
    console.log("pended after")
    console.log(this.pended)
  }

  //shoppedItem is just a transaction with an extra property for outcome
  getOutcome(shoppedItem){
    let res = ''
    for(let possibility in shoppedItem.outcome){
      if(shoppedItem.outcome[possibility]) res += ";" + possibility
    }
    return res
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



  selectTerm(type, key) {
    console.log('selectTerm', type, key)

    this.setVisibleChecks(false) //reset selected qty back to 0
    this.repacks = []  //empty and left over repacks

    type == 'pended'
      ? this.selectPended(key)
      : this.selectInventory(type, key, 100)

    this.router.navigate(`inventory?${type}=${key}`, {trigger:false})
  }

  refreshPended() {
    //Aurelia doesn't provide an Object setter to detect arbitrary keys so we need
    //to trigger and update using Object.assign rather than just adding a property
    this.pended = Object.assign({}, this.pended)
  }

  //Group pended into this structure {drug:{pendedAt1:[...drugs], pendedAt2:[...drugs]}}
  //this will allow easy functionality of the "Pend to" feature in case someone forgot to
  //pend a drug with the original group.
  setPended(transactions) {

    for (let transaction of transactions) {
      //We want to group by PendId and not PendQty so detach pendQty from pendId and prepend it to generic instead
      let pendId  = this.getPendId(transaction)
      let pendQty = this.getPendQty(transaction)
      let generic = transaction.drug.generic
      let label   = generic + (pendQty ? ' - '+pendQty : '')

      this.pended[pendId] = this.pended[pendId] || {}
      this.pended[pendId][generic] = this.pended[pendId][generic] || {label, transactions:[]}
      this.pended[pendId][generic].transactions.push(transaction)
      this.pended[pendId].priority = transaction.next[0].pended.priority ? (transaction.next[0].pended.priority == true) : false
      console.log(transaction.next[0])
      this.pended[pendId].locked = transaction.next[0].picked ? Object.keys(transaction.next[0].picked).length == 0 : false
      console.log(this.pended[pendId])
    }
  }

  unsetPended(transaction) {

    if ( ! transaction.next[0] || ! transaction.next[0].pended)
      return //called indiscriminately from updateSelected

    const generic = transaction.drug.generic
    const pendId  = this.getPendId(transaction)

    let i = this.pended[pendId][generic].transactions.indexOf(transaction)

    this.pended[pendId][generic].transactions.splice(i, 1) //Assume transaction is found and i is not false

    //console.log(pendId, generic, i, 'of', this.pended[pendId][generic].transactions.length)

    if ( ! this.pended[pendId][generic].transactions.length)
      delete this.pended[pendId][generic]

    if ( ! Object.keys(this.pended[pendId]).length)
      delete this.pended[pendId]

    //NOTE Developer should call this.refreshPended() after all transactions are unpended
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

  setMatchingPends(drug) {

    let matches = []
    let pendId  = this.getPendId()

    if (drug)
      for (let pendToId in this.pended) {
        let match = this.pended[pendToId][drug.generic]
        if (pendId != pendToId && match)
          matches.push({pendId:pendToId, pendQty:this.getPendQty(match.transactions[0])})
      }
    return matches
  }


  sortOrders(arr){
    //TODO:sort by priority of the items first
    //then sort by group name
    console.log("unsorted")
    console.log(arr)

    arr = arr.sort((a,b) => {
      //if(Object.keys(Object.values(a)[1]).length > Object.keys(Object.values(b)[1]).length) return -1 //sorts by number of items


      let urgency1 = (Object.values(a.val)[0].transactions[0].next[0].pended.priority) == true //being explicit to avoid mere existence evaluating to true
      let urgency2 = (Object.values(b.val)[0].transactions[0].next[0].pended.priority) == true
      console.log(urgency1)
      console.log(urgency2)
      if(urgency1 && !urgency2) return -1
      if(!urgency1 && urgency2) return 1
      console.log("Hre")
      let group1 = a.key
      let group2 = b.key
      if(group1 > group2) return 1
      if(group1 < group2) return -1

    })

    console.log("sorted")
    console.log(arr)
    return arr
  }

}

//Allow user to search by pendId OR generic name
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
