import {inject} from 'aurelia-framework';
import {Pouch}     from '../libs/pouch'
import {Router} from 'aurelia-router';
import {canActivate, clearNextProperty, focusInput, currentDate} from '../resources/helpers'

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
    this.basketSaved = false
    this.currentCart = ''
    this.basketOptions = ['S','R','G','B']
    this.focusInput      = focusInput

    this.canActivate     = canActivate
    this.currentDate     = currentDate
    this.clearNextProperty = clearNextProperty

  }

  deactivate() { //TODO: not sure if we need this here?
    //window.removeEventListener("hashchange", this.reset)
  }

  canDeactivate(){
    return confirm('Confirm you want to leave page');
  }


  activate(params) {
    this.requestedPickingStep = params.stepNumber ? parseInt(params.stepNumber) :  0;
    this.groupName = params.groupName;

    if(this.groupName){
      this.orderSelectedToShop = true;
    }
    // this.db.account.picking.post({groupName:params.groupName, action:'check_owner'}).then((response) => {
    //   console.log(response);
    // });

    //window.scrollTo(0,1)
    this.db.user.session.get().then( session => {
      console.log('user acquired')
      this.user    = { _id:session._id}
      this.account = { _id:session.account._id} //temporary will get overwritten with full account

      this.db.user.get(this.user._id).then(user => {this.router.routes[2].navModel.setTitle(user.name.first)}) //st 'Account to display their name


      if(!this.account.hazards) this.account.hazards = {} //shouldn't happen, but just in case
      console.log('about to call refresh first time')
      this.refreshPendedGroups();


      if(params.groupName){
        this.db.account.picking.post({groupName:params.groupName, action:'group_info'}).then((result) => {
          if(result.shopList){
            this.shopList = result.shopList;
            this.groupData = result.groupData;
            this.groupLoaded = true;
            this.manageShoppingIndex();


          }
        });
      }
      else this.manageShoppingIndex();




    })
    .catch(err => {
      console.log("error getting user session:", JSON.stringify({status: err.status, message:err.message, reason: err.reason, stack:err.stack}))
      return confirm('Error getting user session, info below or console. Click OK to continue. ' + JSON.stringify({status: err.status, message:err.message, reason: err.reason, stack:err.stack}));
    })

  }

  updatePickedCount(){
    //console.log("going to update picked count")
    var date = new Date()
    var [year,month,day] = date.toJSON().split('T')[0].split('-')

    this.db.transaction.query('picked-by-user-from-shipment', {startkey: [this.account._id, this.user._id, year, month, day], endkey: [this.account._id, this.user._id, year, month, day, {}]})
    .then(res => {
      //console.log("updating picked count with res: ", res.rows[0].value[0].sum)
      console.log(res)
      this.pickedCount = res.rows[0].value[0].count
    })
  }

  manageShoppingIndex(){

    console.log(this.requestedPickingStep);
    console.log(this.numShopItems());

    if(this.requestedPickingStep <= this.numShopItems()){
      console.log('pants');
      if(this.requestedPickingStep === 0){
        this.basketSaved = false;
        console.log('hiii');
      }
      else{
        this.setShoppingIndex(this.requestedPickingStep);
      }
    }
    else if(this.requestedPickingStep){
      this.setShoppingIndex(1);
    }
  }

  refreshPendedGroups(){
    console.log('refreshing')

    this.updatePickedCount()  //async call to the user-metrics tracking views

    this.db.account.picking['post']({action:'refresh'}).then(res =>{
      this.groups = res;
    })
    .catch(err => {
      console.log("error refreshing pended groups:", JSON.stringify({status: err.status, message:err.message, reason: err.reason, stack:err.stack}))
      return confirm('Error refreshing pended groups, info below or console. Click OK to continue. ' + JSON.stringify({status: err.status, message:err.message, reason: err.reason, stack:err.stack}));
    })
  }


  unlockGroup(groupName, el){

    //set the locked boolean to a string, just so we can have the buttons stay snappy
    //it'll all be rewritten by the call to refresh that happens within the unlock call on the server anyway
    for(var i = 0; i < this.groups.length; i++){
      if(this.groups[i].name == groupName) this.groups[i].locked = 'unlocking'
    }

    var start = Date.now();
    console.log(groupName);

    this.db.account.picking.post({groupName:groupName, action:'unlock'}).then(res =>{
      this.groups = res
    })
    .catch(err => {
      console.log("error unlocking order:", (Date.now() - start)/1000, 'seconds', JSON.stringify({status: err.status, message:err.message, reason: err.reason, stack:err.stack}))
      return confirm('Error unlocking order, info below or console. Click OK to continue. ' + JSON.stringify({status: err.status, message:err.message, reason: err.reason, stack:err.stack}));
    })
  }

  navigate(groupName, stepNumber){

      let previousStepNumber = stepNumber - 1;
      this.groupName = groupName;
      console.log(groupName);

      if(previousStepNumber === 0){
        this.saveBasketNumber();
      }

      this.router.navigate(`picking/${groupName}/step/${stepNumber}`);

      return true;
  }

   selectGroup(groupName, isLocked, isLockedByCurrentUser) {
    console.log(groupName, isLocked, isLockedByCurrentUser);

    if((isLocked && !isLockedByCurrentUser) || groupName.length === 0)
      return null; //TODO uncommed this when we're passed initial testing

    this.groupLoaded = false;
    this.orderSelectedToShop = true;
    this.groupName = groupName;

    var start = Date.now();

     this.db.account.picking.post({groupName:groupName, action:'load'}).then(res =>{
      console.log("result of loading: "+res.length, (Date.now() - start)/1000, 'seconds')
      console.log(res);

      let step = 0, hasBasket = false;

      if(res.groupData && res.groupData.basket && res.groupData.basket.number) {
        step = 1;
        this.basketSaved = true;
        hasBasket = true;
      }

      history.pushState(null, null, `#/picking/${groupName}/step/${step}`);

      this.shopList = res.shopList;
      this.groupData = res.groupData;
      this.pendedFilter = ''
      this.filter = {} //after new transactions set, we need to set filter so checkboxes don't carry over
      this.initializeShopper();
      //this has to come after  initialize shopper
      this.basketSaved = hasBasket;
      if(hasBasket){
        this.addBasketToShoppingList(res.groupData.basket.fullBasket);
      }


    })
    .catch(err => {
      if(( ~ err.message.indexOf('Unexpected end of JSON input')) || ( ~ err.message.indexOf('Unexpected EOF'))){ //happens if you click a group that doesnt have any more items available to pick (maybe you havent refreshed recently)
        var res = confirm("Seems this order is no longer available to shop or someone locked it down. Click OK to refresh available groups. If this persists, contact Adam / Aminata");
        this.refreshPendedGroups();
        this.resetShopper();
      } else {
        console.log("error loading order:", JSON.stringify({status: err.status, message:err.message, reason: err.reason, stack:err.stack}))
        return confirm('Error loading group, info below or console. Click OK to continue. ' + JSON.stringify({status: err.status, message:err.message, reason: err.reason, stack:err.stack}));
      }
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

    this.addBasket(this.shoppingIndex)

  }


  //Reset variables that we don't want to perserve from one order to the next
  resetShopper(){
    //this.uniqueDrugsInOrder = []
    this.orderSelectedToShop = false
    this.formComplete = false
    this.updatePickedCount()
  }



  //Given shopping list, and whether it was completed or cancelled,
  //handle appropriate saving
  saveShoppingResults(arr_enriched_transactions, key){

    let transactions_to_save = this.prepResultsToSave(arr_enriched_transactions, key) //massage data into our couchdb format

    console.log("attempting to save these transactions", JSON.stringify(transactions_to_save))
    let startTime = new Date().getTime()

    return this.db.transaction.bulkDocs(transactions_to_save).then(res => {
      //success!
      let completeTime = new Date().getTime()
      console.log("results of saving in " + (completeTime - startTime) + " ms", JSON.stringify(res))

    })
    .catch(err => {

      let completeTime = new Date().getTime()
      console.log("error saving in " + (completeTime - startTime) + "ms:", JSON.stringify({status: err.status, message:err.message, reason: err.reason, stack:err.stack}))

      if(err.status == 0){ //then it's maybe a connection issue, try one more time

        console.log("going to try and save one more time, in case it was just connectivity " + JSON.stringify(transactions_to_save))

        return this.delay(3000).then(_=>{

          console.log("waiting finished, sending again")

          return this.db.transaction.bulkDocs(transactions_to_save).then(res => { //just try again
            let finalTime = new Date().getTime()
            console.log("succesful second saving in " + (finalTime - completeTime) + " ms", JSON.stringify(res))
            //return confirm('Successful second saving of item')
          })
          .catch(err =>{
            console.log("saving: empty object error the second time")
            return confirm('Error saving item on second attempt. Error object: ' + JSON.stringify({status: err.status, message:err.message, reason: err.reason, stack:err.stack}));
          })
        })


      } else {

        this.snackbar.error('Error loading/saving. Contact Adam', err)
        return confirm('Error saving item, info below or console. Click OK to continue. ' + JSON.stringify({status: err.status, message:err.message, reason: err.reason, stack:err.stack}));

      }
    })
  }


  prepResultsToSave(arr_enriched_transactions, key){

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
            basket:arr_enriched_transactions[i].extra.fullBasket,
            repackQty: next[0].pended.repackQty ? next[0].pended.repackQty : (reformated_transaction.qty.to ? reformated_transaction.qty.to : reformated_transaction.qty.from),
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

    return transactions_to_save
  }


//------------------Button controls-------------------------

  saveBasketNumber(){
    console.log("saving basket")
    this.basketSaved = true
    this.shopList[this.shoppingIndex].extra.fullBasket = this.shopList[this.shoppingIndex].extra.basketLetter + this.shopList[this.shoppingIndex].extra.basketNumber
    if((this.shopList[this.shoppingIndex].extra.basketLetter != 'G') &&
      (this.currentCart != this.shopList[this.shoppingIndex].extra.basketNumber[0])) this.currentCart = this.shopList[this.shoppingIndex].extra.basketNumber[0]
    this.gatherBaskets(this.shopList[this.shoppingIndex].raw.drug.generic);

    let extra = this.shopList[this.shoppingIndex].extra;
    const basket = {
      letter:extra.basketLetter,
      number:extra.basketNumber,
      fullBasket:extra.fullBasket
    };

    this.db.account.picking.post({groupName:this.groupName, basket:basket, action:'save_basket_number'}).then(res => {
      if(res && res[0] === 'success')
      {
        this.basketSaved = true;
        //this.addBasketToShoppingList(basket);
      }
    });


    history.pushState(null, null, `#/picking/${this.groupName}/step/1`);
  }

  //returns a strng that looks like ,BASKET,BASKET,.... so that the html can easily push the current item's basket to the front
  gatherBaskets(generic){
    let list_of_baskets = ''
    for(var i = 0; i < this.shopList.length; i++){
      if(
        (this.shopList[i].extra.fullBasket)
        && (!(~ list_of_baskets.indexOf(this.shopList[i].extra.fullBasket)))
        && (this.shopList[i].raw.drug.generic == generic))
            list_of_baskets += ',' + (this.shopList[i].extra.fullBasket)
    }
    this.currentGenericBaskets = list_of_baskets
  }

  addBasket(index){
    //this.focusInput('#basket_number_input') //This wasn't quite working, but autofocus works if you click basket, just not on the first screen which is frustrating
    this.basketSaved = false
    if(this.shopList[index].extra.basketLetter != 'G') this.shopList[index].extra.basketNumber = this.currentCart
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  moveShoppingForward(){

    if((this.getOutcome(this.shopList[this.shoppingIndex].extra) == 'missing') && (this.shopList[this.shoppingIndex].extra.saved != 'missing')){

      this.formComplete = false; //to disable the button
      this.setNextToLoading()

      console.log("missing item! sending request to server to compensate for:", this.shopList[this.shoppingIndex].raw.drug.generic)

      this.db.account.picking['post']({groupName:this.shopList[this.shoppingIndex].raw.next[0].pended.group, action:'missing_transaction',ndc:this.shopList[this.shoppingIndex].raw.drug._id, generic:this.shopList[this.shoppingIndex].raw.drug.generic, qty:this.shopList[this.shoppingIndex].raw.qty.to, repackQty:this.shopList[this.shoppingIndex].raw.next[0].pended.repackQty})
      .then(res =>{

        if(res.length > 0){

          this.shopList[this.shoppingIndex].extra.saved = 'missing' //if someone goes back through items, dont want to retry this constantly

          for(var j = 0; j < res.length; j++){

            let n = this.shoppingIndex - (this.shopList[this.shoppingIndex].extra.genericIndex.relative_index[0] - 1) //so you update all the items of this generic
            if(n < 0) n = 0 //dont go too far back obvi. Current bug that happens with skip shuffling indices incorrectly
            let inserted = false

            for(n; n < this.shopList.length; n++){ //try to insert it at end of current generic

              if(this.shopList[n].raw.drug.generic == res[j].raw.drug.generic){
                this.shopList[n].extra.genericIndex.relative_index[1]++ //increment total for this generic
              } else {
                res[j].extra.genericIndex = {global_index : this.shopList[n-1].extra.genericIndex.global_index, relative_index:[this.shopList[n-1].extra.genericIndex.relative_index[0]+1,this.shopList[n-1].extra.genericIndex.relative_index[1]]}
                this.shopList.splice(n, 0, res[j]) //insert at the end of the current generic
                inserted = true
                n = this.shopList.length
                //this.advanceShopping()
              }
            }

            if(!inserted){ //then we are last/only generic, and add at end of shoplist
              res[j].extra.genericIndex = {global_index : this.shopList[n-1].extra.genericIndex.global_index, relative_index:[this.shopList[n-1].extra.genericIndex.relative_index[0]+1,this.shopList[n-1].extra.genericIndex.relative_index[1]]}
              this.shopList.push(res[j])
            }

          }

        } else {
          console.log("couldn't find item with same or greater qty to replace this")
        }

        //then move forward/handle
        this.advanceShopping()
      })
      .catch(err => {
        console.log("error compensating for missing:", JSON.stringify({status: err.status, message:err.message, reason: err.reason, stack:err.stack}))
        return confirm('Error handling a missing item, info below or console. Click OK to continue. ' + JSON.stringify({status: err.status, message:err.message, reason: err.reason, stack:err.stack}));
      })

    } else {
      this.advanceShopping()
    }

  }




  advanceShopping(){

    if(this.shoppingIndex == this.shopList.length-1){ //then we're finished

      //if(this.getOutcome(this.shopList[this.shoppingIndex].extra) != 'missing') this.resetShopper()

      this.saveShoppingResults([this.shopList[this.shoppingIndex]], 'shopped').then(_=>{
        //remove this group
        this.refreshPendedGroups() //put in here to avoid race condition of reloading before the saving completes
      })

      //cut it out of the list, just until it refreshes anymay
      for(var i = this.groups.length -1 ; i >= 0; i--){
        if(this.groups[i].name == this.shopList[this.shoppingIndex].raw.next[0].pended.group){
          this.groups.splice(i,1)
          break;
        }
      }

      history.pushState(null, null, `#/picking`);
      this.resetShopper() //and send them back to the list, which'll update while they're there

    } else {

      if(!this.shopList[this.shoppingIndex + 1].extra.fullBasket){
        if(this.shopList[this.shoppingIndex].raw.drug.generic == this.shopList[this.shoppingIndex + 1].raw.drug.generic){
          this.shopList[this.shoppingIndex + 1].extra.basketLetter = this.shopList[this.shoppingIndex].extra.basketLetter //push that forward if they changed it at some point
          this.shopList[this.shoppingIndex + 1].extra.fullBasket = this.shopList[this.shoppingIndex].extra.fullBasket
        } else {
          this.addBasket(this.shoppingIndex + 1)
        }
      } else if(this.shopList[this.shoppingIndex].raw.drug.generic != this.shopList[this.shoppingIndex + 1].raw.drug.generic){
        this.gatherBaskets(this.shopList[this.shoppingIndex + 1].raw.drug.generic)
      }

       //save at each screen. still keeping shoping list updated, so if we move back and then front again, it updates

      this.saveShoppingResults([this.shopList[this.shoppingIndex]], 'shopped')
      this.setShoppingIndex(this.shoppingIndex + 1);
    }

  }

  addBasketToShoppingList(basket){
    let letter, number;

    if(basket.letter){
      letter = basket.letter;
      number = basket.number;
    }
    else{
      letter = basket.slice(0, 1);
      number = basket.slice(1);
    }

    this.shopList[this.shoppingIndex].extra.basketLetter = letter;
    this.shopList[this.shoppingIndex].extra.basketNumber = number;
    this.shopList[this.shoppingIndex].extra.fullBasket = letter + number;
    this.basketSaved = true;
  }

  setShoppingIndex(index){

    if(!index){
      alert('no index');
      console.trace();
    }
    let goToStep = () => {
      this.shoppingIndex = index - 1;
      this.basketSaved = this.groupData.basket && this.groupData.basket.number;
console.log('basket save ', this.basketSaved);
      //if they have already chosen as basket take them to the first incomplete step
      if(index < 0 && this.basketSaved){
        this.shoppingIndex = 1;
      }

      if(this.basketSaved){
        let basket = this.groupData.basket;
        this.addBasketToShoppingList(basket);
      }
      if(this.shoppingIndex === this.shopList.length-1){
        this.setNextToSave()
      } else {
        this.setNextToNext()
      }
      console.log(this.shopList[this.shoppingIndex], this.shopList, this.shoppingIndex)
      this.formComplete = (this.shopList[this.shoppingIndex].extra.fullBasket) && this.someOutcomeSelected(this.shopList[this.shoppingIndex].extra.outcome) //if returning to a complete page, don't grey out the next/save button
      history.pushState(null, null, `#/picking/${this.groupName}/step/${this.shoppingIndex + 1}`);

    };

//when the group loads, go to the first incomplete step, don't go to the basket page (unless no steps are complete)
    if(!this.shopList.length){
      console.log(this.groupName);
      this.db.account.picking.post({groupName:this.groupName, action:'load'}).then(res =>{
        this.groupData = res.groupData;
        this.shopList = res.shopList;
        this.initializeShopper();
        goToStep();
      });
    }
    else {
      goToStep();
    }

  }

  shopListMaxIndex(){
    return this.shopList.length - 1;
  }

  numShopItems(){
    console.log(this.shopList);
    return this.shopList.length;
  }

  moveShoppingBackward(){
    if(this.shoppingIndex == 0) return //shouldn't appear, but extra protection :)
    if(this.shopList[this.shoppingIndex - 1].raw.drug.generic != this.shopList[this.shoppingIndex].raw.drug.generic) this.gatherBaskets(this.shopList[this.shoppingIndex - 1].raw.drug.generic)
    this.setNextToNext()
    this.shoppingIndex -= 1
    this.formComplete = true //you can't have left a screen if it wasn't complete
  }

  //all shopped items are already save, so just need to unlock the group, which will unlock remaining transactiosn on server
  pauseShopping(groupName){

    this.resetShopper() //do this first, then handle saving and redisplaying other data, so its more responsive

    //all the values before current screen will already have been saved, so you just need to unlock the remainders
    this.unlockGroup(groupName)

    this.refreshPendedGroups();
  }

  skipItem(){

    if((this.shoppingIndex == this.shopList.length - 1) || (this.shopList[this.shoppingIndex+1].raw.drug.generic !== this.shopList[this.shoppingIndex].raw.drug.generic)) return this.snackbar.show('Cannot skip last item of generic')

    this.shopList[this.shoppingIndex].extra.genericIndex.relative_index[0] = this.shopList[this.shoppingIndex].extra.genericIndex.relative_index[1] //set it to the last index

    for(var i = this.shoppingIndex+1; i < this.shopList.length; i++){
      if(this.shopList[i].raw.drug.generic == this.shopList[this.shoppingIndex].raw.drug.generic){
        //console.log("decrementing")
        this.shopList[i].extra.genericIndex.relative_index[0] -= 1 //decrement relative index count on all ones we pass
      }

      if((this.shopList[i].raw.drug.generic != this.shopList[this.shoppingIndex].raw.drug.generic) || (i == this.shopList.length-1)){
        //console.log("moving ahead")

        this.shopList[this.shoppingIndex+1].extra.fullBasket = this.shopList[this.shoppingIndex].extra.fullBasket //save basket number for item thats about to show up
        this.shopList = this.arrayMove(this.shopList, this.shoppingIndex, (i == this.shopList.length-1) ? i : i-1)

        return

      }
    }

  }

  //Toggles the radio options on each shopping item, stored as an extra property
  //of the transaction, to be processed after the order is complete and saves all results
  selectShoppingOption(key){
    //console.log(key)
    if(this.shopList[this.shoppingIndex].extra.outcome[key]) return //don't let thme uncheck, because radio buttons
    this.formComplete = true;

    for(let outcome_option in this.shopList[this.shoppingIndex].extra.outcome){
      if(outcome_option !== key){
         this.shopList[this.shoppingIndex].extra.outcome[outcome_option] = false
      } else {
        this.shopList[this.shoppingIndex].extra.outcome[outcome_option] = true
      }
    }

    if(key == 'missing'){
      this.setNextToNext()
    } else if(this.shoppingIndex == this.shopList.length-1){
      this.setNextToSave()
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
    this.nextButtonText = 'Updating'
  }

  setNextToSave(){
    this.nextButtonText = 'Complete'
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
    if(term.length < 3)
      return pended;

    term = term.toLowerCase()
    let matches = [] //an array of arrays

    if(term.trim().length == 0){
      matches = pended
    } else {

      for(var i = 0; i < pended.length; i++){

        if((~pended[i].name.toLowerCase().indexOf(term)) || (term.trim().length == 0)){
          matches.unshift(pended[i])
          continue
        } else if(pended[i].baskets.length > 0){
          for(var n = 0; n < pended[i].baskets.length; n++){
            if(~pended[i].baskets[n].toLowerCase().indexOf(term)){  //If not a name match, check the baskets
              matches.unshift(pended[i])
              break //only want to unshift it once
            }
          }
        }
      }
    }

    return matches

  }
}
