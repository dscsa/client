import {inject} from 'aurelia-framework';
import {Pouch}     from '../libs/pouch'
import {Router} from 'aurelia-router';
import {canActivate, clearNextProperty, focusInput, currentDate} from '../resources/helpers';
//import { BindingEngine } from 'aurelia-framework';

@inject(Pouch, Router)
export class shopping {

  constructor(db, router){

    window.addEventListener('popstate', (event) => {
      console.log("location: " + document.location + ", state: " + JSON.stringify(event.state));

      let groupAndStep = document.location.href.split('picking/')[1];
      if(groupAndStep){
        const [group, step] = groupAndStep.split('step/');
        console.log(group, step);
      }
    });

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

    this.groupName = params.groupName;

    if(this.groupName){
      this.orderSelectedToShop = true;
    }
    // this.db.account.picking.post({groupName:params.groupName, action:'check_owner'}).then((response) => {
    //   console.log(response);
    // });

    //window.scrollTo(0,1)
    return this.db.user.session.get().then( session => {
      console.log('user acquired')
      this.user    = { _id:session._id}
      this.account = { _id:session.account._id} //temporary will get overwritten with full account

      this.db.user.get(this.user._id).then(user => {this.router.routes[2].navModel.setTitle(user.name.first)}) //st 'Account to display their name

      if(!this.account.hazards) this.account.hazards = {} //shouldn't happen, but just in case
      console.log('about to call refresh first time')
      this.refreshPendedGroups();

      if(this.isValidGroupName()){
        return this.db.account.picking.post({groupName:params.groupName, action:'group_info'}).then(res => {
          console.log('GROUP LOADED:' + params.groupName, 'stepNumber', params.stepNumber, res);

          if ( ! res.groupData || ! res.shopList) {
              console.error(res)
              throw res
          }

          this.shopList = res.shopList;
          this.groupData = res.groupData;
          this.groupLoaded = true;

          this.requestedPickingStep = params.stepNumber
              ? parseInt(params.stepNumber)
              : this.currentShoppingIndex();

          this.manageShoppingIndex();

        });
      }
      else{
        this.groupLoaded = false;
        console.error('group loaded is false', params);
        //this.loadGroupSelectionPage();
      }
    })
    .catch(err => {
      console.log("error getting user session:", err);
      return confirm('Error getting user session, info below or console. Click OK to continue. ' + JSON.stringify({status: err.status, message:err.message, reason: err.reason, stack:err.stack}));
    })

  }

  addPreviousPickInfoIfExists(shopList){
    for(let i of Object.keys(shopList)){
      let transaction = shopList[i].raw;

      if(transaction.next && transaction.next[0]){
        let next = transaction.next;

        if(next[0].pickedArchive && next[0].pickedArchive.user._id === this.user._id){
          next[0].picked = next[0].pickedArchive;
          transaction.next = next;
        }
      }
    }

    return shopList;
  }

  updatePickedCount(){
    //console.log("going to update picked count")
    var date = new Date()
    var [year,month,day] = date.toJSON().split('T')[0].split('-')

    this.db.transaction.query('picked-by-user-from-shipment', {startkey: [this.account._id, this.user._id, year, month, day], endkey: [this.account._id, this.user._id, year, month, day, {}]})
    .then(res => {
      //console.log("updating picked count with res: ", res.rows[0].value[0].sum)
      console.log(res);
      this.pickedCount = res.rows[0] ? res.rows[0].value[0].count : 0;
    })
  }

  maxAllowedShoppingIndex(){
    let max = 0;

    for(const [index, transaction] of Object.entries(this.shopList)){
      if(!!transaction.extra && this.getOutcomeName(transaction.extra.outcome) === null){
        break;
      }

      max++;
    }

    return max;
  }

  manageShoppingIndex(){
    const maxIndex = this.maxAllowedShoppingIndex(),
      maxStep = maxIndex + 1;

    let isRedirect = false;

    if(this.requestedPickingStep > maxStep){
      this.requestedPickingStep = maxStep;
      isRedirect = true;
    }

    if(this.requestedPickingStep <= this.numShopItems() && this.requestedPickingStep > 0){
      this.setShoppingIndex(this.requestedPickingStep - 1);
      console.log('m1');
    }
    else if(this.requestedPickingStep === 'basket'){
      this.basketSaved = false;
      this.initializeShopper();
      console.log('m2');
    }
    else if(this.groupLoaded === true){
      this.setShoppingIndex(0);
    }

    if(isRedirect === true){
      alert('Please complete step ' + this.requestedPickingStep + ' first');
    }
  }

  refreshPendedGroups(){
    console.log('refreshing');

    this.updatePickedCount();  //async call to the user-metrics tracking views

    this.db.account.picking['post']({action:'refresh'}).then(res =>{
      this.groups = res;
    })
    .catch(err => {
      console.log("error refreshing pended groups:", JSON.stringify({status: err.status, message:err.message, reason: err.reason, stack:err.stack}))
      return confirm('Error refreshing pended groups, info below or console. Click OK to continue. ' + JSON.stringify({status: err.status, message:err.message, reason: err.reason, stack:err.stack}));
    });
  }

  unlockGroup(groupName, el){

    //set the locked boolean to a string, just so we can have the buttons stay snappy
    //it'll all be rewritten by the call to refresh that happens within the unlock call on the server anyway
    for(var i = 0; i < this.groups.length; i++){
      if(this.groups[i].name == groupName) this.groups[i].locked = 'unlocking'
    }

    var start = Date.now();

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


      if(previousStepNumber === 0){
        //this.saveBasketNumber();
      }

      this.router.navigate(`picking/${groupName}/step/${stepNumber}`);

      return true;
  }

  getOutcomeName(outcomeObject){
    let match = Object.entries(outcomeObject).filter((entry) => {
        return entry[1] == true ? entry[1] : null
    });

    return match.length ? match[0][0] : null;
  }

  selectGroup(groupName, isLocked, isLockedByCurrentUser) {
    console.log('locking status on select', groupName, isLocked, isLockedByCurrentUser);

    if((isLocked && !isLockedByCurrentUser) || groupName.length === 0)
      return null; //TODO uncommed this when we're passed initial testing

    this.groupLoaded = false;
    this.orderSelectedToShop = true;
    this.groupName = groupName;

    var start = Date.now();

     this.db.account.picking.post({groupName:groupName, action:'load'}).then(res =>{
      console.log("result of loading: "+res.length, (Date.now() - start)/1000, 'seconds')
      console.log(res);

      if ( ! res.shopList || ! res.groupData) {
        console.error(res)
        throw res
      }

      this.setPickingStepUrl(1);

      this.shopList = res.shopList;
      this.groupData = res.groupData;
      this.pendedFilter = ''
      this.filter = {} //after new transactions set, we need to set filter so checkboxes don't carry over
      this.initializeShopper();
      //this has to come after  initialize shopper
       if(res.groupData && res.groupData.baskets && res.groupData.baskets.length) {
         this.basketSaved = true;
         this.addBasketToShoppingList(res.groupData.baskets.slice(-1));
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
    this.shoppingIndex = this.currentShoppingIndex()
    this.groupLoaded = true

    if(this.shopList && this.shopList.length == 1){
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


  updateRevs(res){
    let results = {};
    res.forEach(function(transaction){
      results[transaction._id || transaction.id] = transaction;
    });

    this.shopList.forEach((shopListItem, index) => {
      if(results[shopListItem.raw._id]){
        this.shopList[index].raw._rev = results[shopListItem.raw._id].rev;
        console.log(shopListItem.raw._id + ' => ' + shopListItem.raw._rev);
      }
    });

    return results;
  }

  //Given shopping list, and whether it was completed or cancelled,
  //handle appropriate saving
  saveShoppingResults(arr_enriched_transactions, key){

    let transactions_to_save = this.prepResultsToSave(arr_enriched_transactions, key) //massage data into our couchdb format

    console.log("attempting to save these transactions", transactions_to_save);
    let startTime = new Date().getTime()

    if(!transactions_to_save || !transactions_to_save.length){
      console.log('nothing to save');
      return Promise.resolve();
    }

    return this.db.transaction.bulkDocs(transactions_to_save).then(res => {
      //success!
      let completeTime = new Date().getTime();
      let results = this.updateRevs(res);
      console.log("save (" + key + ") results of saving in " + (completeTime - startTime) + " ms", results);

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

  static ifExists(obj, path){
    let currentNode = obj;
    path = path.split('.');

    for(let part of path){
      currentNode = currentNode[part];

      if(!currentNode)
        break;
    }

    return currentNode;
  }

  static outcomeChanged(transaction, outcome){
    let data = transaction.next[0];

    console.log('comparing outcomes', outcome, shopping.ifExists(data, 'pickedArchive.matchType'));

    if(!data.picked || !data.pickedArchive){
      return true;
    }

    if(data && data.picked && data.pickedArchive){
      return outcome !== data.pickedArchive.matchType;
    }

    return false;
  }

  static canChangeOutcome(transaction){
    let data = transaction.next[0];

    if(data.pickedArchive){
      return data.pickedArchive.matchType !== 'missing';
    }

    return true;
  }

  prepResultsToSave(arr_enriched_transactions, key){

    if(arr_enriched_transactions.length == 0) {
      console.log('no transactions to save');
      return;
    }

    //go through enriched trasnactions, edit the raw transactions to store the data,
    //then save them
    var transactions_to_save = [];

    for(var i = 0; i < arr_enriched_transactions.length; i++){

      var reformated_transaction = arr_enriched_transactions[i].raw;
      let next = reformated_transaction.next;

      if(next[0]){
        if(key == 'shopped'){
          let outcome = this.getOutcome(arr_enriched_transactions[i].extra);

          if(!shopping.canChangeOutcome(reformated_transaction)){
            console.log(reformated_transaction._id, 'Outcome === missing. Updates not allowed.');
            continue;
          }

          if(!shopping.outcomeChanged(reformated_transaction, outcome)){
            console.log(reformated_transaction._id, 'Same outcome. Not saving.');
            continue;
          }

          next[0].picked = {
            _id:new Date().toJSON(),
            basket:arr_enriched_transactions[i].extra.fullBasket,
            repackQty: next[0].pended.repackQty ? next[0].pended.repackQty : (reformated_transaction.qty.to ? reformated_transaction.qty.to : reformated_transaction.qty.from),
            matchType:outcome,
            user:this.user,
          };

          next[0].pickedArchive = next[0].picked;

        } else if(key == 'unlock'){

          delete next[0].picked

        } else if(key == 'lockdown'){

          next[0].picked = {}

        }
      }

      reformated_transaction.next = next
      transactions_to_save.push(reformated_transaction)

    }

    if(!transactions_to_save.length){
      console.log('no transactions to save');
      return;
    }

    return transactions_to_save
  }


//------------------Button controls-------------------------

  saveBasketNumber() {
    console.log('saveBasketNumber called', this.shoppingIndex, this.shopList[this.shoppingIndex], this.shopList);

    //this.basketSaved = true
    this.shopList[this.shoppingIndex].extra.fullBasket = this.shopList[this.shoppingIndex].extra.basketLetter + this.shopList[this.shoppingIndex].extra.basketNumber

      if ((this.shopList[this.shoppingIndex].extra.basketLetter != 'G') && (this.currentCart != this.shopList[this.shoppingIndex].extra.basketNumber[0])) {
        this.currentCart = this.shopList[this.shoppingIndex].extra.basketNumber[0]
      }

      if (this.shopList[this.shoppingIndex].raw)
        this.gatherBaskets(this.shopList[this.shoppingIndex].raw.drug.generic);

      let extra = this.shopList[this.shoppingIndex].extra;

      const basket = {
        letter: extra.basketLetter,
        number: extra.basketNumber,
        fullBasket: extra.fullBasket
      };

      let idData = {
        _id: this.shopList[this.shoppingIndex].raw && this.shopList[this.shoppingIndex].raw._id,
        _rev:this.shopList[this.shoppingIndex].raw && this.shopList[this.shoppingIndex].raw._rev
      };

      this.db.account.picking.post({
        id: idData,
        groupName: this.groupName,
        basket: basket,
        action: 'save_basket_number'
      }).then(res => {
        let results = this.updateRevs([res]);

        if (Object.keys(results).length > 0) {
          this.basketSaved = true;
          this.addBasketToShoppingList(basket);
        }
      });

    this.setShoppingIndex(this.currentShoppingIndex());
  }

  currentShoppingIndex(){

    if(typeof this.shoppingIndex !== 'undefined' && this.shoppingIndex >= 0 && this.shoppingIndex <= this.shopListMaxIndex()){
      console.log('currentShoppingIndex dynamic', this.shoppingIndex, this.shopList)
      return this.shoppingIndex;
    }

    console.log('currentShoppingIndex dynamic', 'groupData', this.groupData, 'shopList', this.shopList)
    return this.groupData ? this.groupData.pickedTransactions : 0;
  }

  //returns a strng that looks like ,BASKET,BASKET,.... so that the html can easily push the current item's basket to the front
  gatherBaskets(generic){
    let list_of_baskets = ''
    for(var i = 0; i < this.shopList.length; i++){
      if(
        (this.shopList[i].extra.fullBasket)
        && (!(~ list_of_baskets.indexOf(this.shopList[i].extra.fullBasket)))
        && ( ! this.shopList[i].raw || this.shopList[i].raw.drug.generic == generic))
            list_of_baskets += ',' + (this.shopList[i].extra.fullBasket)
    }
    this.currentGenericBaskets = list_of_baskets
  }

  addBasket(index){
    if(!this.shopList || !this.shopList[index]) {
      console.error('addBasket() but this.shopList is not set', this.shopList, index)
      return;
    }

    //this.focusInput('#basket_number_input') //This wasn't quite working, but autofocus works if you click basket, just not on the first screen which is frustrating
    this.basketSaved = false;

    if(this.shopList[index].extra.basketLetter != 'G') {
      this.shopList[index].extra.basketNumber = this.currentCart
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  moveShoppingForward(){

    if((this.getOutcome(this.shopList[this.shoppingIndex].extra) == 'missing') && (this.shopList[this.shoppingIndex].extra.saved != 'missing')){

      this.formComplete = false; //to disable the button
      this.setNextToLoading()

      console.log("missing item! sending request to server to compensate for:", this.shopList[this.shoppingIndex].raw.drug.generic)

      this.db.account.picking['post']({
            groupName:this.shopList[this.shoppingIndex].raw.next[0].pended.group,
            action:'missing_transaction',
            ndc:this.shopList[this.shoppingIndex].raw.drug._id,
            generic:this.shopList[this.shoppingIndex].raw.drug.generic,
            qty:this.shopList[this.shoppingIndex].raw.qty.to,
            repackQty:this.shopList[this.shoppingIndex].raw.next[0].pended.repackQty
          }).then(res =>{

        if(res.length > 0){

          this.shopList[this.shoppingIndex].extra.saved = 'missing'; //if someone goes back through items, dont want to retry this constantly

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

    }
    else {
      this.advanceShopping()
    }
  }

  advanceShopping(){
    if(this.shoppingIndex == this.shopList.length-1){ //then we're finished

      //if(this.getOutcome(this.shopList[this.shoppingIndex].extra) != 'missing') this.resetShopper()

      this.saveShoppingResults([this.shopList[this.shoppingIndex]], 'shopped').then(_=>{

        console.log('advanceShopping', _)
        //remove this group
        this.refreshPendedGroups();
        this.loadGroupSelectionPage();
        this.resetShopper();//put in here to avoid race condition of reloading before the saving completes
      });

      //cut it out of the list, just until it refreshes anymay
      for(var i = this.groups.length -1 ; i >= 0; i--){
        if(this.groups[i].name == this.shopList[this.shoppingIndex].raw.next[0].pended.group){
          this.groups.splice(i,1)
          break;
        }
      }

 //and send them back to the list, which'll update while they're there

    }
    else {

      if(!this.shopList[this.shoppingIndex + 1].extra.fullBasket){
        if(this.shopList[this.shoppingIndex].raw.drug.generic == this.shopList[this.shoppingIndex + 1].raw.drug.generic)
        {
          this.shopList[this.shoppingIndex + 1].extra.basketLetter = this.shopList[this.shoppingIndex].extra.basketLetter //push that forward if they changed it at some point
          this.shopList[this.shoppingIndex + 1].extra.fullBasket = this.shopList[this.shoppingIndex].extra.fullBasket
        }
        else
          {
          this.addBasket(this.shoppingIndex + 1)
        }
      }
      else if( this.shopList[this.shoppingIndex].raw && this.shopList[this.shoppingIndex + 1].raw && this.shopList[this.shoppingIndex].raw.drug.generic != this.shopList[this.shoppingIndex + 1].raw.drug.generic)
      {
        this.gatherBaskets(this.shopList[this.shoppingIndex + 1].raw.drug.generic)
      }

       //save at each screen. still keeping shoping list updated, so if we move back and then front again, it updates
      console.log('saving transaction', this.shopList[this.shoppingIndex]);
      this.saveShoppingResults([this.shopList[this.shoppingIndex]], 'shopped').then(_ => {
        console.log('saved transaction', this.shopList[this.shoppingIndex], _);
        this.setShoppingIndex(this.shoppingIndex + 1);
      });
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

  setPickingStepUrl(stepNumber){
    if(!this.isValidGroupName()){
       console.log('not setting step ' + stepNumber);
       return false;
    }

    const url = `#/picking/${this.groupName}/step/${stepNumber}`;

    if(this.pickingOnloadFired === true){
      history.pushState(null, null, url);
    }
    else {
      console.log('replacing state');
      history.replaceState(null, null, url);
      this.pickingOnloadFired = true;
    }
  }

  isValidGroupName(){
    const isValid =  !!this.groupName && this.groupName.length && this.groupName !== 'undefined';

    // if(!isValid){
    //   console.log(this.groupName);
    //   console.log('Invalid group name');
    //   console.log(window.location.href);
    //   console.trace();
    // }

    return isValid;
  }

  loadGroupSelectionPage(){

    const reload = window.location.hash !== '#/picking';

    history.replaceState(null, null, `#/picking`);

    if(reload === true){
      window.location.reload();
    }
  }

  setShoppingIndex(index){

    if(index !== 0 && !index){
      alert('no index');
      console.trace();
      return false;
    }

    if(!this.isValidGroupName()){
      this.loadGroupSelectionPage();
      return false;
    }

    console.log(`setShoppingIndex requesting : ${this.groupName}/${index + 1}/${index} (group/step/shoppingIndex)`);

    let goToIndex = () => {

      console.log('goToIndex', 'new', index, 'old', this.shoppingIndex);
      console.log('goToIndex', this.groupData);
      console.log('goToIndex', this.shopList[index]);
      console.log('goToIndex', this.shopList[index].raw.drug.generic);

      this.shoppingIndex = index;

      let genericName = this.shopList[index].raw.drug.generic.replace(/\s/g, '');

      if(this.basketSaved !== true){
        this.basketSaved = this.groupData.baskets && this.groupData.baskets.length
            && this.groupData.basketsByGeneric[genericName] && this.groupData.basketsByGeneric[genericName].length;
      }

      console.log('setShoppingIndex picking.basketSaved ', this.basketSaved);

      //if they have already chosen as basket take them to the first incomplete step
      if(index < 0 && this.basketSaved){
        this.shoppingIndex = this.currentShoppingIndex();
      }

      if(this.basketSaved && this.groupData.basketsByGeneric && this.groupData.basketsByGeneric[genericName]){
        let basket = this.groupData.basketsByGeneric[genericName].slice(-1);
        this.addBasketToShoppingList(basket);
      }
      if(this.shoppingIndex === this.shopList.length-1){
        this.setNextToSave()
      } else {
        this.setNextToNext()
      }

      this.formComplete = !!(this.shopList[this.shoppingIndex].extra.fullBasket) && this.someOutcomeSelected(this.shopList[this.shoppingIndex].extra.outcome) //if returning to a complete page, don't grey out the next/save button
      console.log('setShoppingIndex formComplete', this.formComplete);
      this.setPickingStepUrl(this.shoppingIndex+1);

    };

//when the group loads, go to the first incomplete step, don't go to the basket page (unless no steps are complete)
    if(!this.shopList.length){

      this.db.account.picking.post({groupName:this.groupName, action:'load'}).then(res =>{

        if ( ! res.groupData || ! res.shopList) {
            console.error(res)
            throw res
        }

        this.groupData = res.groupData;
        this.shopList = res.shopList;
        this.initializeShopper();
        goToIndex();
      });
    }
    else {
      goToIndex();
    }

  }

  shopListMaxIndex(){
    return this.shopList.length - 1;
  }

  numShopItems(){
    return this.shopList.length;
  }

  moveShoppingBackward(){
    if(this.shoppingIndex == 0) return //shouldn't appear, but extra protection :)

    if(this.shopList[this.shoppingIndex - 1].raw && this.shopList[this.shoppingIndex].raw && this.shopList[this.shoppingIndex - 1].raw.drug.generic != this.shopList[this.shoppingIndex].raw.drug.generic)
        this.gatherBaskets(this.shopList[this.shoppingIndex - 1].raw.drug.generic)

    this.setShoppingIndex(this.shoppingIndex -= 1);
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
    if(!rawStr)
      return null;

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
