import {inject} from 'aurelia-framework';
import {Pouch}     from '../libs/pouch'
import {Router} from 'aurelia-router';
import {csv}    from '../libs/csv'
import {canActivate, expShortcuts, qtyShortcuts, removeTransactionIfQty0, incrementBin, saveTransaction, focusInput, scrollSelect, drugSearch, waitForDrugsToIndex, toggleDrawer} from '../resources/helpers'

@inject(Pouch, Router)
export class inventory {

  constructor(db, router){
    this.db     = db
    this.router = router
    this.csv    = csv
    this.limit  = 100
    this.repack = {}
    this.transactions = []

    this.placeholder     = "Search by generic name, ndc, exp, or bin" //Put in while database syncs
    this.waitForDrugsToIndex = waitForDrugsToIndex
    this.expShortcuts    = expShortcuts
    this.qtyShortcutsKeydown    = qtyShortcuts
    this.removeTransactionIfQty0 = removeTransactionIfQty0
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
        this.visibleChecked = false
        this.setTransactions()
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
      //Swap second (row) and third (column) digits.  Because it's easier to
      //to shop by column first because it doesn't require the shopper to move
      let aBin  = a.bin ? a.bin[0]+a.bin[2]+a.bin[1]+(a.bin[3] || '') : ''
      let bBin  = b.bin ? b.bin[0]+b.bin[2]+b.bin[1]+(b.bin[3] || '') : ''
      let aPack = this.isRepacked(a)
      let bPack = this.isRepacked(b)

      if (aPack > bPack) return -1
      if (aPack < bPack) return 1
      if (aBin > bBin) return 1
      if (aBin < bBin) return -1
      if (aExp < bExp) return 1
      if (aExp > bExp) return -1
      if (aQty > bQty) return 1
      if (aQty < bQty) return -1

      return 0
    })
  }

  checkTransaction(transaction) {

    transaction.isChecked = ! transaction.isChecked

    if ( ! transaction.isChecked)
      this.visibleChecked = false
  }

  //Check all visible (non-filtered) transactions
  checkVisibleTransactions() {
    this.visibleChecked = ! this.visibleChecked

    let visibleTransactions = inventoryFilterValueConverter.prototype.toView(this.transactions, this.filter)
    console.log('visible transactions', visibleTransactions.length, 'of', this.transactions.length)
    for (let transaction of visibleTransactions)
      transaction.isChecked = this.visibleChecked
  }

  isRepacked(transaction) {
    return transaction.bin && transaction.bin.length == 3
  }

  setTransactions(transactions = []) {
    if (transactions.length == this.limit)
      this.snackbar.show(`Displaying first 100 results`)

    this.transactions = this.sortTransactions(transactions)
    this.signalFilter() //inventerFilterValueConverter sets the filter object, we need to make sure this triggers aurelia
  }

  search() {
    if (/[A-Z][0-9]{3}/.test(this.term))
      return this.selectTerm('bin', this.term)

    if (/20\d\d-\d\d-?\d?\d?/.test(this.term))
      return this.selectTerm('exp', this.term, true)

    //Drug search is by NDC and we want to group by generic
    this.drugSearch().then(drugs => {
      this.terms = drugs.map(drug => drug.generic).filter((generic, index, generics) => generics.indexOf(generic) == index);
    })
  }

  selectPending(pendingAt) {
    let transactions = this.pending[pendingAt]

    if (transactions)
      this.term = 'Pending '+transactions[0].drug.generic

    console.log('select pending', pendingAt, transactions)
    this.setTransactions(transactions)
    this.toggleDrawer()
  }

  selectTerm(type, key) {

    this.router.navigate(`inventory?${type}=${key}`, {trigger:false})

    if (type == 'pending')
      return this.selectPending(key)

    this.term = key
    this.visibleChecked = false

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

  updateSelected(updateFn) {
    const length = this.transactions.length
    let checked = []
    //since we may be deleting as we go, loop backward
    for (let i = length - 1; i >= 0; i--)  {
      let transaction = this.transactions[i]

      if ( ! transaction.isChecked) continue

      checked.push(transaction)

      updateFn(transaction)

      //Remove from transactions displayed. This currently works because all actions
      //pend, unpend, dispense, and repack remove transaction from the current list
      //if we add another action where this is not true, we will need to pass an additional parameter.
      this.transactions.splice(i, 1)

      //Save the transaction
      this.db.transaction.put(transaction)
      .catch(err => {
        transaction.next.pop()
        this.transactions.splice(i, 0, transaction)
        this.snackbar.error('Error removing inventory', err)
      })
    }

    //Remove pending items from drawer if all pending items were checked
    //check for this.term so we don't rerun this for each item
    if (this.term.slice(0,7) == 'Pending' && checked.length == length) {
      delete this.pending[this.term.slice(8)]
      this.term = ''
      this.router.navigate(`inventory`, {trigger:false}) //don't accidentally go back here on reload
    }

    this.visibleChecked = false

    return checked
  }

  unpendInventory() {
    this.updateSelected(transaction => transaction.next = [])
  }

  pendInventory() {
    const next = [{pending:{}, createdAt:new Date().toJSON()}]
    let checked = this.updateSelected(transaction => {
      transaction.isChecked = false
      transaction.next = next
    })

    //Aurelia doesn't provide an Object setter to detect arbitrary keys so we need
    //to trigger and update using Object.assign rather than just adding a property
    this.pending = Object.assign({[next[0].createdAt]:checked}, this.pending)
  }

  dispenseInventory() {
    const createdAt = new Date().toJSON()
    this.updateSelected(transaction => transaction.next = [{dispensed:{}, createdAt}])
  }

  disposeInventory() {
    const createdAt = new Date().toJSON()
    this.updateSelected(transaction => {
      transaction.verifiedAt = null
      transaction.bin = null
    })
  }

  //TODO this allows for mixing different NDCs with a common generic name, should we prevent this or warn the user?
  repackInventory() {
    let newTransactions = [], createdAt = new Date().toJSON()

    //Create the new (repacked) transactions
    for (let i=0; i<this.repack.vials; i++) {
      this.transactions.unshift({
        verifiedAt:new Date().toJSON(),
        exp:{to:this.repack.exp, from:null},
        qty:{to:+this.repack.vialQty, from:null},
        user:{_id:this.user},
        shipment:{_id:this.account},
        bin:this.repack.bin,
        drug:this.transactions[0].drug,
        next:this.pendingIndex != null ? [{pending:{}, createdAt}] : [] //Keep it pending if we are on pending screen
      })

      newTransactions.push(this.db.transaction.post(this.transactions[0]))
    }

    //Keep record of any excess that is implicitly destroyed
    let excess = this.repack.totalQty - (this.repack.vialQty * this.repack.vials)
    if (excess > 0)
    {
      newTransactions.push(this.db.transaction.post({
        exp:{to:this.repack.exp, from:null},
        qty:{to:excess, from:null},
        user:{_id:this.user},
        shipment:{_id:this.account},
        drug:this.transactions[0].drug,
        next:[] //Keep it pending if we are on pending screen
      }))
    }

    //Once we have the new _ids insert them into the next property of the checked transactions
    Promise.all(newTransactions).then(newTransactions => {

      let label = [
        `<p style="page-break-after:always;">`,
        `<strong>${this.transactions[0].drug.generic+' '+this.transactions[0].drug.form}</strong>`,
        `Ndc ${this.transactions[0].drug._id}`,
        `Exp ${this.repack.exp.slice(0, 7)}`,
        `Bin ${this.repack.bin}`,
        `Qty ${this.repack.vialQty}`,
        `Pharmacist ________________`,
        `</p>`
      ]

      const createdAt = new Date().toJSON()
      const next = newTransactions.map(newTransaction => {
        return {transaction:{_id:newTransaction.id}, createdAt}
      })

      this.updateSelected(transaction => transaction.next = next)

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
    this.repack.vials = this.repack.totalQty && +this.repack.vialQty ? Math.floor(this.repack.totalQty / this.repack.vialQty) : ''
  }

  openMenu($event) {
    if ($event.target.tagName != 'I')
      return true //only calculate for the parent element, <i vertical menu icon>, and not children //true needed so public inventory link works

    console.log('openMenu', this.ordered[this.term], this.repack, this.transactions[0]);
    const term = this.term.replace('Pending ', '')

    this.repack.vialQty = this.ordered[term] && this.ordered[term].vialQty ? this.ordered[term].vialQty : 90
    this.repack.totalQty = 0,
    this.repack.exp = ''
    for (let transaction of this.transactions) {
      if (transaction.isChecked) {
        this.repack.totalQty += transaction.qty.to
        this.repack.exp  = this.repack.exp && this.repack.exp < transaction.exp.to ? this.repack.exp : transaction.exp.to
      }
    }
    this.setRepackVials()
  }

  //Split functionality into Keydown and Input listeners because (keydown is set in constructor)
  //Don't put this code into input because enter (which == 13) does not trigger input event.
  //Don't put input code here because would then need a setTimeout for the quantity to actually change
  //and you would need to ignore non-input key values.  So it cleaner to just keep these listeners separate
  qtyShortcutsInput($event, $index) {
    //Only run autocheck if the transaction was not deleted
    this.removeTransactionIfQty0($event, $index)
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
        row.doc.next = JSON.stringify(row.doc.next);
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

    this.csv.toJSON(this.$file.files[0], transactions => {
      this.$file.value = ''
      let errs  = []
      let chain = Promise.resolve()

      for (let i in transactions) {
        chain = chain
        .then(_ => {
          let transaction = transactions[i]

          transaction._err = undefined
          transaction._id  = undefined
          transaction._rev = undefined
          transaction.next = JSON.parse(transaction.next)
          //This will add drugs upto the point where a drug cannot be found rather than rejecting all
          return this.db.drug.get(transaction.drug._id)
          .then(drug => {
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
            transaction._err = 'Upload Error: '+JSON.stringify(err)
            errs.push(transaction)
          })
          .then(_ => {
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

//ADDED step of converting object to array
export class inventoryFilterValueConverter {
  toView(transactions = [], filter = {}){
    //restart filter on transaction changes but keep checks
    //where they are if user is just modifying the filter
    let ndcFilter    = {}
    let expFilter    = {}
    let repackFilter = {}
    let formFilter   = {}

    transactions = transactions.filter(transaction => {

      //TODO we could reduce code by making this a loop of keys.  Lot's of redundancy here
      let qty    = transaction.qty.to || transaction.qty.from
      let exp    = transaction.exp.to || transaction.exp.from
      let ndc    = transaction.drug._id
      let form   = transaction.drug.form
      let repack = inventory.prototype.isRepacked(transaction) ? 'Repacked' : 'Inventory'

      if ( ! expFilter[exp])
        expFilter[exp] = {isChecked:filter.exp && filter.exp[exp] ? filter.exp[exp].isChecked : true, count:0, qty:0}

      if ( ! ndcFilter[ndc])
        ndcFilter[ndc] = {isChecked:filter.ndc && filter.ndc[ndc] ? filter.ndc[ndc].isChecked : true, count:0, qty:0}

      if ( ! formFilter[form])
        formFilter[form] = {isChecked:filter.form && filter.form[form] ? filter.form[form].isChecked : true, count:0, qty:0}

      if ( ! repackFilter[repack])
        repackFilter[repack] = {isChecked:filter.form && filter.repack[repack] ? filter.repack[repack].isChecked : true, count:0, qty:0}

      if ( ! expFilter[exp].isChecked) {
        if (ndcFilter[ndc].isChecked && formFilter[form].isChecked && repackFilter[repack].isChecked) {
          expFilter[exp].count++
          expFilter[exp].qty += qty
        }

        return transaction.isChecked = false
      }
      if ( ! ndcFilter[ndc].isChecked) {
        if (expFilter[exp].isChecked && formFilter[form].isChecked && repackFilter[repack].isChecked) {
          ndcFilter[ndc].count++
          ndcFilter[ndc].qty += qty
        }

        return transaction.isChecked = false
      }

      if ( ! formFilter[form].isChecked) {
        if (expFilter[exp].isChecked && ndcFilter[ndc].isChecked && repackFilter[repack].isChecked) {
          formFilter[form].count++
          formFilter[form].qty += qty
        }
        return transaction.isChecked = false
      }

      if ( ! repackFilter[repack].isChecked) {
        if (expFilter[exp].isChecked && ndcFilter[ndc].isChecked && formFilter[form].isChecked) {
          repackFilter[repack].count++
          repackFilter[repack].qty += qty
        }

        return transaction.isChecked = false
      }

      expFilter[exp].count++
      expFilter[exp].qty += qty

      ndcFilter[ndc].count++
      ndcFilter[ndc].qty += qty

      formFilter[form].count++
      formFilter[form].qty += qty

      repackFilter[repack].count++
      repackFilter[repack].qty += qty

      return true
    })

    filter.exp    = expFilter
    filter.ndc    = ndcFilter
    filter.form   = formFilter
    filter.repack = repackFilter

    return transactions
  }
}
