//TODO
//Autofocus on new drug
//Disable From/To based on Filter's switch

import {inject}     from 'aurelia-framework';
import {Router}     from 'aurelia-router';
import {Db}         from 'libs/pouch'
import {HttpClient} from 'aurelia-http-client';

//@pageState()
@inject(Db, Router, HttpClient)
export class shipments {

  constructor(db, router, http){
    this.db      = db
    this.drugs   = []
    this.router  = router
    this.http    = http
    this.stati   = ['pickup', 'shipped', 'received']
  }

  activate(params) {
    return this.db.user.session.get()
    .then(session  => this.db.account.get({_id:session.account._id}))
    .then(accounts => {
      this.account = {_id:accounts[0]._id, name:accounts[0].name, ordered:accounts[0].ordered}
      return Promise.all([
        //Start all of our async tasks
        this.db.account.get({authorized:accounts[0]._id}),
        this.db.account.get({_id:{$gt:null, $in:accounts[0].authorized}}),
        this.db.shipment.get({'account.from._id':accounts[0]._id}), //TODO this should be duplicative with _security doc.  We should be able to do _all_docs or no selector
        this.db.shipment.get({'account.to._id':accounts[0]._id})
      ])
    })
    .then(([fromAccounts, toAccounts, fromShipments, toShipments]) => {
      //This abbreviated denormalized account information will be assigned to account.to/from
      let selected, fromMap = {}, toMap = {}
      function makeMap(account) {
        this[account._id] = {_id:account._id, name:account.name, ordered:account.ordered}
      }
      fromAccounts.forEach(makeMap.bind(fromMap))
      toAccounts.forEach(makeMap.bind(toMap))

      //Selected account != shipment.account.to because they are not references
      let makeReference = shipment => {
        shipment.status       = this.getStatus(shipment)
        shipment.account.from = toMap[shipment.account.from._id] || {...this.account}
        shipment.account.to   = fromMap[shipment.account.to._id] || {...this.account}
        if (params.id === shipment._id.split('.')[2])
          selected = shipment  //Sneak this in since we are already making the loop
      }

      fromShipments.forEach(makeReference)

      this.role = selected //switch default role depending on shipment selection
        ? {account:'from', partner:'to'}
        : {account:'to', partner:'from'}

      toShipments.forEach(makeReference)

      this.accounts  = {
        from:['', ...Object.values(fromMap)],
        to:['', ...Object.values(toMap)]
      }

      //console.log('this.accounts', this.accounts)
      this.shipments = {from:fromShipments, to:toShipments}

      this.addEmptyShipment('from')
      this.addEmptyShipment('to')
      this.selectShipment(selected || toShipments[0])
    })
  }

  //Activated by activate() and each time a shipment is selected from drawer
  selectShipment(shipment) {
    this.shipment     = shipment
    this.attachment   = null
    this.transactions = [] //prevents flash of "move button"
    this.diffs        = [] //Check boxes of verified, and track the differences
    this.isChecked    = [] //check.one-way="checkmarks.indexOf($index) > -1" wasn't working

    //Keep url concise by using the last segment of the id
    let url = shipment._rev ? '/'+shipment._id.split('.')[2] : ''
    this.router.navigate('shipments'+url, { trigger: false })

    if ( ! shipment._id && ! shipment.account.from) //anything but toShipment[0]
      return

    this.db.transaction.get({'shipment._id':shipment._id || this.account._id})
    .then(transactions => {
      this.transactions = transactions
      for (let i in this.transactions) {
        this.isChecked.push(!!this.transactions[i].verifiedAt) //force boolean since aurelia forces checkboxes to be boolean to using date causes checkboxes to stick on first click as aurelia converts date to boolean
      }
    })
    .catch(console.log)
  }

  addEmptyShipment(role) {
    this.shipments[role].unshift({account:{[role]:this.account}})
  }

  getStatus(shipment) {
    return this.stati.reduce((prev, curr) => shipment[curr+'At'] ? curr : prev)
  }

  swapRole() { //Swap donor-donee roles
    [this.role.account, this.role.partner] = [this.role.partner, this.role.account]
    this.selectShipment(this.shipments[this.role.account][0])
    return true
  }

  //Save the donation if someone changes the status/date
  saveShipment() {
    //don't want to save status, but deleting causes weird behavior
    //so instead copy the shipment and delete from copy then assign new rev
    let status = this.shipment.status
    delete this.shipment.status
    return this.db.shipment.put(shipment).then(res => {
      shipment.status = status
    })
    //TODO reschedule pickup if a date was changed
  }

  //Move these items to a different "alternative" shipment then select it
  //TODO need to select the new shipment once user confirms the move
  moveTransactionsToShipment(shipment) {

    for (let i in this.isChecked) { //Change all selected transactions to the new or existing shipment
      if ( ! this.isChecked[i]) continue
      if (this.transactions[i].verifiedAt) continue //do not allow movement of verified transactions
      this.transactions[i].shipment = {_id:shipment._id}
      this.db.transaction.put(this.transactions[i])
    }

    this.selectShipment(shipment) //Display existing shipment or the newly created shipment
  }

  //Create shipment then move inventory transactions to it
  createShipment() {

    //Use new shipment so we don't copy changes to the old shipment since
    //.ordered is deeply nested need this rather than Object.assign shallow
    let toOrdered   = this.shipment.account.to.ordered
    let fromOrdered = this.shipment.account.from.ordered
    delete this.shipment.account.to.ordered
    delete this.shipment.account.from.ordered

    this.db.shipment.post(this.shipment).then(res => {
      this.moveTransactionsToShipment(this.shipment)
      this.addEmptyShipment(this.role.account)
    })

    //Restore ordered in case we autocheck needs this right away
    this.shipment.account.to.ordered   = this.shipment.account.to.ordered
    this.shipment.account.from.ordered = this.shipment.account.from.ordered
  }

  qtyShortcuts($event, $index) {
    if ($event.which == 37 || $event.which == 39 || $event.which == 9)
      return //ignore left and right arrows and tabs https://css-tricks.com/snippets/javascript/javascript-keycodes/

    if ($event.which == 13) //Enter should refocus on the search
      return document.querySelector('md-autocomplete input').focus()

    //Delete an item in the qty is 0.  Instead of having a delete button
    let transaction = this.transactions[$index]
    let doneeDelete = ! transaction.qty.from && transaction.qty.to === 0
    let donorDelete = ! transaction.qty.to   && transaction.qty.from === 0

    if (donorDelete || doneeDelete) {
      this.db.transaction.delete(transaction).then(_ =>  {
        this.transactions.splice($index, 1)
        this.isChecked.splice($index, 1)
        this.diffs = this.diffs.filter(i => i != $index).map(i => i > $index ? i-1 : i)
      })
    }

    //See if this transaction qualifies for autoCheck
    this.autoCheck($index)

    return true
  }

  autoCheck($index) {
    let transaction = this.transactions[$index]

    let order = this.shipment.account.to && this.shipment.account.to.ordered[genericName(transaction.drug)]   //this.shipment.account.to may not have been selected yet

    if ( ! order) return

    let qty = +transaction.qty[this.role.account]
    let exp = transaction.exp[this.role.account]

    let minQty    = qty >= (+order.minQty || 1)
    let minExp    = exp ? new Date(exp) - Date.now() >= (order.minDays || 60)*24*60*60*1000 : !order.minDays
    let isChecked = this.isChecked[$index] || false //apparently false != undefined

    console.log('autocheck', genericName(transaction.drug), order, 'minQty', minQty, 'minExp', minExp, 'isChecked', isChecked)
    if((minQty && minExp) != isChecked) {
      this.manualCheck($index)
      this.isChecked[$index] = ! isChecked
      if (this.isChecked[$index] && order.message)
        this.snackbar.show(order.message)
    }
  }

  manualCheck($index) {
    let j = this.diffs.indexOf($index)
    ~ j ? this.diffs.splice(j, 1)
      : this.diffs.push($index)

    return true
  }

  saveInventory() {
    let method   = 'post'
    let verified = true
    let phrase   = 'saved to'
    if (this.transactions[this.diffs[0]].verifiedAt) {
      method   = 'delete'
      verified = null
      phrase   = 'removed from'
    }

    Promise.all(this.diffs.map(i => {
      return this.db.transaction.verified[method]({_id:this.transactions[i]._id})
      .then(_ => {
        this.transactions[i].verifiedAt = verified
        return true
      })
      .catch(err => {
        this.isChecked[i] = !!this.transactions[i].verifiedAt
        this.manualCheck(i)
        this.snackbar.show(err.reason)
      })
    })).then(all => {
      this.diffs = []
      if (all.every(i => i))
        this.snackbar.show(`Selected items were ${phrase} inventory`)
    })
  }

  search() {
    let start = Date.now()
    let term = this.term.trim()

    if (term.length < 3)
      return this.drugs = []

    if (/^[\d-]+$/.test(term)) {
      this.regex = RegExp('('+term+')', 'gi')
      var drugs = this.db.drug.get({ndc:term})
    } else {
      this.regex = RegExp('('+term.replace(/ /g, '|')+')', 'gi')
      var drugs = this.db.drug.get({generic:term})
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
    this.db.transaction.put(transaction)
    .catch(err => {
      this.snackbar.show(`Error saving transaction: ${err.reason}`)
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
    this.diffs = this.diffs.map(val => val+1)

    this.term = ''    //Reset search's auto-complete
    setTimeout(_ => this.selectRow(0), 100) // Select the row.  Wait for repeat.for to refresh
    console.log('addTransaction', drug, transaction)
    return this.db.transaction.post(transaction)
    .catch(err => {
      this.snackbar.show(`Transaction could not be added: ${err.name}`)
      this.transactions.shift()
      this.isChecked.shift()
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

        all.push($this.db.drug.get({_id:row['drug._id']})
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


//
// Value Converters
//
export class numberValueConverter {
  fromView(str){
    //Match servers transaction.js default: Empty string -> null, string -> number, number -> number (including 0)
    return str != null && str !== '' ? +str : null
  }
}

export class jsonValueConverter {
  toView(object = null){
    //console.log(Object.keys(object), JSON.stringify(object, null, " "))
    return JSON.stringify(object, null, " ")
  }
}

export class filterValueConverter {
  toView(shipments = [], filter = ''){
    filter = filter.toLowerCase()
    return shipments.filter(shipment => {
      if ( ! shipment.account.to || ! shipment.account.from)
        return !filter //create new shipment

      return ~ `${shipment.account.from.name} ${shipment.account.to.name} ${shipment.tracking} ${shipment.status}`.toLowerCase().indexOf(filter)
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
