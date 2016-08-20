import {inject} from 'aurelia-framework';
import {Db}     from '../libs/pouch'
import {Router} from 'aurelia-router';

@inject(Db, Router)
export class inventory {

  constructor(db, router){
    this.db        = db
    this.router    = router
    this.resetFilter()
  }

  activate(params) {
    return this.db.user.session.get().then(session => {
      this.account = session.account._id
      this.selectGroup()
    })
  }

  scrollGroups($event) {
    //group won't be a reference so we must search manually
    let index = this.groups.map(group => group.name).indexOf(this.group.name)
    let last  = this.groups.length - 1

    if ($event.which == 38) //Keyup
      this.selectGroup(this.groups[index > 0 ? index - 1 : last])

    if ($event.which == 40) //keydown
      this.selectGroup(this.groups[index < last ? index+1 : 0])

    if ($event.which == 13) { //Enter get rid of the results
      document.querySelector('md-autocomplete input').blur()
    }
  }

  selectGroup(group) {
    group = group || this.search().then(_ => {
      return this.groups[0] || {transactions:[]}
    })

    Promise.resolve(group).then(group => {
      this.term  = group.name
      this.group = group

      group.transactions.sort((a, b) => {
        let aExp = a.exp.from || ''
        let bExp = b.exp.from || ''
        let aBox = a.location || ''
        let bBox = b.location || ''
        let aQty = a.qty.from || ''
        let bQty = b.qty.from || ''

        if (aBox > bBox) return -1
        if (aBox < bBox) return 1
        if (aExp < bExp) return -1
        if (aExp > bExp) return 1
        if (aQty > bQty) return -1
        if (aQty < bQty) return 1
        return 0
      })

      this.resetFilter()
      for (let transaction of group.transactions) {
        this.filter.exp[transaction.exp.from] = {isChecked:true, count:0, qty:0}
        this.filter.ndc[transaction.drug._id] = {isChecked:true, count:0, qty:0}
      }
    })
  }

  resetFilter() {
    this.filter = {exp:{},ndc:{}}
  }

  search() {

    let term = (this.term || '').trim()

    if (term.length < 3)
      return Promise.resolve(this.groups = [])

    if (/^[\d-]+$/.test(term)) {
      //TODO make this an Rx search.  Also look up ndc in drug db to get generic name then do generic search
      // this.regex = RegExp('('+term+')', 'gi')
      // var transactions = this.db.transaction.get({ndc:term, 'shipment._id':this.account})
    } else {
      this.regex = RegExp('('+term.replace(/ /g, '|')+')', 'gi')
      var transactions = this.db.transaction.get({generic:term, 'shipment._id':this.account})
    }

    let groups = {}
    return transactions.then(transactions => {
      for (let transaction of transactions) {
        groups[transaction.drug.generic] = groups[transaction.drug.generic] || {name:transaction.drug.generic, transactions:[]}
        groups[transaction.drug.generic].transactions.push(transaction)
      }
      this.groups = Object.keys(groups).map(key => groups[key])
    })
  }

  signalFilter(obj) {
    if (obj) obj.val.isChecked = ! obj.val.isChecked
    this.filter = Object.assign({}, this.filter)
  }

  saveTransaction($index) {
    Promise.resolve(this._saveTransaction).then(_ => {

      if ( ! document.querySelector('#exp_'+$index+' input').validity.valid)
        return true

      console.log('saving', this.group.transactions[$index])
      this._saveTransaction = this.db.transaction.put(this.group.transactions[$index])
    })
    .catch(err => this.snackbar.show(`Error saving transaction: ${err.reason || err.message }`))
  }

  removeInventory() {
    let remove = []
    for (let transaction of this.group.transactions) {
      if (transaction.isChecked) {
        remove.push(this.db.transaction.delete(transaction).then(_ =>
          this.group.transactions.splice(this.group.transactions.indexOf(transaction), 1)
        ))
      }
    }

    Promise.all(remove).then(_ => this.snackbar.show(`${remove.length} transactions removed from inventory`))
  }

  //TODO same as shipment's method (without autocheck)
  expShortcuts($event, $index) {
    if ($event.which == 37 || $event.which == 39 || $event.which == 9)
      return true //ignore left and right arrows and tabs to prevent unnecessary autochecks https://css-tricks.com/snippets/javascript/javascript-keycodes/

    if ($event.which == 13) {//Enter should focus on quantity
      document.querySelector('#qty_'+$index+' input').focus()
      return false
    }

    return true
  }

  //TODO same as shipment's method (without autocheck)
  qtyShortcuts($event, $index) {
    if ($event.which == 13) { //Enter should focus on rx_input, unless it is hidden http://stackoverflow.com/questions/19669786/check-if-element-is-visible-in-dom
      document.querySelector('#box_'+$index+' input').focus()
      return false
    }

    return true
  }

  //TODO same as shipment's method
  boxShortcuts($event, $index) {
    if ($event.which == 13) {//Enter should focus on quantity
      document.querySelector('#exp_'+($index+1)+' input').focus()
      return false
    }

    if ($event.which == 107 || $event.which == 187) { // + key on numpad, keyboard
      let transaction = this.group.transactions[$index]
      transaction.location = transaction.location[0]+(+transaction.location.slice(1)+1)
      return false //don't actually add the +
    }

    if ($event.which == 109 || $event.which == 189) {// - key on numpad, keyboard
      let transaction = this.group.transactions[$index]
      transaction.location = transaction.location[0]+(+transaction.location.slice(1)-1)
      return false //don't actually add the -
    }

    return true
  }
}

//TODO Same as shipment's number converter.
export class numberValueConverter {
  fromView(str){
    //Match servers transaction.js default: Empty string -> null, string -> number, number -> number (including 0)
    return str != null && str !== '' ? +str : null
  }
}

//TODO Same as shipment's number converter.
export class dateValueConverter {

  toView(date) {
    if ( ! date ) return ''
    return date != this.model ? date.slice(5,7)+'/'+date.slice(2,4) : this.view
  }

  fromView(date){
    let add = date.includes('+') || date.includes('=')
    let sub = date.includes('-')
    let {month, year} = parseUserDate(date.replace(/\+|\-|\=/g, ''))

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

    //Keep zerp padding in front of the month which is lost when month changes
    this.view  = ("00"+month).slice(-2)+'/'+year

    return this.model = toJsonDate({month, year})
  }
}

//TODO Same as shipment's function
//whether mm/yy or mm/dd/yy, month is always first and year is always last
function parseUserDate(date) {
  date = (date || "").split('/') //can't do default arugment because can be null as well as undefined
  return {
    year:date.pop(),
    month:date.shift()
  }
}

//TODO Same as shipment's function
//To get last day in month, set it to next month and subtract a day
function toJsonDate({month, year}) {
  let date = new Date('20'+year,month, 1)
  date.setDate(0)
  return date.toJSON()
}

export class jsonValueConverter {
  toView(object = null){
    return JSON.stringify(object, null, " ")
  }
}

export class toArrayValueConverter {
  toView(obj = {}){
    let arr = []
    for (var key in obj)
      arr.push({key, val:obj[key]})

    return arr
  }
}

//ADDED step of converting object to array
export class filterValueConverter {
  toView(transactions = [], filter){
    for (let transaction of transactions) {
      filter.exp[transaction.exp.from].count = 0
      filter.exp[transaction.exp.from].qty = 0
      filter.ndc[transaction.drug._id].count = 0
      filter.ndc[transaction.drug._id].qty = 0
    }

    transactions = transactions.filter(transaction => {
      if (filter.rx) {
        if ( ! transaction.rx || ! transaction.rx.from) return false
        if ( ! transaction.rx.from.includes(filter.rx)) return false
      }

      if ( ! filter.exp[transaction.exp.from].isChecked) {
        if (filter.ndc[transaction.drug._id].isChecked) {
          filter.exp[transaction.exp.from].count++
          filter.exp[transaction.exp.from].qty += transaction.qty.from
        }
        return false
      }
      if ( ! filter.ndc[transaction.drug._id].isChecked) {
        if (filter.exp[transaction.exp.from].isChecked) {
          filter.ndc[transaction.drug._id].count++
          filter.ndc[transaction.drug._id].qty += transaction.qty.from
        }
        return false
      }

      filter.exp[transaction.exp.from].count++
      filter.ndc[transaction.drug._id].count++
      filter.exp[transaction.exp.from].qty += transaction.qty.from
      filter.ndc[transaction.drug._id].qty += transaction.qty.from
      return true
    })

    filter.exp = Object.assign({}, filter.exp)
    filter.ndc = Object.assign({}, filter.ndc)

    return transactions
  }
}

function genericName(drug) {
  return drug.generics.map(generic => generic.name+" "+generic.strength).join(', ')+' '+drug.form
}
