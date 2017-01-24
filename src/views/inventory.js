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
    this.repack = {size:30}
    this.transactions = []

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
      this.account = session.account._id
      return this.db.account.get({_id:this.account})
    }).then(accounts => {
      this.ordered = accounts[0].ordered
    })

    this.db.transaction.get({pending:true}).then(transactions => {
      let pending = {}
      transactions = this.sortTransactions(transactions)
      for (let transaction of transactions) {
        transaction.isChecked = true //checked by default
        let createdAt = transaction.next[0].createdAt
        pending[createdAt] = pending[createdAt] || []
        pending[createdAt].push(transaction)
      }
      this.pending = Object.keys(pending).map(key => pending[key])
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
      this.pendingIndex = null
      transactions = this.sortTransactions(transactions)
      this.setTransactions(transactions)
    })
    .catch(console.log)
  }

  selectPending($index) {
    let transactions = this.pending[$index]
    this.term = transactions[0].drug.generic
    this.pendingIndex = $index
    this.setTransactions(transactions)
  }

  sortTransactions(transactions) {
    return transactions.sort((a, b) => {
      let aExp  = a.exp.to || a.exp.from || ''
      let bExp  = b.exp.to || b.exp.from || ''
      let aQty  = a.qty.to || a.qty.from || ''
      let bQty  = b.qty.to || b.qty.from || ''
      let aBin  = a.location || ''
      let bBin  = b.location || ''
      let aPack = this.isRepacked(a)
      let bPack = this.isRepacked(b)

      if (aPack > bPack) return -1
      if (aPack < bPack) return 1
      if (aBin > bBin) return -1
      if (aBin < bBin) return 1
      if (aExp < bExp) return -1
      if (aExp > bExp) return 1
      if (aQty > bQty) return -1
      if (aQty < bQty) return 1
      return 0
    })
  }

  isRepacked(transaction) {
    return transaction.shipment._id.indexOf('.') == -1
  }

  setTransactions(transactions) {
    this.transactions = transactions
    this.signalFilter() //inventerFilterValueConverter sets the filter object, we need to make sure this triggers aurelia
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

  updateNextOfSelected(updateFn) {
    let createdAt = new Date().toJSON() //must be exact same timestamp for group of pending items
    let length    = this.transactions.length
    let checked   = []
    //since we may be deleting as we go, loop backward
    for (let i = length - 1; i >= 0; i--)  {
      let transaction = this.transactions[i]

      if ( ! transaction.isChecked) continue

      checked.push(transaction)

      transaction.next = updateFn(transaction)
      for (let val of transaction.next)
        val.createdAt = createdAt

      this.transactions.splice(i, 1)
      this.db.transaction.put(transaction).catch(err => {
        transaction.next.pop()
        this.transactions.splice(i, 0, transaction)
        this.snackbar.show(`Error removing inventory: ${err.reason || err.message}`)
      })
    }

    if (this.pendingIndex != null && checked.length == length) {
      this.pending.splice(this.pendingIndex, 1)
      this.pendingIndex = null
    }

    return checked
  }

  unpendInventory() {
    this.updateNextOfSelected(_ => [])
  }

  pendInventory() {
    let selectedTransactions = this.updateNextOfSelected(_ => [{pending:{}}])
    this.pending.unshift(selectedTransactions)
  }

  dispenseInventory() {
    this.updateNextOfSelected(_ => [{dispensed:{}}])
  }

  //TODO this allows for mixing different NDCs with a common generic name, should we prevent this or warn the user?
  repackInventory() {
    let all = [], createdAt = new Date().toJSON()

    //Create the new (repacked) transactions
    for (let i=0; i<this.repack.vials; i++)
      all.push(this.db.transaction.post({
        verifiedAt:new Date().toJSON(),
        exp:{to:this.repack.exp, from:null},
        qty:{to:this.repack.size, from:null},
        location:this.repack.location,
        drug:this.transactions[0].drug,
        next:this.pendingIndex != null ? [{pending:{}, createdAt}] : [] //Keep it pending if we are on pending screen
      }))

    //Once we have the new _ids insert them into the next property of the checked transactions
    Promise.all(all).then(all => {
      this.transactions.unshift(...all) //Add the drugs to the view

      let label = [
        `<p style="page-break-after:always;">`,
        `<strong>${this.transactions[0].drug.generic+' '+this.transactions[0].drug.form}</strong>`,
        `Ndc ${this.transactions[0].drug._id}`,
        `Exp ${this.repack.exp.slice(0, 10)}`,
        `Bin ${this.repack.location}`,
        `Qty ${this.repack.size}`,
        `Pharmacist ________________`,
        `</p>`
      ]

      let win = window.open()
      win.document.write(label.join('<br>').repeat(this.repack.vials))
      win.print()
      win.close()

      this.updateNextOfSelected(_ => all.map(val => {
        return {transaction:{_id:val._id}}
      }))
    }).catch(err => {
      console.error(err)
      this.snackbar.show(`Transactions could not repackaged: ${err.reason}`)
    })
  }

  setRepackVials() {
    this.repack.vials = +this.repack.size ? Math.floor(this.repack.qty / this.repack.size) : ''
  }

  openMenu($event) {
    if ($event.target.tagName != 'I')
      return true //only calculate for the parent element, <i vertical menu icon>, and not children //true needed so public inventory link works

    this.repack.qty = 0,
    this.repack.exp = '2099-01-01T00:00:00'
    for (let transaction of this.transactions) {
      if (transaction.isChecked) {
        this.repack.qty += transaction.qty.to
        this.repack.exp  = this.repack.exp < transaction.exp.to ? this.repack.exp : transaction.exp.to
      }
    }
    this.setRepackVials()
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
