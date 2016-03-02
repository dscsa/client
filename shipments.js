//TODO
//Autofocus on new drug
//Disable From/To based on Filter's switch

import {inject}     from 'aurelia-framework';
import {Router}     from 'aurelia-router';
import {Db}         from 'db/pouch'
import {HttpClient} from 'aurelia-http-client';

//@pageState()
@inject(Db, Router, HttpClient)
export class shipments {

  constructor(db, router, http){
    this.db      = db
    this.account = db.users(true).session().account
    this.drugs   = []
    this.router  = router
    this.http    = http
    this.stati   = ['pickup', 'shipped', 'received']
  }

  activate(params) {

    //let search = this.db.search.then(_ => this.searchReady = true)

    return Promise.all([
      //Start all of our async tasks
      this.db.accounts({state:this.account.state, _id:{$lt:this.account._id}}),   //TODO to = $elemMatch:this.account._id, from = $in:this.account.authorized
      this.db.accounts({state:this.account.state, _id:{$gt:this.account._id}}),   //TODO to = $elemMatch:this.account._id, from = $in:this.account.authorized
      this.db.shipments({'account.from._id':this.account._id}),
      this.db.shipments({'account.to._id':this.account._id})
    ])
    .then(([ltAccounts, gtAccounts, from, to]) => {
      //Stupid hack because pouchdb find doesn't seem to support $ne or $or properly
      this.accounts  = ['', ...ltAccounts, ...gtAccounts]
      this.shipments = {from, to}
      this.role      = {account:'from', partner:'to'}

      //Keep url concise by using the last segment of the id
      let shipment, filter = function(s) {
        return s._id && s._id.split('.')[2] === params.id
      }

      //create a "new shipment" for "from" and select it by default
      //note that new accounts might have no actual shipments.
      //If shipment id exists then switch to the correct role
      this.addShipment()

      if (params.id) {
        shipment = to.filter(filter)[0]
        if (shipment)
          this.role = {account:'to', partner:'from'}
        else
          shipment = from.filter(filter)[0]
      }
      this.selectShipment(shipment || from[0])
    })
  }

  //Activated from constructor and each time a shipment is selected
  selectShipment(shipment) {
    this.shipment   = shipment
    this.attachment = null

    let url = 'shipments'
    if (shipment._id)
      url += '/'+shipment._id.split('.')[2]
    this.router.navigate(url, { trigger: false })
    this.resetShipment()

    this.db.transactions({'shipment._id':shipment._id || this.account._id})
    .then(transactions => {
      this.transactions = transactions
      this.diffs  = [] //Check boxes of verified, and track the differences
      this.checkmarks = this.transactions
        .map((o,i) => o.verifiedAt ? i : null)
        .filter(_ => _ != null)
    })

    .catch(console.log)
  }

  swapRole() { //Swap donor-donee roles
    var temp          = this.role.partner
    this.role.partner = this.role.account
    this.role.account = temp
    this.selectShipment(this.shipments[this.role.account][0])
  }

  //Tracking and Shipment start off the same but can diverge
  //this allows methods to reset them back to the same value
  resetShipment() {
    this.tracking = this.shipment
    this.setAccounts()
  }

  //Selected to != shipment.to because they are not references
  //we need to manually find the correct from based on selected shipment
  setAccounts() {
    this.to = this.accounts.filter(to => {
      //console.log('to', to, 'track', this.tracking.account)
      return to._id == this.tracking.account.to._id
    })[0]

    this.from = this.accounts.filter(from => {
      //console.log('from', from, 'track', this.tracking.account)
      return from._id == this.tracking.account.from._id
    })[0]
  }

  //Status is the highest stati with a truthy date
  getStatus() {
    return this.stati.reduce((prev, curr) => {
      return this.shipment[curr+'At'] ? curr : prev
    })
  }

  //Called on constructor() and create() to ensure user can always add a new label.
  addShipment() {
    this.shipments.from.unshift({
      tracking:'New Tracking #',
      status:"pickup",
      pickupAt:null,
      shippedAt:null,
      receivedAt:null,
      account:{
        to: {
          _id:this.account._id,
          name:this.account.name
        },
        from:{}
      }
    })
  }

  //Save the donation if someone changes the status/date
  saveShipment() {
    //If dates were set, status may have changed
    this.shipment.status = this.getStatus()
    //Save an existing shipment
    console.log('saving', this.shipment)
    return this.db.shipments.put(this.shipment)
    //TODO reschedule pickup if a date was changed
  }

  setAttachment(attachment) {
    attachment._id  = this.attachment.name
    attachment._rev = this.shipment._rev
    this.db.shipments({_id:this.shipment._id})
    .attachment(attachment)
    .then(res => {
      this.shipment._rev   = res.rev
      this.attachment.type = attachment.type
      //TODO use service worker to rename this URL so title bar isn't nasty
      //http://stackoverflow.com/questions/283956/is-there-any-way-to-specify-a-suggested-filename-when-using-data-uri
      this.attachment.url  = URL.createObjectURL(attachment)
      console.log('setAttachment', attachment, _)
    })
  }

  getAttachment() {
    this.db.shipments({_id:this.shipment._id})
    .attachment(this.attachment.name)
    .then(attachment => {
      this.attachment.type = attachment.type
      this.attachment.url  = URL.createObjectURL(attachment)
      console.log('getAttachment', attachment, this.attachment.url)
    })
    .catch(this.attachment.url = null)
  }

  qtyShortcuts(transaction, $event, $index) {
    //Enter should refocus on the search
    if ($event.which == 13) {
      document.querySelector('md-autocomplete input').focus()
    }

    //Delete an item in the qty is 0.  Instead of having a delete button
    if (
      (! transaction.qty.from && transaction.qty.to === "0") ||
      (transaction.qty.from === "0" && ! transaction.qty.to)
    ) {
      console.log('before remove', transaction)
      this.db.transactions.remove(transaction)
      .then(_ => this.transactions.splice($index, 1))
    }

  }

  check($index) {
    //with binding check array stayed same length and
    //just had falsey values, which we had to check for
    //in the "Save Selected for Inventory" button, move(),
    //and create().  Better just to change length manually

    let i = this.checkmarks.indexOf($index)
    ~ i ? this.checkmarks.splice(i, 1)
      : this.checkmarks.push($index)

    let j = this.diffs.indexOf($index)
    ~ j ? this.diffs.splice(j, 1)
      : this.diffs.push($index)

    return true //Continue to bubble event, so checkmark actually appears
  }

  //Move these items to a different "alternative" shipment then select it
  //TODO need to select the new shipment once user confirms the move
  moveShipment() {
    //Confirm with user if we are moving items between existing shipments.
    //if user cancels then revert the tracking# back to the original value
    //do not confirm if moving items from inventory into a specific donation
    if(
        this.shipment._id && this.shipment._id != this.tracking._id &&
        ! confirm(`Move selected items from #${this.shipment.tracking} to #${this.tracking.tracking}? This operation cannot be undone!`)
      )
      return this.resetShipment()

    //Change all selected transactions to the new or existing shipment
    //If new, tracking._id is not set but shipment._id was just set
    for (let i of this.checkmarks) {
      this.transactions[i].shipment = {_id:this.tracking._id || this.shipment._id}
      this.db.transactions.put(this.transactions[i])
    }

    //Display existing shipment or the newly created shipment
    this.selectShipment(this.tracking._id ? this.tracking : this.shipment)
  }

  createShipment() {

    if ( ! this.checkmarks.length && ! confirm('You have not selected any items.  Are you sure you want to create an empty shipment?'))
      return

    //Store some account information in the shipment but not everything
    this.shipment.account.to   = {_id:this.to._id, name:this.to.name}
    this.shipment.account.from = { _id:this.from._id, name:this.from.name}
    delete this.shipment.tracking //get rid of New Tracking# to have one assigned

    //Create shipment then move inventory transactions to it
    console.log('adding', this.shipment)
    this.db.shipments.post(this.shipment).then(shipment => {
      console.log('new shipment info', shipment, this.shipment, this.tracking, this.shipments)
      this.shipments.from = this.shipments.from.slice()
      this.shipments.to = this.shipments.to.slice()
      Object.assign(this.shipment, shipment)
      this.addShipment() //Add a new shipment button in case user wants to add another
      this.moveShipment()
    })
  }

  saveInventory() {
    //__array_observer__ is an enumerable key in this.transactions here
    //for some reason. Current code catches this bug but be careful.
    for (let i of this.diffs) {
      let method = this.transactions[i].verifiedAt ? 'asDelete' : 'asPost'
      this.http.createRequest('//localhost:3000/transactions/'+this.transactions[i]._id+'/verified')
      .withCredentials(true)[method]().send().catch(_ => _) //empty catch because failed post requests alrady appear in console
    }
    this.diffs = []
  }

  search() {

    let term = this.term.toLowerCase().trim()

    if (term.length < 3)
      return this.drugs = []

    console.log('searching for...', term)
    let start = Date.now()
    if (/^[\d-]+$/.test(term)) {
      this.regex = RegExp('('+term+')', 'gi')
      return this.db.drugs({ndc:term}).then(drugs => {
        console.log('drug ndc search', drugs.length, Date.now() - start, drugs)
        this.drugs = drugs
      })
    }

    return this.db.drugs({generic:term}).then(drugs => {
      this.regex = RegExp('('+term.replace(/ /g, '|')+')', 'gi')
      console.log('drugs', Date.now() - start, drugs)
      this.drugs = drugs
    })

    // return this.db.drugs({generic:term}).then(drugs => {
    //   this.regex = RegExp('('+term.replace(/ /g, '|')+')', 'gi')
    //   console.log('drugs', Date.now() - start, drugs)
    //   this.drugs = drugs
    // })

    // let start = Date.now()
    // return this.db.drugs.query('drug/search', {startkey:term, endkey:term+'\uffff'}).then(_ => {
    //   console.log(_.length, 'results for', term, 'in', Date.now()-start, _)
    //   this.drugs = _.map(val => val.value)
    // })
    // if (/^[\d-]+$/.test(term)) {
    //   this.regex = RegExp('('+term+')', 'gi')
    //   this.drugs = this.db.search.ndc(term)
    //
    // } else {
    //   this.regex = RegExp('('+term.replace(/ /g, '|')+')', 'gi')
    //   this.drugs = this.db.search.generic(term)
    // }
  }

  autocompleteShortcut($event) {
    if ($event.which == 13)
      this.addTransaction(this.drugs[0])
  }

  selectRow($index) {
    document.querySelector('#exp_'+$index+' input').focus()
  }

  saveTransaction(transaction, $event, form) {

    var data = {
      message: 'Button color changed.',
      timeout: 2000
    };

    this.snackbar.show(data)

    //Do not save if clicking around within the same drug.
    if (form.contains($event.relatedTarget))
      return

    //TODO only save if change occured
    console.log('saving', transaction)
    return this.db.transactions.put(transaction)
  }

  addTransaction(drug) {
    let transaction = {
      drug:{
        _id:drug._id,
        generics:drug.generics,
        form:drug.form,
        retail:drug.retail,
        wholesale:drug.wholesale,
      },
      qty:{from:null, to:null},
      lot:{from:null, to:null},
      exp:{from:null, to:null}
    }

    if (this.shipment._id)
      transaction.shipment = {_id:this.shipment._id}

    console.log('addTransaction', drug, transaction)
    return this.db.transactions.post(transaction)
    .then(transaction => {
      this.transactions.unshift(transaction) //Add the drug to the view
      this.term = ''    //Reset search's auto-complete
      setTimeout(_ => this.selectRow(0), 100) // Select the row.  Wait for repeat.for to refresh
    })
  }
}


//
// Value Converters
//

export class filterValueConverter {
  toView(transactions = [], filter = ''){
    filter = filter.toLowerCase()
    return transactions.filter(transaction => {
      return ~ `${transaction.account.to.name} ${transaction.tracking} ${transaction.status}`.toLowerCase().indexOf(filter)
    })
  }
}

export class valueValueConverter {
  toView(transactions = [], filter='') {
    return transactions.reduce((a, b) => { (b.drug.retail || {}).price+a}, 0)
  }
}

export class drugNameValueConverter {
  toView(drug, regex){
    let generic = drug.generics.map(generic => generic.name+" "+generic.strength).join(', ')+' '+drug.form
    return generic.replace(regex, '<strong>$1</strong>') + (drug.brand ? ' ('+drug.brand+')' : '')
  }
}
