import {inject, buildQueryString} from 'aurelia-framework';
import {Db}     from '../libs/pouch'
import {Router} from 'aurelia-router';
import {Csv}    from '../libs/csv'
import {canActivate, expShortcuts, qtyShortcuts, incrementBin, saveTransaction, focusInput, scrollSelect, drugSearch, waitForDrugsToIndex} from '../resources/helpers'

@inject(Db, Router)
export class inventory {

  constructor(db, router){
    this.db     = db
    this.router = router
    this.csv    = new Csv(['drug._id'], ['qty.from', 'qty.to', 'exp.from', 'exp.to', 'location', 'verifiedAt'])
    this.limit  = 100

    this.resetFilter()
    this.placeholder     = "Please Wait While the Drug Database is Indexed" //Put in while database syncs
    this.waitForDrugsToIndex = waitForDrugsToIndex
    this.expShortcuts    = expShortcuts
    this.qtyShortcuts    = qtyShortcuts
    this.saveTransaction = saveTransaction
    this.incrementBin    = incrementBin
    this.focusInput      = focusInput
    this.scrollSelect    = scrollSelect
    this.drugSearch      = drugSearch
    this.canActivate     = canActivate
  }

  activate(params) {

    this.waitForDrugsToIndex()

    if (Object.keys(params).length)
      this.selectGroup(params)

    this.db.user.session.get().then(session => {
      return this.db.account.get({_id:session.account._id})
    }).then(accounts => {
      this.ordered = accounts[0].ordered
    })
  }

  scrollGroups($event) {
    this.scrollSelect($event, this.group, this.groups, this.selectGroup)

    if ($event.which == 13)//Enter get rid of the results
      this.focusInput(`#exp_0`)
  }

  selectGroup(group) {
    this.router.navigate('inventory?'+buildQueryString(group), {trigger:false})
    this.db.transaction.get(Object.assign({inventory:true}, group), {limit:this.limit})
    .then(transactions => {
      if (transactions.length == this.limit)
        this.snackbar.show(`Displaying first 100 results`)

      this.term  = group.generic || group.location || group.exp

      this.group = group
      this.transactions = transactions.sort((a, b) => {
        let aExp = a.exp.to || a.exp.from || ''
        let bExp = b.exp.to || b.exp.from || ''
        let aQty = a.qty.to || a.qty.from || ''
        let bQty = b.qty.to || b.qty.from || ''
        let aBin = a.location || ''
        let bBin = b.location || ''

        if (aBin > bBin) return -1
        if (aBin < bBin) return 1
        if (aExp < bExp) return -1
        if (aExp > bExp) return 1
        if (aQty > bQty) return -1
        if (aQty < bQty) return 1
        return 0
      })

      this.resetFilter()
      for (let transaction of this.transactions) {
        this.filter.exp[transaction.exp.to || transaction.exp.from] = {isChecked:true, count:0, qty:0}
        this.filter.ndc[transaction.drug._id]   = {isChecked:true, count:0, qty:0}
        this.filter.form[transaction.drug.form] = {isChecked:true, count:0, qty:0}
      }
    })
    .catch(console.log)
  }

  resetFilter() {
    this.filter = {exp:{},ndc:{},form:{}}
  }

  search() {
    if (/[A-Z][0-9]{3}/.test(this.term))
      return this.selectGroup({location:this.term})

    if (/20\d\d-\d\d-?\d?\d?/.test(this.term))
      return this.selectGroup({exp:this.term})

    this.drugSearch().then(drugs => {
      let groups = {}
      for (let drug of drugs) {
        groups[drug.generic] = groups[drug.generic] || {generic:drug.generic}
      }
      this.groups = Object.keys(groups).map(key => groups[key]) //Polyfill for Object.values
    })
  }

  signalFilter(obj) {
    if (obj) obj.val.isChecked = ! obj.val.isChecked
    this.filter = Object.assign({}, this.filter)
  }

  removeInventory(nextDescription) {
    let repack = []
    //since we are deleting as we go, loop backward
    for (let i = this.transactions.length - 1; i >= 0; i--)  {
      let transaction = this.transactions[i]
      if (transaction.isChecked) {
        transaction.next    = transaction.next || []
        nextDescription.qty = transaction.qty.to || transaction.qty.from
        transaction.next.push(nextDescription)
        this.transactions.splice(i, 1)
        this.db.transaction.put(transaction).catch(err => {
          transaction.next.pop()
          this.transactions.splice(i, 0, transaction)
          this.snackbar.show(`Error removing inventory: ${err.reason || err.message}`)
        })
      }
    }
  }

  pendInventory() {
    this.removeInventory({pended:{pendedAt:new Date().toJSON()}})
  }

  dispenseInventory() {
    this.removeInventory({dispensed:{dispensedAt:new Date().toJSON()}})
  }

  repackInventory() {
    this.removeInventory({repacked:{repackedAt:new Date().toJSON()}})

    //TODO how to add the correct number of bottles, qty, and expiration
  }

  binShortcuts($event, $index) {
    if ($event.which == 13) //Enter should focus on next row's exp
      return this.focusInput(`#exp_${$index+1}`)

    return this.incrementBin($event, this.transactions[$index])
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
      for (let i = 0; i < rows.length; i += 36*30-1) {
        chain = chain.then(_ => {
          let args = rows.slice(i, i+36*30-1)
          args = args.map(row => this.db.transaction.post(row))
          args.push(new Promise(r => setTimeout(r, 4000)))
          return Promise.all(args)
        })
        .catch(err => {
          console.log('importCSV error',  i, i+36*30-1, err)
          this.snackbar.show('Error Importing Inventory: '+JSON.stringify(err))
        })
      }
      return chain
    })
    .then(_ => this.snackbar.show(`Imported Inventory Items`))
  }
}
