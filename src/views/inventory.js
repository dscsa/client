import {inject} from 'aurelia-framework';
import {Db}     from '../libs/pouch'
import {Router} from 'aurelia-router';
import {Csv}    from '../libs/csv'
import {incrementBox, saveTransaction, focusInput, scrollSelect, drugSearch} from '../resources/helpers'

@inject(Db, Router)
export class inventory {

  constructor(db, router){
    this.db     = db
    this.router = router
    this.csv    = new Csv(['drug._id'], ['qty.from', 'qty.to', 'exp.from', 'exp.to', 'location', 'verifiedAt'])
    this.limit  = 100

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
    })
  }

  scrollGroups($event) {
    this.scrollSelect($event, this.group, this.groups, this.selectGroup)

    if ($event.which == 13)//Enter get rid of the results
      this.focusInput(`#exp_0`)
  }

  selectGroup(group = {}) {
    group.inventory = true
    this.db.transaction.get(group, {limit:this.limit})
    .then(transactions => {
      if (transactions.length == this.limit)
        this.snackbar.show(`Displaying first 100 results`)

      if (group.generic)
        this.term  = group.generic

      this.group = group
      group.transactions = transactions.sort((a, b) => {
        let aExp = a.exp.to || a.exp.from || ''
        let bExp = b.exp.to || b.exp.from || ''
        let aQty = a.qty.to || a.qty.from || ''
        let bQty = b.qty.to || b.qty.from || ''
        let aBox = a.location || ''
        let bBox = b.location || ''

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
        this.filter.exp[transaction.exp.to || transaction.exp.from] = {isChecked:true, count:0, qty:0}
        this.filter.ndc[transaction.drug._id]   = {isChecked:true, count:0, qty:0}
        this.filter.form[transaction.drug.form] = {isChecked:true, count:0, qty:0}
      }
    })
  }

  resetFilter() {
    this.filter = {exp:{},ndc:{},form:{}}
  }

  search() {
    if (/[A-Z][0-9]{1,3}/.test(this.term))
      return this.selectGroup({location:this.term})

    if (/20\d\d-\d\d-?\d?\d?/.test(this.term))
      return this.selectGroup({exp:this.term})

    this.drugSearch().then(drugs => {
      let groups = {}
      for (let drug of drugs) {
        groups[drug.generic] = groups[drug.generic] || {generic:drug.generic}
      }
      this.groups = Object.keys(groups).map(key => groups[key])
    })
  }

  signalFilter(obj) {
    if (obj) obj.val.isChecked = ! obj.val.isChecked
    this.filter = Object.assign({}, this.filter)
  }

  repackInventory() {
    let repack = []
    for (let transaction of this.group.transactions) {
      if (transaction.isChecked) {
        transaction.next = transaction.next || []
        transaction.next.push({qty:transaction.qty.to || transaction.qty.from, dispensed:{}})
        this.db.transaction.put(transaction).then(_ => {
          this.group.transactions.splice(this.group.transactions.indexOf(transaction), 1)
        }).catch(err => {
          transaction.isChecked = ! transaction.isChecked
          this.snackbar.show(`Error repacking: ${err.reason || err.message}`)
        })
      }
    }
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

  exportCSV() {
    let name = 'Inventory.csv'
    this.db.transaction.get({inventory:true}).then(inventory => {
      this.csv.unparse(name, inventory.map(row => {
        row.next = JSON.stringify(row.next || [])
        return row
      }))
    })
  }

  importCSV() {
    console.log('this.$file.value', this.$file.value)
    this.csv.parse(this.$file.files[0]).then(parsed => {
      return Promise.all(parsed.map(transaction => {
        this.$file.value = ''  //Change event only fires if filename changed.  Manually set to blank in case user re-uploads same file (name)
        transaction._id          = undefined
        transaction._rev         = undefined
        transaction.next         = JSON.parse(transaction.next || "[]")
        return this.db.drug.get({_id:transaction.drug._id}).then(drugs => {
          //This will add drugs upto the point where a drug cannot be found rather than rejecting all
          if ( ! drugs[0])
            throw 'Cannot find drug with _id '+transaction.drug._id

          transaction.drug = {
            _id:drugs[0]._id,
            brand:drugs[0].brand,
            generic:drugs[0].generic,
            generics:drugs[0].generics,
            form:drugs[0].form,
            price:drugs[0].price,
            pkg:drugs[0].pkg
          }

          return transaction
        })
        .catch(drug => {
          console.log('Missing drug', transaction.drug._id, transaction.drug)
          throw drug
        })
      }))
    })
    .then(rows => {
      let chain = Promise.resolve()
      for (let i = 0; i < rows.length; i += 36*36) {
        chain = chain.then(_ => {
          let args = rows.slice(i, i+36*36)
          args = args.map(row => this.db.transaction.post(row))
          args.push(new Promise(r => setTimeout(r, 60000)))
          return Promise.all(args)
        })
        .catch(err => {
          console.log('importCSV error',  i, i+36*36, err)
          this.snackbar.show('Error Importing Inventory: '+JSON.stringify(err))
        })
      }
      return chain
    })
    .then(_ => this.snackbar.show(`Imported Inventory Items`))
  }
}
