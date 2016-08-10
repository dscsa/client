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

  saveTransaction(transaction) {
    //save isChecked in the transaction because the isChecked[$index] has an $index that changes with filters
    let isChecked = transaction.isChecked
    delete transaction.isChecked
    console.log('saving', transaction)
    this.db.transaction.put(transaction)
    .then(_ => {
      transaction.isChecked = isChecked
    })
    .catch(e => this.snackbar.show(`Transaction with exp ${transaction.exp.from} and qty ${transaction.qty.from} could not be saved: ${e}`))
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
}

//TODO combine with the shipment filter with the same code
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
