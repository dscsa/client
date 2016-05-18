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
    let session  = db.users().session()
    this.db      = db
    this.account = session.account
    this.loading = session.loading
    this.drugs   = []
    this.router  = router
    this.http    = http
    this.stati   = ['pickup', 'shipped', 'received']
  }

  activate(params) {

    return Promise.all([
      //Start all of our async tasks
      this.db.accounts({state:this.account.state}),   //TODO to = $elemMatch:this.account._id, from = $in:this.account.authorized
      this.db.shipments({'account.from._id':this.account._id}),
      this.db.shipments({'account.to._id':this.account._id})
    ])
    .then(([accounts, from, to]) => {

      //This abbreviated denormalized account information will be assigned to account.to/from
      let selected, accountMap = {}
      for (let account of accounts) {
        let data = {_id:account._id, name:account.name, ordered:account.ordered}
        account._id == this.account._id
          ? this.account = data
          : accountMap[account._id] = data
      }
      //Selected account != shipment.account.to because they are not references
      function makeReference(shipment) {
        shipment.account.from = accountMap[shipment.account.from._id]
        shipment.account.to   = accountMap[shipment.account.to._id]
        if (params.id === shipment._id.split('.')[2])
          selected = shipment  //Sneak this in since we are already making the loop
      }

      to.forEach(makeReference)

      this.role = selected //switch default role depending on shipment selection
        ? {account:'to', partner:'from'}
        : {account:'from', partner:'to'}

      from.forEach(makeReference)

      from.unshift({ //this is inventory
        _id:this.account._id,
        tracking:'New Tracking #',
        status:"pickup",
        pickupAt:null,
        shippedAt:null,
        receivedAt:null,
        account:{
          from:this.account
        }
      })

      //Select new shipment by default if not shipments exist yet.
      this.selectShipment(selected || from[0])
      this.accounts  = ['', ...Object.values(accountMap)]
      this.shipments = {from, to}
    })
  }

  //Activated by activate() and each time a shipment is selected from drawer
  selectShipment(shipment) {

    this.shipment     = shipment
    this.attachment   = null
    this.transactions = [] //prevents flash of "move button"

    //Keep url concise by using the last segment of the id
    let url = shipment._rev ? '/'+shipment._id.split('.')[2] : ''
    this.router.navigate('shipments'+url, { trigger: false })

    this.db.transactions({'shipment._id':shipment._id})
    .then(transactions => {
      this.transactions = transactions
      this.diffs     = [] //Check boxes of verified, and track the differences
      this.isChecked = [] //check.one-way="checkmarks.indexOf($index) > -1" wasn't working
      this.numChecks = 0
      for (let i in this.transactions) {
        this.isChecked.push(this.transactions[i].verifiedAt)
        if (this.transactions[i].verifiedAt) {
          this.numChecks++
        }
      }
    })
    .catch(console.log)
  }

  swapRole() { //Swap donor-donee roles
    [this.role.account, this.role.partner] = [this.role.partner, this.role.account]
    this.selectShipment(this.shipments[this.role.account][0])
    return true
  }

  //if it's from, then we can either create a shipment or move to a new shipment.
  //want to activate the checkboxes if new shipment has a "to" chosen or if tracking number changes
  //the later change can happen dynamically so the logic must be in the view rather than here
  //this.disableCheckboxes = this.role.account == 'from' && this.shipment._id
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

  //Move these items to a different "alternative" shipment then select it
  //TODO need to select the new shipment once user confirms the move
  moveShipment() {

    for (let i in this.isChecked) { //Change all selected transactions to the new or existing shipment
      if ( ! this.isChecked[i]) continue
      this.transactions[i].shipment = {_id:this.shipment._id}
      this.db.transactions.put(this.transactions[i])
    }

    this.selectShipment(this.shipment) //Display existing shipment or the newly created shipment
  }

  createShipment() {
    //Create shipment then move inventory transactions to it
    //Use new shipment so we don't copy changes to the old shipment
    let shipment = Object.assign({}, this.shipment)
    delete shipment.account.to.ordered
    delete shipment.account.from.ordered
    this.db.shipments.post(shipment).then(res => {

      //but we do need the old shipment.account info to keep references intact
      console.log('added shipment', shipment)
      shipment.tracking = res.tracking
      shipment.account  = this.shipment.account
      this.shipment     = shipment

      this.shipments[this.role.account].splice(1, 0, shipment) //Add it at the top right under the new shipment
      this.moveShipment()
    })
  }

  qtyShortcuts($event, $index) {
    //Enter should refocus on the search
    if ($event.which == 13)
      return document.querySelector('md-autocomplete input').focus()

    //Delete an item in the qty is 0.  Instead of having a delete button
    let transaction = this.transactions[$index]
    let doneeDelete = ! transaction.qty.from && transaction.qty.to === "0"
    let donorDelete = transaction.qty.from === "0" && ! transaction.qty.to

    if (donorDelete || doneeDelete) {
      this.db.transactions.remove(transaction)
      .then(_ => this.transactions.splice($index, 1))
    }

    //See if this transaction qualifies for autoCheck
    this.autoCheck($index)

    return true
  }

  autoCheck($index) {
    let transaction = this.transactions[$index]

    let order = this.shipment.account.to && this.shipment.account.to.ordered[genericName(transaction.drug)]   //this.shipment.account.to may not have been selected yet
  console.log('autocheck', genericName(transaction.drug), order)
    if ( ! order) return

    let qty = +transaction.qty[this.role.account]
    let exp = transaction.exp[this.role.account]

    let minQty    = qty >= +order.minQty
    let minExp    = exp ? new Date(exp) - Date.now() >= order.minDays*24*60*60*1000 : true
    let isChecked = this.isChecked[$index] || false //apparently false != undefined

    console.log('autocheck', 'minQty', minQty, 'minExp', minExp, 'isChecked', isChecked)
    if((minQty && minExp) != isChecked)
      this.manualCheck($index)
  }

  manualCheck($index) {
    let j = this.diffs.indexOf($index)
    ~ j ? this.diffs.splice(j, 1)
      : this.diffs.push($index)

    this.isChecked[$index] ? this.numChecks-- : this.numChecks++
    this.isChecked[$index] = ! this.isChecked[$index] //for autoCheck
    return true
  }

  saveInventory() {
    //__array_observer__ is an enumerable key in this.transactions here
    //for some reason. Current code catches this bug but be careful.
    let all = []
    for (let i of this.diffs) {
      let method = this.transactions[i].verifiedAt ? 'asDelete' : 'asPost'
      let url  = '//localhost:3000/transactions/'+this.transactions[i]._id+'/verified'
      all.push(this.http.createRequest(url).withCredentials(true)[method]().send())
    }
    Promise.all(all)
    .then(_ => {
      this.diffs = []
      this.snackbar.show(`Selected Items Were Saved To Inventory`)
    })
    .catch(e => this.snackbar.show(`Selected Items Could Not Be Saved To Inventory`))
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

  //Since this is triggered by a focusin and then does a focus, it activates itself a 2nd time
  selectRow($index) {
    console.log('select row')
    document.querySelector('#exp_'+$index+' input').focus()
  }

  saveTransaction(transaction) {
    console.log('saving', transaction)
    this.db.transactions.put(transaction)
    //.catch(e => console.log('error', e))
    .catch(e => {
      console.log('error', e)
      this.snackbar.show(`Transaction with exp ${transaction.exp[this.role.account]} and qty ${transaction.qty[this.role.account]} could not be saved`)
    })
  }

  addTransaction(drug, transaction) {
    transaction = transaction || {
      qty:{from:null, to:null},
      exp:{from:null, to:null}
    }

    transaction.drug = {
      _id:drug._id,
      generics:drug.generics,
      form:drug.form,
    }

    transaction.shipment = {
      _id:this.shipment._id
    }

    //Assume db query works.
    this.transactions.unshift(transaction) //Add the drug to the view
    this.isChecked.unshift(transaction.verifiedAt)
    transaction.verifiedAt && this.numChecks++

    this.term = ''    //Reset search's auto-complete
    setTimeout(_ => this.selectRow(0), 100) // Select the row.  Wait for repeat.for to refresh
    console.log('addTransaction', drug, transaction)
    return this.db.transactions.post(transaction)
    .catch(e => {
      this.snackbar.show(`${ e.message }: transaction could not be added`)
      this.transactions.shift()
      this.isChecked.shift()
      transaction.verifiedAt && this.numChecks--
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

  importCSV() {
    let $this = this
    let all   = []
    Papa.parse($this.$file.files[0], {
      header:true,
      step: function(results, parser) {
        console.log(results)
        let row = results.data[0]

        if ( ! row['drug._id']) {
          console.error('drug._id field is required', results); return
        }

        all.push($this.db.drugs({_id:row['drug._id']})
        .then(drugs => {
          $this.addTransaction(drugs[0], {
            verifiedAt:row.verifiedAt,
            qty:{
              to:row['qty.to'],
              from:row['qty.from'],
            },
            exp:{
              to:row['exp.to'],
              from:row['exp.from'],
            }
          })
        })
        .then(_ => console.log('uploaded', _)))
      },

      complete: function(results, file) {
        Promise.all(all).then(_ => console.log('All Transactions Imported'))
      }
    })
  }
}


//
// Value Converters
//
export class numberValueConverter {
  fromView(str){
    return +str
  }
}

export class jsonValueConverter {
  toView(object = null){
    return JSON.stringify(object, null, " ")
  }
}

export class filterValueConverter {
  toView(shipments = [], filter = ''){
    filter = filter.toLowerCase()
    return shipments.filter(shipment => {

      if ( ! shipment.account.to)
        return true

      return ~ `${shipment.account.to.name} ${shipment.tracking} ${shipment.status}`.toLowerCase().indexOf(filter)
    })
  }
}

export class valueValueConverter {
  toView(transactions = [], filter='') {
    return transactions.reduce((a, b) => {
      return b.drug.price.goodrx ? b.drug.price.goodrx*(b.qty.to || b.qty.from) : 0 + a
    }, 0).toFixed(2)
  }
}

export class drugNameValueConverter {
  toView(drug, regex){
    return genericName(drug).replace(regex, '<strong>$1</strong>') + (drug.brand ? ' ('+drug.brand+')' : '')
  }
}

export class dateValueConverter {

  toView(date) {
    if ( ! date ) return ''
    return date != this.model ? date.slice(5,7)+'/'+date.slice(2,4) : this.view
  }

  fromView(date){
    this.view  = date

    let [month, year] = date.split('/')
    date = new Date('20'+year,month, 1)
    date.setDate(0)

    return this.model = date.toJSON()
  }
}

function genericName(drug) {
  return drug.generics.map(generic => generic.name+" "+generic.strength).join(', ')+' '+drug.form
}
