import {inject} from 'aurelia-framework';
import {Pouch}     from '../libs/pouch'
import {Router} from 'aurelia-router';
import {canActivate, expShortcuts, currentDate} from '../resources/helpers'

@inject(Pouch, Router)
export class shopping {

  constructor(db, router){
    this.db      = db
    this.router  = router

    this.groups = []
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

  canDeactivate(){
    return confirm('Confirm you want to leave page');
  }


  activate(params) {



    this.db.user.session.get().then(session => {

      this.user    = { _id:session._id}
      this.account = { _id:session.account._id} //temporary will get overwritten with full account

      if(!this.account.hazards) this.account.hazards = {} //shouldn't happen, but just in case

      this.refreshPendedGroups()

    })

  }


  refreshPendedGroups(){

    this.db.account.picking['post']({action:'refresh'}).then(res =>{
      console.log("result of refresh:", res)
      this.groups = res
    })

  }

  unlockGroup(groupName){

    this.db.account.picking['post']({groupName:groupName, action:'unlock'}).then(res =>{
      console.log("result of unlocking:", res)
      this.groups = res
    })

  }


  selectGroup(isLocked, groupName) {

    if(isLocked || (groupName.length == 0)) return; //TODO uncommed this when we're passed initial testing

    this.groupLoaded = false
    this.orderSelectedToShop = true

    this.db.account.picking['post']({groupName:groupName, action:'load'}).then(res =>{
      console.log("result of loading",res)
      this.shopList = res
      this.filter = {} //after new transactions set, we need to set filter so checkboxes don't carry over
      this.initializeShopper()
    })

  }



  //Display and set relavant variables to display a group
  initializeShopper(){
    this.shoppingIndex = 0
    this.groupLoaded = true

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
      let next = reformated_transaction.next

      if(next[0]){
        if(key == 'shopped'){
          var outcome = this.getOutcome(arr_enriched_transactions[i].extra)
          next[0].picked = {
            _id:new Date().toJSON(),
            basket:arr_enriched_transactions[i].extra.basketNumber,
            repackQty: reformated_transaction.qty.to ? reformated_transaction.qty.to : reformated_transaction.qty.from,
            matchType:outcome,
            user:this.user,
          }

        } else if(key == 'unlock'){

          delete next[0].picked

        } else if(key == 'lockdown'){

          next[0].picked = {}

        }
      }

      reformated_transaction.next = next
      transactions_to_save.push(reformated_transaction)

    }

    console.log("saving these transactions", JSON.stringify(transactions_to_save))
    return this.db.transaction.bulkDocs(transactions_to_save).then(res => console.log("results of saving" + JSON.stringify(res)))
    .catch(err => {
      this.snackbar.error('Error loading/saving. Contact Adam', err)
      console.log("error saving:", JSON.stringify(err))
      this.resetShopper(); //in case error locking down
    })
  }



//------------------Button controls-------------------------

  moveShoppingForward(){

    if(this.shoppingIndex == this.shopList.length-1){ //then we're finished

      this.resetShopper()
      this.saveShoppingResults([this.shopList[this.shoppingIndex]], 'shopped').
      then(_=>{
        this.refreshPendedGroups()
      }).bind(this)

    } else {

      //if next one has the same drug , then pass the basket number forward
      if(this.shopList[this.shoppingIndex].raw.drug.generic == this.shopList[this.shoppingIndex + 1].raw.drug.generic){
        this.shopList[this.shoppingIndex + 1].extra.basketNumber = this.shopList[this.shoppingIndex].extra.basketNumber
      } else if(this.shopList[this.shoppingIndex+1].extra.basketNumber.length == 1){
        this.snackbar.show('Different generic, enter new basket number')
      }

       //save at each screen. still keeping shoping list updated, so if we move back and then front again, it updates
      this.saveShoppingResults([this.shopList[this.shoppingIndex]], 'shopped')

      this.shoppingIndex += 1
      this.formComplete = (this.shopList[this.shoppingIndex].extra.basketNumber.length > 1) && this.someOutcomeSelected(this.shopList[this.shoppingIndex].extra.outcome) //if returning to a complete page, don't grey out the next/save button
      if(this.shoppingIndex == this.shopList.length -1) this.setNextToSave()

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
    this.resetShopper() //do this first, then handle saving and redisplaying other data, so its more responsive

    this.saveShoppingResults(this.shopList.slice(0,this.shoppingIndex), 'shopped').then(_=>{
      this.saveShoppingResults(this.shopList.slice(this.shoppingIndex), 'unlock').then(_=>{
        this.refreshPendedGroups() //recalculate in case there were changes, others picked orders, etc
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
      this.snackbar.show('Enter basket number')
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


  //Currently sorts priority orders first, then ascending by group name
  sortOrders(arr){ //given array of orders, sort appropriately.

    arr = arr.sort((a,b) => {
      let urgency1 = a.priority
      let urgency2 = b.priority

      if(urgency1 && !urgency2) return -1
      if(!urgency1 && urgency2) return 1

      let group1 = a.name
      let group2 = b.name
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

    if(term.trim().length == 0){
      matches = pended
    } else {
      for(var i = 0; i < pended.length; i++){
        if((~pended[i].name.toLowerCase().indexOf(term)) || (term.trim().length == 0)){
          matches.unshift(pended[i])
          continue
        }
      }
    }

    matches = shopping.prototype.sortOrders(matches)
    return matches

  }
}
