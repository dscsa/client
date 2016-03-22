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
    this.account = db.users().session().account
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
      this.shipments.from.unshift({
        tracking:'New Tracking #',
        status:"pickup",
        pickupAt:null,
        shippedAt:null,
        receivedAt:null,
        account:{
          from:{},
          to: {_id:this.account._id,name:this.account.name}
        }
      })

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
    //Don't let the user modify the actual shipment, just in classes
    //they are "moving to a new shipment" rather than creating it.
    this.shipment   = Object.assign({}, shipment)
    this.attachment = null

    let url = 'shipments'
    if (shipment._id)
      url += '/'+shipment._id.split('.')[2]
    this.router.navigate(url, { trigger: false })
    this.setSelects()

    this.db.transactions({'shipment._id':shipment._id || this.account._id})
    .then(transactions => {
      this.transactions = transactions
      this.diffs     = [] //Check boxes of verified, and track the differences
      this.isChecked = {} //check.one-way="checkmarks.indexOf($index) > -1" wasn't working
      this.numChecks = 0
      for (let i in this.transactions) {
        let verified = this.transactions[i].verifiedAt
        if (verified) {
          this.isChecked[i] = verified
          this.numChecks++
        }
      }
    })

    .catch(console.log)
  }

  swapRole() { //Swap donor-donee roles
    var temp          = this.role.partner
    this.role.partner = this.role.account
    this.role.account = temp
    let shipment = this.shipments[this.role.account][0]
    shipment && this.selectShipment(shipment)
  }

  //Selected to != shipment.account.to because they are not references
  //we need to manually find the correct from based on selected shipment
  //TODO when there is a new this.to we need this to recalculate autochecks
  setSelects(accountsOnly = false) {
    if ( ! accountsOnly)
      this.tracking = this.shipments[this.role.account]
      .filter(shipment => {
        //console.log('shipment', shipment, 'tracking', this.tracking)
        return shipment._id == this.shipment._id
      })[0]

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

  //Save the donation if someone changes the status/date
  saveShipment() {
    //If dates were set, status may have changed
    this.shipment.status = this.getStatus()
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

  qtyShortcuts($event, $index) {
    //Enter should refocus on the search
    if ($event.which == 13)
      return document.querySelector('md-autocomplete input').focus()

    let transaction = this.transactions[$index]

    //Delete an item in the qty is 0.  Instead of having a delete button
    if (
      (! transaction.qty.from && transaction.qty.to === "0") ||
      (transaction.qty.from === "0" && ! transaction.qty.to)
    ) {
      console.log('before remove', transaction)
      this.db.transactions.remove(transaction)
      .then(_ => this.transactions.splice($index, 1))
    }

    this.autoCheck($index)

    return true
  }

  autoCheck($index) {
    let transaction = this.transactions[$index]

    //this.to may not have been selected yet
    let order = this.to && this.to.ordered[genericName(transaction.drug)]

    if ( ! order) return

    let minQty = +transaction.qty[this.role.account] >= +order.minQty
    let minExp = transaction.exp[this.role.account] ? (Date.parse(transaction.exp[this.role.account].replace('/', '/01/')) - Date.now()) >= order.minDays*24*60*60*1000 : true

    console.log('autocheck', minQty, minExp, this.isChecked[$index], +transaction.qty[this.role.account], +order.minQty)
    if((minQty && minExp) != (this.isChecked[$index] || false)) { //apparently false != undefined
      this.manualCheck($index)
    }
  }

  manualCheck($index) {
    let j = this.diffs.indexOf($index)
    ~ j ? this.diffs.splice(j, 1)
      : this.diffs.push($index)

    if (this.isChecked[$index]) {
      this.isChecked[$index] = false
      this.numChecks--
    } else {
      this.isChecked[$index] = true
      this.numChecks++
    }
  }

  //Move these items to a different "alternative" shipment then select it
  //TODO need to select the new shipment once user confirms the move
  moveShipment() {

    //Change all selected transactions to the new or existing shipment
    //If new, tracking._id is not set but shipment._id was just set
    for (let i in this.isChecked) {
      if ( ! this.isChecked[i]) continue
      this.transactions[i].shipment = {_id:this.tracking._id || this.shipment._id}
      this.db.transactions.put(this.transactions[i])
    }

    //Display existing shipment or the newly created shipment
    this.selectShipment(this.tracking._id ? this.tracking : this.shipment)
  }

  createShipment() {

    if ( ! this.numChecks && ! confirm('You have not selected any items.  Are you sure you want to create an empty shipment?'))
      return

    //Store some account information in the shipment but not everything
    this.shipment.account[this.role.partner] = {_id:this[this.role.partner]._id, name:this[this.role.partner].name}
    delete this.shipment.tracking //get rid of New Tracking# to have one assigned
    delete this.shipment._id

    //Create shipment then move inventory transactions to it
    console.log('adding', this.shipment)
    this.db.shipments.post(this.shipment).then(shipment => {
      this.shipment._id  = shipment._id
      this.shipment._rev = shipment._rev
      this.shipment.tracking = shipment.tracking
      let role = this.role.account == this.shipment.account.to._id ? 'to' : 'from'
      this.shipments[role].splice(1, 0, this.shipment)
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
    let start = Date.now()
    let term = this.term.trim()

    if (term.length < 3)
      return this.drugs = []

    if (/^[\d-]+$/.test(term)) {
      this.regex = RegExp('('+term+')', 'gi')
      var drugs = this.db.drugs({ndc:term})
    } else {
      this.regex = RegExp('('+term.replace(/ /g, '|')+')', 'gi')
      var drugs = this.db.drugs({generic:term})
    }

    drugs.then(drugs => {
      console.log('drug search', drugs.length, Date.now() - start)
      this.drugs = drugs
    })
  }

  //Enter in the autocomplete adds the first transaction
  //TODO support up/down arrow keys to pick different transaction?
  autocompleteShortcut($event) {
    if ($event.which == 13)
      this.addTransaction(this.drugs[0])
  }

  selectRow($index) {
    document.querySelector('#exp_'+$index+' input').focus()
  }

  saveTransaction(transaction) {
    console.log('saving', transaction)
    this.db.transactions.put(transaction)
    .catch(e => this.snackbar.show({
       message: `Transaction with exp ${transaction.exp[this.role.account]} and qty ${transaction.qty[this.role.account]} could not be saved`
     }))
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

  exportCSV() {
    let csv = Papa.unparse(this.transactions.map(t => {
      return {
        '_id':t._id,
        'createdAt':t.createdAt,
        'verifiedAt':t.verifiedAt,
        'drug._id':t.drug._id,
        'drug.generic':genericName(t.drug),
        'drug.form':t.drug.form,
        //TODO make server default to adding an empty object to obviate this check
        'drug.retail.price':t.drug.retail && t.drug.retail.price,
        'drug.wholesale.price':t.drug.retail && t.drug.wholesale.price,
        'qty.from':t.qty.from,
        'qty.to':t.qty.to,
        'exp.from':t.exp.from,
        'exp.to':t.exp.to,
        'shipment._id':this.shipment._id,
        'shipment.tracking':this.shipment.tracking,
        'shipment.status':this.shipment.status,
        'shipment.account.to._id':this.shipment.account.to._id,
        'shipment.account.to.name':this.shipment.account.to.name,
        'shipment.account.from._id':this.shipment.account.from._id,
        'shipment.account.from.name':this.shipment.account.from.name,
      }
    }))

    csv = new Blob([csv], {type: 'text/csv;charset=utf-8;'})
    let link = document.createElement('a')
    link.href = window.URL.createObjectURL(csv)
    link.setAttribute('download', this.shipment._id ? 'Shipment '+this.shipment._id+'.csv' : 'Inventory.csv')
    link.click()
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
    return transactions.reduce((a, b) => b.drug.retail ? b.drug.retail.price*(b.qty.to || b.qty.from) : 0 + a, 0).toFixed(2)
  }
}

export class drugNameValueConverter {
  toView(drug, regex){
    return genericName(drug).replace(regex, '<strong>$1</strong>') + (drug.brand ? ' ('+drug.brand+')' : '')
  }
}

function genericName(drug) {
  return drug.generics.map(generic => generic.name+" "+generic.strength).join(', ')+' '+drug.form
}
