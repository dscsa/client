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
    if ($event.which == 13) {//Enter should focus on next row's exp
      document.querySelector('#exp_'+($index+1)+' input').focus()
      return false
    }

    let transaction = this.group.transactions[$index]

    if ($event.which == 107 || $event.which == 187) { // + key on numpad, keyboard
      transaction.location = transaction.location[0]+(+transaction.location.slice(1)+1)
      this.saveTransaction($index)
      return false //don't actually add the +/-
    }

    if ($event.which == 109 || $event.which == 189) { // - key on numpad, keyboard
      transaction.location = transaction.location[0]+(+transaction.location.slice(1)-1)
      this.saveTransaction($index)
      return false //don't actually add the +/-
    }

    return true //don't cancel someone typing in the box number
  }
}
