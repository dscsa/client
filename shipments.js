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
    this.role    = {account:'from', partner:'to'}
    this.stati   = ['pickup', 'shipped', 'received']
  }

  activate(params) {
    console.log('this.account', this.account)
    return Promise.all([
      //Start all of our a sync tasks
      //TODO to = $elemMatch:this.account._id
      //TODO from = $in:this.account.authorized
      this.db.accounts({_id:{$ne:this.account._id}, state:this.account.state}),
      this.db.shipments({'from.account':this.account._id}),
      this.db.shipments({'to.account':this.account._id})
    ])
    .then(([accounts, from, to]) => {
      //Set the view model
      console.log('accounts', accounts)
      this.accounts  = ['', ...accounts]
      this.shipments = {from, to}
      this.add('from')
      this.add('to')
      this.setRole(params.id)
    })
  }

  //Activated from constructor and each time a shipment is selected
  select(shipment) {

    //if no/missing shipment specified, show new shipment
    this.shipment = shipment || this.shipments[this.role.account][0]

    //Update URL with lifecycle methods so we can come back to this shipment
    let id = this.shipment._id ? '/'+this.shipment._id.split('.')[2] : ''
    this.router.navigate('shipments'+id , { trigger: false })

    this.reset()

    //Display all transactions in the shipment
    this.db.transactions({shipment:this.shipment._id || this.account._id})
    .then(transactions => {
      this.transactions = transactions || []
      this.selectTransaction(transactions[0]) //Select first transaction and display its history
      //Check boxes of captured, and track the differences
      this.checks = this.transactions.map((o,i) => o.captured_at ? i : null).filter(_ => _ != null)
      this.diffs  = []
    })
  }

  setRole(id) {

    var temp          = this.role.partner
    this.role.partner = this.role.account
    this.role.account = temp

    this.select(id && this.shipments[temp].filter(s => s._id && s._id.split('.')[2] === id)[0])

    return true
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
      return this.shipment[curr+'_at'] ? curr : prev
    })
  }

  //Called on constructor() and create() to ensure user can always add a new label.
  add(key) {

    let shipment = {
      tracking:'New Tracking #',
      status:"pickup",
      pickup_at:null,
      shipped_at:null,
      received_at:null,
      from:{},
      to:{}
    }

    this.shipments[key].unshift(Object.assign({}, shipment, {
      [key == 'from' ? 'to' : 'from']:{account:this.account._id}
    }))
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

  check($index) {
    console.log('$index', $index)
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

    console.log('this.checks', this.checks, this.checks.length)
    console.log('this.diffs', this.diffs, this.diffs.length)
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
    this.shipment.to = {name:this.to.name, account:this.to._id}
    this.shipment.from = {name:this.from.name, account:this.from._id}
    delete this.shipment.tracking //get rid of New Tracking# to have one assigned

    //Create shipment then move inventory transactions to it
    console.log('adding', this.shipment)
    this.db.shipments.post(this.shipment).then(shipment => {
      Object.assign(this.shipment, shipment)
      this.add(this.role ? 'from' : 'to') //Add a new shipment button in case user wants to add another
      this.move()
    })
  }

  saveInventory() {
    //__array_observer__ is an enumerable key in this.transactions here
    //for some reason. Current code catches this bug but be careful.
    for (let i in this.diffs) {
      let method = this.transactions[i].captured_at ? 'asDelete' : 'asPost'
      this.http.createRequest('//localhost:3000/transactions/'+this.transactions[i]._id+'/captured')
      .withCredentials(true)[method]().send()
    }
  }

  selectTransaction(transaction) {
    if ( ! transaction || this.transaction == transaction)
      return true //avoid extra work but propogate event

    this.transaction = transaction
    this.http.get('//localhost:3000/transactions/'+transaction._id+'/history')
    .then(history => {
      //TODO move this to /history?text=true. Other formatting options?
      this.history = JSON.stringify(
        history.content,
        function(k,v) { return v.text || v },
        "  "
      )
      .replace(/[\]\n\s]*\]/g, '')   //Get rid of all the ending brackets with all associated newlines
      .replace(/[\[\n\s]*\[/g, '\n') //Get rid of all the starting brackets and condense to one new line
      .replace(/^\n*|",?/g, '')
    })
    return true  //So event continues to propogate hitting checkbox
  }

  addTransaction(drug) {
    this.search = null //Reset search's auto-complete
    return this.drugs.add(drug, this.shipment)  //Add the drug to the database
    .then(transaction => {
      console.log(transaction)
      this.transactions.unshift(transaction)
    }) //Add the drug to the view
  }
}

//TODO make this work with added items
export class filterValueConverter {
  toView(transactions = [], filter = ''){
    filter = filter.toLowerCase()
    return transactions.filter(transaction => {
      return ~ `${transaction.to.name} ${transaction.tracking} ${transaction.status}`.toLowerCase().indexOf(filter)
    })
  }
}
