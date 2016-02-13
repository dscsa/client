//TODO
//Autofocus on new drug
//Disable From/To based on Filter's switch

import {inject}     from 'aurelia-framework';
import {Router}     from 'aurelia-router';
import {Db}         from 'db/pouch'
import {drugs}      from 'search'
import {HttpClient} from 'aurelia-http-client';

//@pageState()
@inject(Db, drugs, Router, HttpClient)
export class shipments {

  constructor(db, drugs, router, http){
    this.db      = db
    this.account = db.users(true).session().account
    this.drugs   = drugs
    this.router  = router
    this.http    = http
    this.stati   = ['pickup', 'shipped', 'received']
  }

  activate(params) {
    //Keep url concise by using the last segment of the id
    function filter(s) {
      return s._id && s._id.split('.')[2] === params.id
    }
    return Promise.all([
      //Start all of our a sync tasks
      //TODO to = $elemMatch:this.account._id
      //TODO from = $in:this.account.authorized
      this.db.accounts({state:'FL'}),
      this.db.shipments({'account.from._id':this.account._id}),
      this.db.shipments({'account.to._id':this.account._id})
    ])
    .then(([accounts, from, to]) => {
      //TODO $ne didn't seem to work in version 0.7.0 of pouchdb-find
      this.accounts  = ['', ...accounts.filter(acc => acc._id != this.account._id)]
      this.shipments = {from, to}
      this.add()
      this.role = {account:'from', partner:'to'}
      //default is start with "from" because it is guaranteed to have at least one shipment
      //- a new shipment where as from might have nothing and cause a navigation error
      let shipment, _default = from[0]
      //If shipment id exists then switch to the correct role
      if (params.id) {
        shipment = to.filter(filter)[0]
        if (shipment)
          this.role = {account:'to', partner:'from'}
        else
          shipment = from.filter(filter)[0]
      }
      this.select(shipment || _default)
    })
  }

  //Activated from constructor and each time a shipment is selected
  select(shipment) {
    this.shipment   = shipment
    this.attachment = null

    let url = 'shipments'
    if (shipment._id)
      url += '/'+shipment._id.split('.')[2]
    this.router.navigate(url, { trigger: false })
    this.reset()

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

  swapRole() { //Swap roles
    var temp          = this.role.partner
    this.role.partner = this.role.account
    this.role.account = temp
    this.select(this.shipments[this.role.account][0])
  }

  //Tracking and Shipment start off the same but can diverge
  //this allows methods to reset them back to the same value
  reset() {
    this.tracking = this.shipment
    this.setAccounts()
  }

  //Selected to != shipment.to because they are not references
  //we need to manually find the correct from based on selected shipment
  setAccounts() {
    this.to = this.accounts.filter(to => {
      return to._id == this.tracking.to.account
    })[0]
    this.from = this.accounts.filter(from => {
      return from._id == this.tracking.from.account
    })[0]
  }

  //Status is the highest stati with a truthy date
  getStatus() {
    return this.stati.reduce((prev, curr) => {
      return this.shipment[curr+'At'] ? curr : prev
    })
  }

  //Called on constructor() and create() to ensure user can always add a new label.
  add() {
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
  save() {
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
    if ($event.which == 188) {
      let copy = Object.assign({}, transaction)
      transaction.qty = {from:null, to:null}
      this.db.transactions.post(copy)
      .then(transaction => this.transactions.splice($index+1, 0, transaction))
    }
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
    let i = this.checks.indexOf($index)
    ~ i ? this.checks.splice(i, 1)
      : this.checks.push($index)

    let j = this.diffs.indexOf($index)
    ~ j ? this.diffs.splice(j, 1)
      : this.diffs.push($index)

    return true //Continue to bubble event
  }

  //Move these items to a different "alternative" shipment then select it
  //TODO need to select the new shipment once user confirms the move
  move() {
    //Confirm with user if we are moving items between existing shipments.
    //if user cancels then revert the tracking# back to the original value
    //do not confirm if moving items from inventory into a specific donation
    if(
        this.shipment._id && this.shipment._id != this.tracking._id &&
        ! confirm(`Move selected items from #${this.shipment.tracking} to #${this.tracking.tracking}? This operation cannot be undone!`)
      )
      return this.reset()

    //Change all selected transactions to the new or existing shipment
    //If new, tracking._id is not set but shipment._id was just set
    for (let i of this.checks) {
      this.transactions[i].shipment = this.tracking._id || this.shipment._id
      this.db.transactions.put(this.transactions[i])
    }

    //Display existing shipment or the newly created shipment
    this.select(this.tracking._id ? this.tracking : this.shipment)
  }

  create() {

    if ( ! this.checks.length && ! confirm('You have not selected any items.  Are you sure you want to create an empty shipment?'))
      return

    //Store some account information in the shipment but not everything
    this.shipment.account.to   = {_id:this.to._id, name:this.to.name}
    this.shipment.account.from = { _id:this.from._id, name:this.from.name}
    delete this.shipment.tracking //get rid of New Tracking# to have one assigned

    //Create shipment then move inventory transactions to it
    console.log('adding', this.shipment)
    this.db.shipments.post(this.shipment).then(shipment => {
      Object.assign(this.shipment, shipment)
      this.add() //Add a new shipment button in case user wants to add another
      this.move()
    })
  }

  saveInventory() {
    //__array_observer__ is an enumerable key in this.transactions here
    //for some reason. Current code catches this bug but be careful.
    for (let i of this.diffs) {
      let method = this.transactions[i].verified_at ? 'asDelete' : 'asPost'
      this.http.createRequest('//localhost:3000/transactions/'+this.transactions[i]._id+'/verified')
      .withCredentials(true)[method]().send().catch(_ => _) //empty catch because failed post requests alrady appear in console
    }
    this.diffs = []
  }

  addTransaction(key) {
    this.search = null //Reset search's auto-complete
    return this.drugs.add(key.id, this.shipment)  //Add the drug to the database
    .then(transaction => {
      this.transactions.unshift(transaction)
    }) //Add the drug to the view
  }
}

export class filterValueConverter {
  toView(transactions = [], filter = ''){
    filter = filter.toLowerCase()
    return transactions.filter(transaction => {
      return ~ `${transaction.to.name} ${transaction.tracking} ${transaction.status}`.toLowerCase().indexOf(filter)
    })
  }
}
