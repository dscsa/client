import {inject} from 'aurelia-framework';
import {Pouch}     from '../libs/pouch'
import {Router} from 'aurelia-router';
import {canActivate, expShortcuts, currentDate} from '../resources/helpers'

@inject(Pouch, Router)
export class shopping {

  constructor(db, router){
    this.db      = db
    this.router  = router

    this.portraitMode = true
    this.groups = []
    this.shopList = []
    this.shoppingIndex = -1
    this.nextButtonText = '' //This can become 'Finish' or other more intuitive values depending on events
    this.orderSelectedToShop = false
    this.formComplete = false

    this.basketSaved = false
    this.currentBasket

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
    window.addEventListener("orientationchange", function() {
      this.portraitMode = (screen.orientation.angle == 0)
      console.log(this.portraitMode)
    });

    //window.scrollTo(0,1)
    this.db.user.session.get().then(session => {
      console.log('user acquired')
      this.user    = { _id:session._id}
      this.account = { _id:session.account._id} //temporary will get overwritten with full account

      if(!this.account.hazards) this.account.hazards = {} //shouldn't happen, but just in case
      console.log('about to call')
      this.refreshPendedGroups()

    })
    .catch(err => {
      console.log("error getting user session:", JSON.stringify({message:err.message, stack:err.stack}))
      return confirm('Error getting user session, info below or console. Click OK to continue. ' + JSON.stringify({message:err.message, stack:err.stack}));
    })

  }


  refreshPendedGroups(){
    console.log('refreshing')
    this.db.account.picking['post']({action:'refresh'}).then(res =>{
      //console.log("result of refresh:", res)
      console.log('refresh complet4e')
      this.groups = res
    })
    .catch(err => {
      console.log("error refreshing pended groups:", JSON.stringify({message:err.message, stack:err.stack}))
      return confirm('Error refreshing pended groups, info below or console. Click OK to continue. ' + JSON.stringify({message:err.message, stack:err.stack}));
    })
  }


  unlockGroup(groupName, el){

    //set the locked boolean to a string, just so we can have the buttons stay snappy
    //it'll all be rewritten by the call to refresh that happens within the unlock call on the server anyway
    for(var i = 0; i < this.groups.length; i++){
      if(this.groups[i].name == groupName) this.groups[i].locked = 'unlocking'
    }

    console.log(groupName);

    this.db.account.picking['post']({groupName:groupName, action:'unlock'}).then(res =>{
      console.log("result of unlocking:", res)
      this.groups = res
    })
    .catch(err => {
      console.log("error unlocking order:", JSON.stringify({message:err.message, stack:err.stack}))
      return confirm('Error unlocking order, info below or console. Click OK to continue. ' + JSON.stringify({message:err.message, stack:err.stack}));
    })
  }


  selectGroup(isLocked, groupName) {

    if(isLocked || (groupName.length == 0)) return; //TODO uncommed this when we're passed initial testing

    this.groupLoaded = false
    this.orderSelectedToShop = true

    this.db.account.picking['post']({groupName:groupName, action:'load'}).then(res =>{
      console.log("result of loading",res)
      this.shopList = res
      this.pendedFilter = ''
      this.filter = {} //after new transactions set, we need to set filter so checkboxes don't carry over
      this.initializeShopper()
    })
    .catch(err => {
      console.log("error loading order:", JSON.stringify({message:err.message, stack:err.stack}))
      return confirm('Error loading group, info below or console. Click OK to continue. ' + JSON.stringify({message:err.message, stack:err.stack}));
    })

  }


  //Display and set relavant variables to display a group
  initializeShopper(){
    this.shoppingIndex = 0
    this.groupLoaded = true

    this.basketSaved = false

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
      console.log("error saving:", JSON.stringify({message:err.message, stack:err.stack}))
      return confirm('Error saving item, info below or console. Click OK to continue. ' + JSON.stringify({message:err.message, stack:err.stack}));
      //this.resetShopper(); //in case error locking down
    })
  }



//------------------Button controls-------------------------

  canSaveBasket(){
    return (this.shopList[this.shoppingIndex].extra.basketNumber.length > 1)
  }

  saveBasketNumber(){
    this.basketSaved = true
  }



  moveShoppingForward(){

    if((this.getOutcome(this.shopList[this.shoppingIndex].extra) == 'missing') && (this.shopList[this.shoppingIndex].extra.saved != 'missing')){

      this.setNextToLoading()

      console.log("missing item! sending request to server to compensate for:", this.shopList[this.shoppingIndex].raw.drug.generic)

      this.db.account.picking['post']({groupName:this.shopList[this.shoppingIndex].raw.next[0].pended.group, action:'missing_transaction',generic:this.shopList[this.shoppingIndex].raw.drug.generic, qty:this.shopList[this.shoppingIndex].raw.qty.to})
      .then(res =>{

        if(res.length > 0){

          this.shopList[this.shoppingIndex].extra.saved = 'missing' //if someone goes back through items, dont want to retry this constantly

          console.log("before",this.shoppingIndex)
          let n = this.shoppingIndex - (this.shopList[this.shoppingIndex].extra.genericIndex.relative_index[0] - 1) //so you update all the items of this generic
          //let n = this.shoppingIndex-1 >= 0 ? this.shoppingIndex-1 : 0
          console.log("after",this.shoppingIndex)

          for(n; n < this.shopList.length; n++){
            if(this.shopList[n].raw.drug.generic == res[0].raw.drug.generic){
              console.log("incrementing other order", n)
              this.shopList[n].extra.genericIndex.relative_index[1]++ //increment total for this generic
            } else {
              console.log("adding at end of orders", n)
              res[0].extra.genericIndex = {global_index : this.shopList[n-1].extra.genericIndex.global_index, relative_index:[this.shopList[n-1].extra.genericIndex.relative_index[0]+1,this.shopList[n-1].extra.genericIndex.relative_index[1]]}
              this.shopList.splice(n, 0, res[0]) //insert at the end
              this.advanceShopping()
              return
            }
          }

          res[0].extra.genericIndex = {global_index : this.shopList[n-1].extra.genericIndex.global_index, relative_index:[this.shopList[n-1].extra.genericIndex.relative_index[0]+1,this.shopList[n-1].extra.genericIndex.relative_index[1]]}
          this.shopList.push(res[0])
          console.log("added to shoplist end", res[0])

        } else {
          console.log("couldn't find item with same or greater qty to replace this")
        }

        //then move forward/handle
        //this.setNextToNext()
        this.advanceShopping()
      })
      .catch(err => {
        console.log("error compensating for missing:",err)
        console.log("error compensating for missing:", JSON.stringify({message:err.message, stack:err.stack}))
        return confirm('Error handling a missing item, info below or console. Click OK to continue. ' + JSON.stringify({message:err.message, stack:err.stack}));
      })

    } else {
      this.advanceShopping()
    }

  }




  advanceShopping(){

    if(this.shoppingIndex == this.shopList.length-1){ //then we're finished

      //if(this.getOutcome(this.shopList[this.shoppingIndex].extra) != 'missing') this.resetShopper()

      this.saveShoppingResults([this.shopList[this.shoppingIndex]], 'shopped').then(_=>{
        this.refreshPendedGroups() //put in here to avoid race condition of reloading before the saving completes
      })
      this.resetShopper()

    } else {


      //if you clikc MISSING on the first item in a group, it reverts to basketsaved =false

      if(this.shopList[this.shoppingIndex].raw.drug.generic == this.shopList[this.shoppingIndex + 1].raw.drug.generic){
        this.shopList[this.shoppingIndex + 1].extra.basketNumber = this.shopList[this.shoppingIndex].extra.basketNumber
      } else {
        this.basketSaved = false;
      }
       //save at each screen. still keeping shoping list updated, so if we move back and then front again, it updates

      this.saveShoppingResults([this.shopList[this.shoppingIndex]], 'shopped')
      this.shoppingIndex += 1

      if(this.shoppingIndex == this.shopList.length-1){
        this.setNextToSave()
      } else {
        this.setNextToNext()
      }

      this.formComplete = (this.shopList[this.shoppingIndex].extra.basketNumber.length > 1) && this.someOutcomeSelected(this.shopList[this.shoppingIndex].extra.outcome) //if returning to a complete page, don't grey out the next/save button

    }

  }

  moveShoppingBackward(){
    if(this.shoppingIndex == 0) return //shouldn't appear, but extra protection :)
    this.setNextToNext()
    this.shoppingIndex -= 1
    this.formComplete = true //you can't have left a screen if it wasn't complete
  }


  //all shopped items are already save, so just need to unlock the group, which will unlock remaining transactiosn on server
  pauseShopping(groupName){

    this.resetShopper() //do this first, then handle saving and redisplaying other data, so its more responsive

    //all the values before current screen will already have been saved, so you just need to unlock the remainders
    this.unlockGroup(groupName)

  }

  skipItem(){

    if((this.shoppingIndex == this.shopList.length - 1) || (this.shopList[this.shoppingIndex+1].raw.drug.generic !== this.shopList[this.shoppingIndex].raw.drug.generic)) return this.snackbar.show('Cannot skip last item of generic')

    for(var i = this.shoppingIndex; i < this.shopList.length; i++){
      if((this.shopList[i].raw.drug.generic != this.shopList[this.shoppingIndex].raw.drug.generic) || (i == this.shopList.length-1)){
        this.shopList[this.shoppingIndex+1].extra.basketNumber = this.shopList[this.shoppingIndex].extra.basketNumber //save basket number for item thats about to show up
        this.shopList = this.arrayMove(this.shopList, this.shoppingIndex, i-1)
        return
      }
    }

  }

  //Toggles the radio options on each shopping item, stored as an extra property
  //of the transaction, to be processed after the order is complete and saves all results
  selectShoppingOption(key){
    console.log(key)
    if(this.shopList[this.shoppingIndex].extra.outcome[key]) return //don't let thme uncheck, because radio buttons
    this.formComplete = true;

    for(let outcome_option in this.shopList[this.shoppingIndex].extra.outcome){
      if(outcome_option !== key){
         this.shopList[this.shoppingIndex].extra.outcome[outcome_option] = false
      } else {
        this.shopList[this.shoppingIndex].extra.outcome[outcome_option] = true
      }
    }

  }


//-------------Helpers--------------------------------

  arrayMove(arr, fromIndex, toIndex) {
    var res = arr.slice(0);
    var element = res[fromIndex];
    res.splice(fromIndex, 1);
    res.splice(toIndex, 0, element);
    return res
  }

  formatExp(rawStr){
    let substr_arr = rawStr.slice(2,7).split("-")
    return substr_arr[1]+"/"+substr_arr[0]
  }

  //shortcut to look at the outcome object and check if any values are set to true
  someOutcomeSelected(outcomeObj){
    return ~Object.values(outcomeObj).indexOf(true)
  }

  warnAboutRequired(){
    this.snackbar.show('Basket number and outcome are required')
  }

  setNextToLoading(){
    this.nextButtonText = 'Fetching Items'
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

    return matches

  }
}
