import {inject}     from 'aurelia-framework'
import {Router}     from 'aurelia-router'
import {Pouch}         from '../libs/pouch'
import {HttpClient} from 'aurelia-http-client'
import {csv}        from '../libs/csv'
import {canActivate, expShortcuts, qtyShortcuts, incrementBin, saveTransaction, focusInput, scrollSelect, toggleDrawer, drugSearch, waitForDrugsToIndex} from '../resources/helpers'

//@pageState()
@inject(Pouch, Router, HttpClient)
export class shipments {

  constructor(db, router, http){
    this.csv    = csv
    this.db     = db
    this.drugs  = []
    this.router = router
    this.http   = http
    this.stati  = ['pickup', 'shipped', 'received']
    this.shipments = {}
    this.term  = ''

    this.waitForDrugsToIndex = waitForDrugsToIndex
    this.expShortcutsKeydown = expShortcuts
    this.qtyShortcutsKeydown = qtyShortcuts
    this.incrementBin    = incrementBin
    this.saveTransaction = saveTransaction
    this.focusInput      = focusInput
    this.scrollSelect    = scrollSelect
    this.toggleDrawer    = toggleDrawer
    this.drugSearch      = drugSearch
    this.canActivate     = canActivate
  }

  activate(params) {
    return this.db.user.session.get()
    .then(session  => {
      this.user = session._id
      return this.db.account.get(session.account._id)
    })
    .then(account => {
      this.account = {_id:account._id, name:account.name}
      this.ordered = {[account._id]:account.ordered}

      //TODO From View
      //Get all accounts that this account has authorized
      //let doneeAccounts = this.db.account.allDocs({keys:account.authorized, include_docs:true})
      //let shipmentsSent = this.db.shipment.query({'account.from._id':account._id})

      //let recipientAccounts    = this.db.account.query('authorized', {key:account._id, include_docs:true}) //Get all accounts that have authorized this account
      let senderAccounts    = this.db.account.allDocs({keys:account.authorized, include_docs:true})
      let shipmentsReceived = this.db.shipment.allDocs({startkey:account._id+'\uffff', endkey:account._id, descending:true, include_docs:true}) //Get all shipments to this account
      return Promise.all([senderAccounts, shipmentsReceived]).then(all => {

        [{rows:senderAccounts}, {rows:shipmentsReceived}] = all

        //This abbreviated denormalized account information will be assigned to account.to/from
        let selected, map = {to:{},from:{}}

        this.accounts  = {
          from:[''].concat(senderAccounts.map(({doc}) => {
            this.ordered[doc._id] = doc.ordered
            return map.from[doc._id] = {_id:doc._id, name:doc.name}
          }))
        }

        //for (let account of recipientAccounts) makeMap(recipientMap, account)
        //to:['', ...Object.keys(toMap).map(key => toMap[key])]

        //Selected account != shipment.account.to because they are not references
        this.shipment = {}
        //, sent:shipmentsSent}
        //shipmentsSent.forEach(makeReference)
        //console.log('this.accounts', this.accounts)
        //Sneak this in since we are already making the loop
        let accountRef = role => {
         return ({doc}) => {
           this.setStatus(doc)

           if (map[role][doc.account[role]._id])
             doc.account[role] = map[role][doc.account[role]._id]

           // if (toMap[doc.account.from._id])
           //   doc.account.from = toMap[doc.account.from._id]
           if (params.id === doc._id)
             selected = doc

           return doc
         }
        }

        //Sent shipments get references to toAccount (since fromAccount will always be us)
        //this.shipments.from = shipmentsSent.map(accountRef('to'))


        this.role = selected //switch default role depending on shipment selection
        ? {accounts:'to', shipments:'from'}
        : {accounts:'from', shipments:'to'}

        //Received shipments get references to fromAccount (since toAccount will always be us)
        this.shipments.to = shipmentsReceived.map(accountRef('from'))

        this.selectShipment(selected)
        //this.waitForDrugsToIndex()
      })
      .catch(err => console.log('promise all err', err))


      //this.db.account.find({selector:{authorized:account._id}})
      // return Promise.all([
      //   //Start all of our async tasks
      //   this.db.account.get({authorized:accounts[0]._id}),
      //   this.db.account.get({_id:{$gt:null, $in:accounts[0].authorized}}),
      //   this.db.shipment.get({'account.from._id':accounts[0]._id}), //TODO this should be duplicative with _security doc.  We should be able to do _all_docs or no selector
      //   this.db.shipment.get({'account.to._id':accounts[0]._id})
      // ])
    })
    // .then(([fromAccounts, toAccounts, fromShipments, toShipments]) => {
    //
    // })
  }

  //Activated by activate() and each time a shipment is selected from drawer
  selectShipment(shipment, toggleDrawer) {
    if (toggleDrawer)
      this.toggleDrawer()

    if ( ! shipment) return this.emptyShipment()
    this.setUrl('/'+shipment._id)
    this.setShipment(shipment)
    this.setTransactions(shipment._id)
  }

  emptyShipment() {
    this.setUrl('')

    if (this.role.shipments == 'to') {  //shipments received
      this.setShipment({account:{to:this.account, from:{}}})
      this.setTransactions()
    } else { //shipments sent
      this.setShipment({account:{from:this.account, to:{}}})
      this.setTransactions(this.account._id)
    }
  }

  setShipment(shipment) {
    this.shipment     = shipment
    this.shipmentId   = shipment._id  //freeze this if user started playing with "move shipment" select
    this.attachment   = null
  }

  setUrl(url) {
    this.router.navigate('shipments'+url, { trigger: false})
  }

  setTransactions(shipmentId) {

    this.diffs = [] //Newly checked or unchecked checkboxes. Used to disable buttons if user has not done anything yet

    if ( ! shipmentId)
      return this.transactions = []

    this.db.transaction.query('shipment._id', {key:[this.account._id, shipmentId], include_docs:true, descending:true}).then(res => {
      this.transactions = res.rows.map(row => row.doc)
      this.setCheckboxes()
    })
    .catch(err => console.log('err', err))
  }

  setCheckboxes() {
    for (let transaction of this.transactions) {
      transaction.isChecked = this.shipmentId == this.shipment._id ? transaction.verifiedAt : null
    }
  }

  setStatus(shipment) {
    shipment.status = this.stati.reduce((prev, curr) => shipment[curr+'At'] ? curr : prev)
  }

  swapRole() { //Swap donor-donee roles
    [this.role.accounts, this.role.shipments] = [this.role.shipments, this.role.accounts]
    this.selectShipment()
    return true
  }

  //Save the donation if someone changes the status/date
  saveShipment() {
    //don't want to save status, but deleting causes weird behavior
    //so instead copy the shipment and delete from copy then assign new rev
    return this.db.shipment.put(this.shipment).then(res => {
      this.setStatus(this.shipment)
    })
    //TODO reschedule pickup if a date was changed
  }

  //Move these items to a different "alternative" shipment then select it
  //TODO need to select the new shipment once user confirms the move
  moveTransactionsToShipment(shipment) {
    //Change all selected transactions to the new or existing shipment
    Promise.all(this.transactions.map(transaction => {
      if (transaction.isChecked) {
        transaction.shipment = {_id:shipment._id}
        return this.db.transaction.put(transaction)
      }
    }))
    .then(_ => this.selectShipment(shipment)) //Display existing shipment or the newly created shipment
  }

  //Create shipment then move inventory transactions to it
  createShipment() {
    if (this.shipment.tracking == 'New Tracking #')
      delete this.shipment.tracking

    //For some reason if you move this unshift() later, into the .then(), it will clear out the shipment
    //TODO investigate why this is true?  Is it the filter function that causes problems?
    this.shipments[this.role.shipments].unshift(this.shipment)
    this.setStatus(this.shipment)

    this.db.shipment.post(this.shipment)
    .then(res => this.moveTransactionsToShipment(this.shipment)) //_id is needed for move but has not been set until now
    .catch(err => console.error('createShipment error', err, this.shipment))
  }

  //Split functionality into Keydown and Input listeners because (keydown is set in constructor)
  //Don't put this code into input because enter (which == 13) does not trigger input event.
  //Don't put input code here because would then need a setTimeout for the quantity to actually change
  //and you would need to ignore non-input key values.  So it cleaner to just keep these listeners separate
  expShortcutsInput($index) {
    this.autoCheck($index)
  }

  //Split functionality into Keydown and Input listeners because (keydown is set in constructor)
  //Don't put this code into input because enter (which == 13) does not trigger input event.
  //Don't put input code here because would then need a setTimeout for the quantity to actually change
  //and you would need to ignore non-input key values.  So it cleaner to just keep these listeners separate
  qtyShortcutsInput($event, $index) {
    //Only run autocheck if the transaction was not deleted
    this.removeTransactionIfQty0($event, $index) && this.autoCheck($index)
  }

  removeTransactionIfQty0($event, $index) {
    //Delete an item in the qty is 0.  Instead of having a delete button

    let transaction = this.transactions[$index]
    let doneeDelete = ! transaction.qty.from && transaction.qty.to === 0
    let donorDelete = ! transaction.qty.to   && transaction.qty.from === 0

    if ( ! donorDelete && ! doneeDelete)
      return true

    this.drugs = [] //get rid of previous results since someone might press enter and accidentally readd the same drug
    this.transactions.splice($index, 1) //Important to call splice before promise resolves since it will cancel the saveTransaction which would cause a conflict
    //TODO get rid of this.diff as well in case this transaction was selected
    this.db.transaction.remove(transaction)
    this.focusInput(`md-autocomplete`)
  }


  binShortcuts($event, $index) {
    if ($event.which == 13)
      return this.focusInput(`md-autocomplete`)

    return this.incrementBin($event, this.transactions[$index])
  }

  getBin(transaction) {
    return (this.getOrder(transaction) || {}).defaultBin || this._bin
  }

  setBin(transaction) {
    if (this.getBin(transaction) != transaction.bin)
      this._bin = transaction.bin //Only prepopulate non-default bins into next transaction
  }

  aboveMinQty(order, transaction) {
    let qty = transaction.qty[this.role.shipments]
    if ( ! qty) return false
    console.log('aboveMinQty', transaction)
    let price      = transaction.drug.price.goodrx || transaction.drug.price.nadac || 0
    let defaultQty = price > 1 ? 1 : 1 //keep expensive meds
    let aboveMinQty = qty >= Math.min(+order.minQty || defaultQty, 10) //change #1 of 2: temp min() to help stock boxes in GA
    if ( ! aboveMinQty) console.log('Ordered drug but qty', qty, 'is less than', +order.minQty || defaultQty)
    return qty >= Math.min(+order.minQty || defaultQty, 10) //change #2 of 2: temp min() to help stock boxes in GA
  }

  aboveMinExp(order, transaction) {
    let exp = transaction.exp[this.role.shipments]
    if ( ! exp) return ! order.minDays
    let minDays = order.minDays || 60
    let aboveMinExp = new Date(exp) - Date.now() >= minDays*24*60*60*1000
    if ( ! aboveMinExp) console.log('Ordered drug but expiration', exp, 'is before', minDays)
    return aboveMinExp
  }

  belowMaxInventory(order, transaction) {
    let newInventory = transaction.qty[this.role.shipments] + order.inventory
    let maxInventory = order.maxInventory || 3000
    let belowMaxInventory = isNaN(newInventory) ? true : newInventory < maxInventory //in case of an inventory error let's keep the drug
    if ( ! belowMaxInventory) console.log('Ordered drug but inventory', newInventory, 'would be above max of', maxInventory) //
    return belowMaxInventory
  }

  getOrder(transaction) {
    return this.ordered[this.shipment.account.to._id][transaction.drug.generic]
  }

  isWanted(order, transaction) {
    return order ? this.belowMaxInventory(order, transaction) && this.aboveMinQty(order, transaction) && this.aboveMinExp(order, transaction) : false
  }

  //If qty is 30 and user types "3" then destroyed message will display before user can type "0"
  //this code puts a delay on the destroyed message and then clears it out if the user does type a "0"
  //an alternative would be wait to trigger autocheck until enter is pressed but this would delay all messages
  setDestroyedMessage(order) {
    if (order && order.destroyedMessage && ! this.destroyedMessage)
      this.destroyedMessage = setTimeout(_ => {
        delete this.destroyedMessage
        this.snackbar.show(order.destroyedMessage)
      }, 500)
  }

  clearDestroyedMessage() {
    clearTimeout(this.destroyedMessage)
    delete this.destroyedMessage
  }

  //TODO should this only be run for the recipient?  Right now when donating to someone else this still runs and displays order messages
  autoCheck($index) {
    let transaction = this.transactions[$index]
    let isChecked   = transaction.isChecked
    let order       = this.getOrder(transaction)

    if(this.isWanted(order, transaction) == isChecked)
      return ! isChecked && transaction.qty.to > 0 && this.setDestroyedMessage(order) //isChecked may have never alternated for a destroyed drug so need to check

    if (isChecked)
      this.setDestroyedMessage(order)

    if ( ! isChecked) {//manual check has not switched the boolean yet
      this.snackbar.show(order.verifiedMessage || 'Drug is ordered')
      this.clearDestroyedMessage()
    }

    this.manualCheck($index)
  }

  manualCheck($index) {
    let transaction = this.transactions[$index]
    transaction.isChecked = ! transaction.isChecked
    //If user is not moving items, the shipment exists, and they are the recipient, then autosave their verificaton
    //offsetParent is null when buttons are hidden.  This keeps us from duplicating the show logic of the buttons here
    this.moveItemsButton.offsetParent
      ? this.toggleSelectedCheck(transaction)
      : this.toggleVerifiedCheck(transaction)
  }

  toggleVerifiedCheck(transaction) {

    let verifiedAt = transaction.verifiedAt
    let bin = transaction.bin

    if (verifiedAt) {
      transaction.verifiedAt = null
      transaction.bin = null
    } else {
      transaction.verifiedAt = new Date().toJSON()
      transaction.bin = this.getBin(transaction)
    }

    this.saveTransaction(transaction).catch(err => {
      transaction.isChecked  = ! transaction.isChecked
      transaction.verifiedAt = verifiedAt
      transaction.bin = bin
    })
  }

  toggleSelectedCheck(transaction) {
    let index = this.diffs.indexOf(transaction)
    ~ index
      ? this.diffs.splice(index, 1)
      : this.diffs.push(transaction)
  }

  search() {
    this.drugSearch().then(drugs => {
      this.drugs = drugs
      this.drug  = drugs[0]
    })
  }

  //Enter in the autocomplete adds the selected transaction
  //TODO support up/down arrow keys to pick different transaction?
  autocompleteShortcuts($event) {

    this.scrollSelect($event, this.drug, this.drugs, drug => this.drug = drug)

    //Enter with a selected drug.  Force term to be falsey so a barcode scan which is entering digits does not trigger
    if ($event.which == 13) {//Barcode scan means search might not be done yet
      Promise.resolve(this._search).then(_ => this.addTransaction(this.drug))
      return false //Enter was also triggering exp to qty focus
    }

    if ($event.which == 106 || ($event.shiftKey && $event.which == 56)) //* clearing autocomplete field with an asterick (to match exp date clearing and make numberpad compatible)
      this.term = ""

    return true  //still allow typing into autocomplete
  }

  addTransaction(drug, transaction) {

    if ( ! drug)
      return this.snackbar.show(`Cannot find drug matching this search`)

    this.drug = drug

    if (drug.warning) //not imported from CSV
      this.dialog.showModal()

    transaction = transaction || {
      qty:{from:null, to:null},
      exp:{
        from:this.transactions[0] ? this.transactions[0].exp.from : null,
        to:this.transactions[0] ? this.transactions[0].exp.to : null
      }
    }

    transaction.drug = {
      _id:drug._id,
      brand:drug.brand,
      generic:drug.generic,
      generics:drug.generics,
      form:drug.form,
      price:drug.price,
      pkg:drug.pkg
    }

    transaction.user       = {_id:this.user}
    transaction.shipment   = {_id:this.shipment._id || this.account._id}

    this.term = '' //Reset search's auto-complete

    //Assume db query works.
    this.transactions.unshift(transaction) //Add the drug to the view

    let order        = this.getOrder(transaction)
    let isPharMerica = false ///pharmerica.*/i.test(this.shipment.account.from.name)

    //We set current inventory when adding a new transaction.  This is a tradeoff of frequency vs accurracy.  This will be inaccurate
    //if user goes back and adjusts previous quantities to be higher since "updating" transaction would not trigger this code.  However,
    //this is rare enough to be okay.  We also don't want to have to fetch current inventory on every input event.
    order && this.db.transaction.query('inventory', {startkey:[drug.generic], endkey:[drug.generic+'\uffff']})
    .then(inventory => {
      console.log('inventory', inventory)
      order.inventory = inventory.rows[0] ? inventory.rows[0].value.total : 0
      console.log('order.inventory', order.inventory)
    })

    isPharMerica && ! order //Kiah's idea of not making people duplicate logs for PharMerica, saving us some time
      ? this.snackbar.show(`Destroy, record already exists`)
      : setTimeout(_ => this.focusInput('#exp_0'), 50) // Select the row.  Wait for repeat.for to refresh (needed for dev env not live)

    return this._saveTransaction = Promise.resolve(this._saveTransaction).then(_ => {
      return this.db.transaction.post(transaction)
      .catch(err => {
        this.snackbar.error(`Transaction could not be added: `, err)
        this.transactions.shift()
      })
    })
  }

  dialogClose() {
    this.dialog.close()
    this.focusInput('#qty_0')
  }

  exportCSV() {
    let name = 'Shipment '+this.shipment._id+'.csv'
    this.csv.fromJSON(name, this.transactions.map(transaction => {
      return {
        '':transaction,
        'next':JSON.stringify(transaction.next || []),
        'drug._id':" "+transaction.drug._id,
        'drug.generics':transaction.drug.generics.map(generic => generic.name+" "+generic.strength).join(';'),
        shipment:this.shipment
      }
    }))
  }

  importCSV() {
    this.csv.toJSON(this.$file.files[0], parsed => {
      this.$file.value = ''
      return Promise.all(parsed.map(transaction => {
        transaction._err        = undefined
        transaction._id          = undefined
        transaction._rev         = undefined
        transaction.shipment._id = this.shipment._id
        transaction.next         = JSON.parse(transaction.next)
        //This will add drugs upto the point where a drug cannot be found rather than rejecting all
        return this.db.drug.get(transaction.drug._id)
        .then(drug => this.addTransaction(drug, transaction))
        .then(_ => undefined) //do not download successes
        .catch(err => {
          transaction._err = 'Upload Error: '+JSON.stringify(err)
          return transaction //do download errors
        })
      }))
    })
    .then(rows => this.snackbar.show('Import Succesful'))
    .catch(err => this.snackbar.error('Import Error', err))
  }

  // setAttachment(attachment) {
  //   attachment._id  = this.attachment.name
  //   attachment._rev = this.shipment._rev
  //   this.db.shipment.attachment.put({_id:this.shipment._id, attachment:attachment})
  //   .then(res => {
  //     this.shipment._rev   = res.rev
  //     this.attachment.type = attachment.type
  //     //TODO use service worker to rename this URL so title bar isn't nasty
  //     //http://stackoverflow.com/questions/283956/is-there-any-way-to-specify-a-suggested-filename-when-using-data-uri
  //     this.attachment.url  = URL.createObjectURL(attachment)
  //     console.log('setAttachment', attachment, _)
  //   })
  // }
  //
  // getAttachment() {
  //   this.db.shipment.attachment.get({_id:this.shipment._id, name:this.attachment.name})
  //   .then(attachment => {
  //     this.attachment.type = attachment.type
  //     this.attachment.url  = URL.createObjectURL(attachment)
  //     console.log('getAttachment', attachment, this.attachment.url)
  //   })
  //   .catch(this.attachment.url = null)
  // }
}
