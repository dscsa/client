import {inject} from 'aurelia-framework';
import {Db}     from '../libs/pouch'
import {Router} from 'aurelia-router';
import {csv}    from '../libs/csv'
import {canActivate, expShortcuts, qtyShortcuts, incrementBin, saveTransaction, focusInput, scrollSelect, drugSearch, waitForDrugsToIndex, toggleDrawer} from '../resources/helpers'

@inject(Db, Router)
export class inventory {

  constructor(db, router){
    this.db     = db
    this.router = router
    this.csv    = csv
    this.limit  = 100
    this.repack = {size:30}
    this.transactions = []

    this.placeholder     = "Search by generic name, ndc, exp, or bin" //Put in while database syncs
    this.waitForDrugsToIndex = waitForDrugsToIndex
    this.expShortcuts    = expShortcuts
    this.qtyShortcuts    = qtyShortcuts
    this.saveTransaction = saveTransaction
    this.incrementBin    = incrementBin
    this.focusInput      = focusInput
    this.scrollSelect    = scrollSelect
    this.drugSearch      = drugSearch
    this.canActivate     = canActivate
    this.toggleDrawer    = toggleDrawer
    this.reset           = $event => {
      if ($event.newURL.slice(-9) == 'inventory') {
        this.term = ''
        this.allChecked = false
        this.setTransactions([])
      }
    }
  }

  deactivate() {
    window.removeEventListener("hashchange", this.reset)
  }

  activate(params) {
    //TODO find a more elegant way to accomplish this
    window.addEventListener("hashchange", this.reset)

    //TODO replace this with page state library
    this.db.user.session.get().then(session => {

      this.user    = session._id
      this.account = session.account._id

      this.db.transaction.query('inventory.pendingAt', {include_docs:true, startkey:[this.account], endkey:[this.account, {}]})
      .then(res => {
        this.pending = this.sortTransactions(res.rows.map(row => row.doc))
        .reduce((pending, transaction) => {
          transaction.isChecked = true //checked by default
          let createdAt = transaction.next[0].createdAt
          pending[createdAt] = pending[createdAt] || []
          pending[createdAt].push(transaction)
          return pending
        }, {})
      })
      .then(_ => {
        let keys = Object.keys(params)
        if (keys[0])
          this.selectTerm(keys[0], params[keys[0]])
      })

      return this.db.account.get(this.account)
    }).then(account => this.ordered = account.ordered)
  }

  scrollTerms($event) {
    this.scrollSelect($event, this.term, this.terms, term => this.selectTerm('drug.generic', term))

    if ($event.which == 13)//Enter get rid of the results
      this.focusInput(`#exp_0`)
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

  checkTransaction(transaction) {
    transaction.isChecked = ! transaction.isChecked

    if ( ! transaction.isChecked)
      this.allChecked = false
  }

  checkAllTransactions() {
    this.allChecked = ! this.allChecked
    for (let transaction of this.transactions)
      transaction.isChecked = this.allChecked
  }

  isRepacked(transaction) {
    return transaction.shipment._id.indexOf('.') == -1
  }

  setTransactions(transactions) {
    if (transactions.length == this.limit)
      this.snackbar.show(`Displaying first 100 results`)

    this.transactions = this.sortTransactions(transactions)
    this.signalFilter() //inventerFilterValueConverter sets the filter object, we need to make sure this triggers aurelia
  }

  search() {
    if (/[A-Z][0-9]{3}/.test(this.term))
      return this.selectTerm('location', this.term)

    if (/20\d\d-\d\d-?\d?\d?/.test(this.term))
      return this.selectTerm('exp', this.term, true)

    //Drug search is by NDC and we want to group by generic
    this.drugSearch().then(drugs => {
      this.terms = drugs.map(drug => drug.generic).filter((generic, index, generics) => generics.indexOf(generic) == index);
    })
  }

  selectPending(pendingAt) {
    this.term = 'Pending '+pendingAt
    this.allChecked = true
    this.setTransactions(this.pending[pendingAt] || [])
    this.toggleDrawer()
  }

  selectTerm(type, key) {

    this.router.navigate(`inventory?${type}=${key}`, {trigger:false})

    if (type == 'pending')
      return this.selectPending(key)

    this.term = key
    this.allChecked = false

    let opts = {include_docs:true, limit:this.limit}
    if (type != 'generic') {
      opts.startkey = [this.account, key]
      opts.endkey   = [this.account, key+'\uffff']
    } else {
      opts.key = [this.account, key]
    }
    const setTransactions = res => this.setTransactions(res.rows.map(row => row.doc))
    this.db.transaction.query('inventory.'+type, opts).then(setTransactions)
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
      this.db.transaction.put(transaction)
      .catch(err => {
        transaction.next.pop()
        this.transactions.splice(i, 0, transaction)
        this.snackbar.error('Error removing inventory', err)
      })
    }

    if (this.term.slice(0,7) == 'Pending' && checked.length == length) {
      delete this.pending[this.term.slice(8)]
      this.term = ''
      this.allChecked = false
      this.router.navigate(`inventory`, {trigger:false}) //don't accidentally go back here on reload
    }

    return checked
  }

  unpendInventory() {
    this.updateNextOfSelected(_ => [])
  }

  pendInventory() {
    let next = [{pending:{}}]
    let selectedTransactions = this.updateNextOfSelected(_ => next)
    //Aurelia doesn't provide an Object setter to detect arbitrary keys so we need
    //to trigger and update using Object.assign rather than just adding a property
    this.pending = Object.assign({[next[0].createdAt]:selectedTransactions}, this.pending)
  }

  dispenseInventory() {
    this.updateNextOfSelected(_ => [{dispensed:{}}])
  }

  //TODO this allows for mixing different NDCs with a common generic name, should we prevent this or warn the user?
  repackInventory() {
    let all = [], createdAt = new Date().toJSON()

    //Create the new (repacked) transactions
    for (let i=0; i<this.repack.vials; i++) {
      this.transactions.unshift({
        verifiedAt:new Date().toJSON(),
        exp:{to:this.repack.exp, from:null},
        qty:{to:this.repack.size, from:null},
        user:{_id:this.user},
        shipment:{_id:this.account},
        location:this.repack.location,
        drug:this.transactions[0].drug,
        next:this.pendingIndex != null ? [{pending:{}, createdAt}] : [] //Keep it pending if we are on pending screen
      })

      all.push(this.db.transaction.post(this.transactions[0]))
    }

    //Keep record of any excess that is implicitly destroyed
    let excess = this.repack.qty - (this.repack.size * this.repack.vials)
    if (excess > 0)
    {
      all.push(this.db.transaction.post({
        exp:{to:this.repack.exp, from:null},
        qty:{to:excess, from:null},
        user:{_id:this.user},
        shipment:{_id:this.account},
        drug:this.transactions[0].drug,
        next:[] //Keep it pending if we are on pending screen
      }))
    }

    //Once we have the new _ids insert them into the next property of the checked transactions
    Promise.all(all).then(all => {

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

      this.updateNextOfSelected(_ => all.map(val => {
        return {transaction:{_id:val.id}}
      }))

      let win = window.open()
      if ( ! win)
        return this.snackbar.show(`Enable browser pop-ups to print repack labels`)

      win.document.write(label.join('<br>').repeat(this.repack.vials))
      win.print()
      win.close()
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
    this.db.transaction.query('inventory.drug.generic', {include_docs:true, startkey:[this.account], endkey:[this.account, {}]})
    .then(res => {
      return res.rows.map(row => {
        row.doc.next = JSON.stringify(row.doc.next)
        return row.doc
      })
    })
    .then(rows => this.csv.fromJSON(`Inventory ${new Date().toJSON()}.csv`, rows))
  }

  // importCSV() {
  //   this.csv.toJSON(this.$file.files[0], parsed => {
  //     this.$file.value = ''
  //     return Promise.all(parsed.map(transaction => {
  //       transaction._err        = undefined
  //       transaction._id          = undefined
  //       transaction._rev         = undefined
  //       transaction.next         = JSON.parse(transaction.next)
  //       //This will add drugs upto the point where a drug cannot be found rather than rejecting all
  //       return this.db.drug.get(transaction.drug._id)
  //       .then(drug => {
  //         transaction.drug = {
  //           _id:drug._id,
  //           brand:drug.brand,
  //           generic:drug.generic,
  //           generics:drug.generics,
  //           form:drug.form,
  //           price:drug.price,
  //           pkg:drug.pkg
  //         }
  //
  //         return this.db.transaction.post(transaction)
  //       })
  //       .then(_ => { //do not return anything so we don't download successes
  //         this.transactions.unshift(transaction)
  //       })
  //       .catch(err => {
  //         transaction._err = 'Upload Error: '+JSON.stringify(err)
  //         return transaction //return something so we do download errors
  //       })
  //     }))
  //   })
  //   .then(rows => this.snackbar.show('Import Succesful'))
  //   .catch(err => this.snackbar.error('Import Error', err))
  // }

  importCSV() {
    this.snackbar.show(`Parsing csv file`)
console.log(1)
    this.csv.toJSON(this.$file.files[0], transactions => {
      this.$file.value = ''
      let errs  = []
      let chain = Promise.resolve()
console.log(2)
      for (let i in transactions) {
        chain = chain
        .then(_ => {
          let transaction = transactions[i]
console.log(3)
          transaction._err = undefined
          transaction._id  = undefined
          transaction._rev = undefined
          transaction.next = JSON.parse(transaction.next)
          //This will add drugs upto the point where a drug cannot be found rather than rejecting all
          return this.db.drug.get(transaction.drug._id)
          .then(drug => {
            console.log(4)
            transaction.drug = {
              _id:drug._id,
              brand:drug.brand,
              generic:drug.generic,
              generics:drug.generics,
              form:drug.form,
              price:drug.price,
              pkg:drug.pkg
            }

            return this.db.transaction.post(transaction)
          })
          .catch(err => {
            console.log(5)
            transaction._err = 'Upload Error: '+JSON.stringify(err)
            errs.push(transaction)
          })
          .then(_ => {
            console.log(6)
            if (+i && (i % 100 == 0))
              this.snackbar.show(`Imported ${i} of ${transactions.length}`)
          })
        })
      }

      return chain.then(_ => errs)  //return something so we do download errors
    })
    .then(rows => this.snackbar.show('Import Succesful'))
    .catch(err => this.snackbar.error('Import Error', err))
  }

  // importCSV() {
  //   console.log('this.$file.value', this.$file.value)
  //   this.csv.parse(this.$file.files[0]).then(parsed => {
  //     return Promise.all(parsed.map(transaction => {
  //       this.$file.value = ''  //Change event only fires if filename changed.  Manually set to blank in case user re-uploads same file (name)
  //       transaction._id          = undefined
  //       transaction._rev         = undefined
  //       transaction.next         = JSON.parse(transaction.next || "[]")
  //       return this.db.drug.get({_id:transaction.drug._id}).then(drugs => {
  //         //This will add drugs upto the point where a drug cannot be found rather than rejecting all
  //         if ( ! drugs[0])
  //           throw 'Cannot find drug with _id '+transaction.drug._id
  //
  //         transaction.drug = {
  //           _id:drugs[0]._id,
  //           brand:drugs[0].brand,
  //           generic:drugs[0].generic,
  //           generics:drugs[0].generics,
  //           form:drugs[0].form,
  //           price:drugs[0].price,
  //           pkg:drugs[0].pkg
  //         }
  //
  //         return transaction
  //       })
  //       .catch(drug => {
  //         console.log('Missing drug', transaction.drug._id, transaction.drug)
  //         throw drug
  //       })
  //     }))
  //   })
  //   .then(rows => {
  //     let chain = Promise.resolve()
  //     for (let i = 0; i < rows.length; i += 36*30-1) {
  //       chain = chain.then(_ => {
  //         let args = rows.slice(i, i+36*30-1)
  //         args = args.map(row => this.db.transaction.post(row))
  //         args.push(new Promise(r => setTimeout(r, 4000)))
  //         return Promise.all(args)
  //       })
  //       .catch(err => {
  //         console.log('importCSV error',  i, i+36*30-1, err)
  //         this.snackbar.show('Error Importing Inventory: '+JSON.stringify(err))
  //       })
  //     }
  //     return chain
  //   })
  //   .then(_ => this.snackbar.show(`Imported Inventory Items`))
  // }
}
