import {inject} from 'aurelia-framework';
import {Db}     from '../libs/pouch'
import {Router} from 'aurelia-router';
import {incrementBox, saveTransaction, focusInput, scrollSelect, drugSearch} from '../resources/helpers'

@inject(Db, Router)
export class inventory {

  constructor(db, router){
    this.db        = db
    this.router    = router
    this.resetFilter()

    this.saveTransaction = saveTransaction
    this.incrementBox    = incrementBox
    this.focusInput      = focusInput
    this.scrollSelect    = scrollSelect
    this.drugSearch      = drugSearch
  }

  activate(params) {
    return this.db.user.session.get().then(session => {
      this.account = session.account._id
      this.selectGroup()
    })
  }

  scrollGroups($event) {
    let index = this.groups.reduce((a, group, index) => group.name == this.group.name ? index : a, 0)
    this.scrollSelect($event, index, this.groups, this.selectGroup)

    if ($event.which == 13)//Enter get rid of the results
      this.focusInput(`#exp_0`)
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
    this.drugSearch().then(drugs => {
      let groups = {}
      for (let drug of drugs) {
        if ( ! drug.generic)
        console.log('drug.generic', drug.generic, drug)
        groups[drug.generic] = groups[drug.generic] || {name:drug.generic}
      }
      this.groups = Object.keys(groups).map(key => groups[key])
    })
  }

  signalFilter(obj) {
    if (obj) obj.val.isChecked = ! obj.val.isChecked
    this.filter = Object.assign({}, this.filter)
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
    if ($event.which == 13) //Enter should focus on quantity
      return this.focusInput(`#qty_${$index}`)

    return true
  }

  //TODO same as shipment's method (without autocheck)
  qtyShortcuts($event, $index) {
    if ($event.which == 13) //Enter should focus on rx_input, unless it is hidden http://stackoverflow.com/questions/19669786/check-if-element-is-visible-in-dom
      return this.focusInput(`#box_${$index}`)

    return true
  }

  //TODO same as shipment's method
  boxShortcuts($event, $index) {
    if ($event.which == 13) //Enter should focus on next row's exp
      return this.focusInput(`#exp_${$index+1}`)

    return this.incrementBox($event, this.group.transactions[$index])
  }
}
