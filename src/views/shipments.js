import {inject}     from 'aurelia-framework'
import {Router}     from 'aurelia-router'
import {Db}         from '../libs/pouch'
import {HttpClient} from 'aurelia-http-client'
import {Csv}        from '../libs/csv'

//@pageState()
@inject(Db, Router, HttpClient)
export class shipments {

  constructor(db, router, http){
    this.csv    = new Csv(['drug._id'], ['qty.from', 'qty.to', 'exp.from', 'exp.to', 'rx.from', 'rx.to', 'verifiedAt'])
    this.db     = db
    this.drugs  = []
    this.router = router
    this.http   = http
    this.stati  = ['pickup', 'shipped', 'received']
    this.shipments = {}
  }

  activate(params) {
    return this.db.user.session.get()
    .then(session  => {
      this.user = session._id
      return this.db.account.get({_id:session.account._id})
    })
    .then(accounts => {
      this.account = {_id:accounts[0]._id, name:accounts[0].name}
      this.ordered = {[accounts[0]._id]:accounts[0].ordered}
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
      let makeMap = (map, account) => {
        map[account._id] = {_id:account._id, name:account.name}
        this.ordered[account._id] = account.ordered
      }

      for (let account of fromAccounts) makeMap(fromMap, account)
      for (let account of toAccounts) makeMap(toMap, account)

      this.accounts  = {
        from:['', ...Object.keys(fromMap).map(key => fromMap[key])],
        to:['', ...Object.keys(toMap).map(key => toMap[key])]
      }

      //Selected account != shipment.account.to because they are not references
      let makeReference = shipment => {
        this.setStatus(shipment)

        //3 scenarios - from an approved partner, the current facility, from a previous approved partner
        //TODO this code seems bulks is there a more elegant way to handle these three scenarios
        if (toMap[shipment.account.from._id])
          shipment.account.from = toMap[shipment.account.from._id]

        if (fromMap[shipment.account.to._id])
          shipment.account.to = fromMap[shipment.account.to._id]

        if (params.id === shipment._id)
          selected = shipment  //Sneak this in since we are already making the loop
      }
      fromShipments.forEach(makeReference)

      this.role = selected //switch default role depending on shipment selection
        ? {account:'from', partner:'to'}
        : {account:'to', partner:'from'}

      toShipments.forEach(makeReference)

      //console.log('this.accounts', this.accounts)
      this.shipments = {from:fromShipments, to:toShipments}

      this.selectShipment(selected)
    })
  }

  //Activated by activate() and each time a shipment is selected from drawer
  selectShipment(shipment) {
    if ( ! shipment) return this.emptyShipment()
    this.setUrl('/'+shipment._id)
    this.setShipment(shipment)
    this.setTransactions(shipment._id)
  }

  emptyShipment() {
    this.setUrl('')
    if (this.role.account == 'from') {
      this.setShipment({account:{from:this.account, to:{}}})
      this.setTransactions(this.account._id)
    } else {
      this.setShipment({account:{to:this.account, from:{}}})
      this.setTransactions()
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
    this.transactions = []
    this.diffs        = [] //Newly checked or unchecked checkboxes. Used to disable buttons if user has not done anything yet

    if ( ! shipmentId) return

    this.db.transaction.get({'shipment._id':shipmentId}).then(transactions => {
      this.transactions = transactions
      this.originalTransactions = transactions
      for (let i in this.transactions) {
        this.transactions[i].isChecked = this.transactions[i].verifiedAt
        if ( ! this.transactions[i].verifiedAt) this.autoCheck(i, false)
      }
    })
    .catch(console.log)
  }

  setStatus(shipment) {
    shipment.status = this.stati.reduce((prev, curr) => shipment[curr+'At'] ? curr : prev)
  }

  swapRole() { //Swap donor-donee roles
    [this.role.account, this.role.partner] = [this.role.partner, this.role.account]
    this.selectShipment()
    return true
  }

  //Save the donation if someone changes the status/date
  saveShipment() {
    //don't want to save status, but deleting causes weird behavior
    //so instead copy the shipment and delete from copy then assign new rev
    delete this.shipment.status
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
      //do not allow movement of verified transactions
      if ( ! transaction.isChecked || transaction.verifiedAt) return

      transaction.shipment = {_id:shipment._id}
      return this.db.transaction.put(transaction)
    }))
    .then(_ => this.selectShipment(shipment)) //Display existing shipment or the newly created shipment
  }

  //Create shipment then move inventory transactions to it
  createShipment() {
    if (this.shipment.tracking == 'New Tracking #')
      delete this.shipment.tracking

    this.db.shipment.post(this.shipment).then(res => {
      this.setStatus(this.shipment)
      this.shipments[this.role.account].unshift(this.shipment)
      this.moveTransactionsToShipment(this.shipment)
    })
  }

  expShortcuts($event, $index) {
    if ($event.which == 37 || $event.which == 39 || $event.which == 9)
      return //ignore left and right arrows and tabs to prevent unnecessary autochecks https://css-tricks.com/snippets/javascript/javascript-keycodes/

    if ($event.which == 13) //Enter should focus on quantity
      return document.querySelector('#qty_'+$index+' input').focus()

    //See if this transaction qualifies for autoCheck
    this.autoCheck($index, true)
  }

  qtyShortcuts($event, $index) {
    if ($event.which == 37 || $event.which == 39 || $event.which == 9)
      return false //ignore left and right arrows and tabs to prevent unnecessary autochecks https://css-tricks.com/snippets/javascript/javascript-keycodes/

    if ($event.which == 13) { //Enter should focus on rx_input, unless it is hidden http://stackoverflow.com/questions/19669786/check-if-element-is-visible-in-dom
      let rxInput = document.querySelector('#rx_'+$index+' input')
      return rxInput.disabled ? document.querySelector('md-autocomplete input').focus() : rxInput.focus()
    }

    //Delete an item in the qty is 0.  Instead of having a delete button
    let transaction = this.transactions[$index]
    let doneeDelete = ! transaction.qty.from && transaction.qty.to === 0
    let donorDelete = ! transaction.qty.to   && transaction.qty.from === 0

    if (donorDelete || doneeDelete) {
      this.db.transaction.delete(transaction).then(_ =>  {
        this.transactions.splice($index, 1)
        this.diffs = this.diffs.filter(i => i != $index).map(i => i > $index ? i-1 : i)
      })
      document.querySelector('md-autocomplete input').focus()
    }

    //See if this transaction qualifies for autoCheck
    this.autoCheck($index, true)
  }

  boxShortcuts($event, $index) {
    if ($event.which == 13) //Enter should focus on quantity
      document.querySelector('md-autocomplete input').focus()

    if ($event.which == 107 || $event.which == 187) { // + key on numpad, keyboard
      let box = document.querySelector('#box_'+$index+' input')
      box.value = box.value[0]+(+box.value.slice(1)+1)
      $event.preventDefault() //don't actually add the +
    }

    if ($event.which == 109 || $event.which == 189) {// - key on numpad, keyboard
      let box = document.querySelector('#box_'+$index+' input')
      box.value = box.value[0]+(+box.value.slice(1)-1)
      $event.preventDefault() //don't actually add the -
    }

    return true
  }

  saveLastBox($event) {
    this.lastBox = $event.target.value
    console.log(this.lastBox)
  }

  rxShortcuts($event, $index) {
    if ($event.which == 13) //Enter should refocus on the search
      document.querySelector('#box_'+$index+' input').focus()
  }

  //TODO should this only be run for the recipient?  Right now when donating to someone else this still runs and displays order messages
  autoCheck($index, showMessage) {
    let transaction = this.transactions[$index]

    let ordered = this.ordered[this.shipment.account.to._id][genericName(transaction.drug)]
    let qty = +transaction.qty[this.role.account]
    let exp = transaction.exp[this.role.account]

    if ( ! ordered || ! qty) return

    let defaultQty = transaction.drug.brand ? 1 : 10
    let minQty     = qty >= (+ordered.minQty || defaultQty)
    let minExp     = exp ? new Date(exp) - Date.now() >= (ordered.minDays || 120)*24*60*60*1000 : !ordered.minDays
    let isChecked  = transaction.isChecked || false //apparently false != undefined

    if((minQty && minExp) == isChecked) {
      showMessage && ordered.destroyedMessage && this.snackbar.show(ordered.destroyedMessage)
      return showMessage && console.log('minQty', minQty, qty, 'minExp', minExp, exp)
    }

    if (isChecked)
      showMessage && this.snackbar.show(ordered.verifiedMessage || 'Drug is ordered')

    transaction.location = this.lastBox

    this.manualCheck($index)
  }

  manualCheck($index) {
    this.transactions[$index].isChecked = ! this.transactions[$index].isChecked

    let j = this.diffs.indexOf($index)
    ~ j ? this.diffs.splice(j, 1)
      : this.diffs.push($index)
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
        this.transactions[i].isChecked = this.transactions[i].verifiedAt
        this.manualCheck(i)
        this.snackbar.show(err.reason)
      })
    })).then(all => {
      this.diffs = []
      if (all.every(i => i))
        this.snackbar.show(`${all.length} items were ${phrase} inventory`)
    })
  }

  search() {
    let term = this.term.trim()

    if (term.length < 3) {
      this.transactions = this.originalTransactions
      return this.drugs = []
    }

    if (/^[\d-]+$/.test(term)) {
      if (term[0] != '3' || term.length != 12) {
        let filter = this.transactions.filter(transaction => {
          return transaction.rx && (transaction.rx.from == term || transaction.rx.to == term)
        })
        console.log('Rx search term', filter)
        if (filter.length) {
          return this.transactions = filter
        }
      }

      this.regex = RegExp('('+term+')', 'gi')
      var drugs = this.db.drug.get({ndc:term})
    } else {
      this.regex = RegExp('('+term.replace(/ /g, '|')+')', 'gi')
      var drugs = this.db.drug.get({generic:term})
    }

    drugs.then(drugs => {
      this.drugs = drugs
      this.index = 0
    })
  }

  //Enter in the autocomplete adds the selected transaction
  //TODO support up/down arrow keys to pick different transaction?
  scrollDrugs($event) {
    //group won't be a reference so we must search manually
    let last = this.drugs.length - 1

    if ($event.which == 38) //Arrow up
      this.index = this.index > 0 ? this.index - 1 : last

    if ($event.which == 40 )//Arrow down
      this.index = this.index < last ? this.index+1 : 0

    if ($event.which == 13) {//Enter
      this.addTransaction(this.drugs[this.index])
      return false //Enter was also triggering exp to qty focus
    }

    if ($event.which == 106) //* clearing autocomplete field with an asterick (to match exp date clearing and make numberpad compatible)
      this.term = ""

    return true  //still allow typing into autocomplete
  }

  //Since this is triggered by a focusin and then does a focus, it activates itself a 2nd time
  selectRow($index) {
    console.log('select row')
    document.querySelector('#exp_'+$index+' input').focus()
  }

  saveTransaction($index) {
    if ( ! document.querySelector('#exp_'+$index+' input').validity.valid)
      return

    this.db.transaction.put(this.transactions[$index])
    .catch(err => {
      this.snackbar.show(`Error saving transaction: ${err.reason}`)
    })
  }

  addTransaction(drug, transaction) {
    transaction = transaction || {
      qty:{from:null, to:null},
      rx:{from:null, to:null},
      exp:{
        from:this.transactions[0] ? this.transactions[0].exp.from : null,
        to:this.transactions[0] ? this.transactions[0].exp.to : null
      }
    }

    delete transaction.isChecked

    transaction.drug = {
      _id:drug._id,
      generics:drug.generics,
      form:drug.form,
      pkg:drug.pkg
    }

    transaction.shipment = {
      _id:this.shipment._id
    }

    transaction.user = {
      _id:this.user
    }

    this.term = '' //Reset search's auto-complete

    //Assume db query works.
    console.log('addTransaction', transaction)
    this.transactions.unshift(transaction) //Add the drug to the view
    this.diffs = this.diffs.map(val => +val+1) //for some reason indexes were strings
    setTimeout(_ => this.selectRow(0), 100) // Select the row.  Wait for repeat.for to refresh
    return this.db.transaction.post(transaction).then(_ => {
      transaction.isChecked = transaction.verifiedAt
    })
    .catch(err => {
      this.snackbar.show(`Transaction could not be added: ${err.name}`)
      this.transactions.shift()
      this.diffs = this.diffs.map(val => val-1)
    })
  }

  exportCSV() {
    let name = this.shipment._id ? 'Shipment '+this.shipment._id+'.csv' : 'Inventory.csv'
    this.csv.unparse(name, this.transactions.map(transaction => {
      return {
        '':transaction,
        'drug._id':" "+transaction.drug._id,
        'drug.generic':genericName(transaction.drug),
        'drug.generics':transaction.drug.generics.map(generic => generic.name+" "+generic.strength).join(';'),
        shipment:this.shipment
      }
    }))
  }

  importCSV() {
    console.log('this.$file.value', this.$file.value)
    this.csv.parse(this.$file.files[0]).then(parsed => {
      return Promise.all(parsed.map(transaction => {
        this.$file.value = ''
        transaction.exp.to     = toJsonDate(parseUserDate(transaction.exp.to))
        transaction.exp.from   = toJsonDate(parseUserDate(transaction.exp.from))
        transaction.verifiedAt = toJsonDate(parseUserDate(transaction.verifiedAt))
        return this.db.drug.get({_id:transaction.drug._id}).then(drugs => {
          //This will add drugs upto the point where a drug cannot be found rather than rejecting all
          if (drugs[0]) return {drug:drugs[0], transaction}
          throw 'Cannot find drug with _id '+transaction.drug._id
        })
      }))
    })
    .then(rows => {
      console.log('rows', rows)
      return Promise.all(rows.map(row => this.addTransaction(row.drug, row.transaction)))
    })
    .then(_ => this.snackbar.show('All Transactions Imported'))
    .catch(err => this.snackbar.show('Transactions not imported: '+err))
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
      return ~ `${shipment.account.from.name} ${shipment.account.to.name} ${shipment.tracking} ${shipment.status}`.toLowerCase().indexOf(filter)
    })
  }
}

export class valueValueConverter {
  toView(transactions = [], decimals, trigger) {
    transactions = Array.isArray(transactions) ? transactions : [transactions]

    return transactions.reduce((total, transaction) => {
      if ( ! transaction.drug.price || ! transaction.qty) return 0
      let price = transaction.drug.price.nadac || transaction.drug.price.goodrx || 0
      let   qty = transaction.qty.to || transaction.qty.from || 0
      return total + qty * price
    }, 0).toFixed(decimals)
  }
}

export class drugNameValueConverter {
  toView(drug, regex){
    return genericName(drug).replace(regex, '<strong>$1</strong>') + (drug.brand ? ' ('+drug.brand+')' : '')
  }
}

export class boldValueConverter {
  toView(text, bold){
    return bold ? text.replace(RegExp('('+bold+')', 'i'), '<strong>$1</strong>') : text
  }
}

export class dateValueConverter {

  toView(date) {
    if ( ! date ) return ''
    return date != this.model ? date.slice(5,7)+'/'+date.slice(2,4) : this.view
  }

  fromView(date){

    let add = date.includes('+')
    let sub = date.includes('-')
    let {month, year} = parseUserDate(date.replace(/[+-]/, ''))

    if (add) month++
    if (sub) month--

    if (month == 0) {
      month = 12
      year--
    }

    if (month == 13) {
      month = 1
      year++
    }

    this.view  = month+'/'+year

    return this.model = toJsonDate({month, year})
  }
}

//whether mm/yy or mm/dd/yy, month is always first and year is always last
function parseUserDate(date) {
  date = date.split('/')
  return {
    year:date.pop(),
    month:date.shift()
  }
}

//To get last day in month, set it to next month and subtract a day
function toJsonDate({month, year}) {
  let date = new Date('20'+year,month, 1)
  date.setDate(0)
  return date.toJSON()
}

function genericName(drug) {
  return drug.generics.map(generic => generic.name+" "+generic.strength).join(', ')+' '+drug.form
}
