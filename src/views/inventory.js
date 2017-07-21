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
    this.pending = {}

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

      this.db.account.get(this.account).then(account => this.ordered = account.ordered)
      this.db.transaction.query('inventory.pendingAt', {include_docs:true, startkey:[this.account], endkey:[this.account, {}]})
      .then(res => {
        for (let row of res.rows)
          this.setPending(row.doc)

        this.refreshPending() //not needed on development without this on production, blank drawer on inital load
      })
      .then(_ => {
        let keys = Object.keys(params)
        if (keys[0])
          this.selectTerm(keys[0], params[keys[0]])
      })
    })
  }

  scrollTerms($event) {
    this.scrollSelect($event, this.term, this.terms, term => this.selectTerm('drug.generic', term))

    if ($event.which == 13)//Enter get rid of the results
      this.focusInput(`#exp_0`)
  }

  sortTransactions(transactions) {
    return transactions.sort((a, b) => {

      let aPack = this.isRepacked(a)
      let bPack = this.isRepacked(b)

      //For repacked, sort repacked first (descending)
      if (aPack > bPack) return -1
      if (aPack < bPack) return 1

      let aBin  = a.bin ? a.bin[0]+a.bin[2]+a.bin[1]+(a.bin[3] || '') : ''
      let bBin  = b.bin ? b.bin[0]+b.bin[2]+b.bin[1]+(b.bin[3] || '') : ''

      //For bin sory acsending alphabetically
      //Swap second (row) and third (column) digits.  Because it's easier to
      //to shop by column first because it doesn't require the shopper to move
      if (aBin > bBin) return 1
      if (aBin < bBin) return -1

      let aExp  = a.exp.to || a.exp.from || ''
      let bExp  = b.exp.to || b.exp.from || ''

      if (aExp < bExp) return 1
      if (aExp > bExp) return -1

      let aQty  = a.qty.to || a.qty.from || ''
      let bQty  = b.qty.to || b.qty.from || ''

      if (aQty > bQty) return 1
      if (aQty < bQty) return -1

      return 0
    })
  }

  toggleCheck(transaction) {
    console.log('toggleCheck transaction._id',  transaction._id)
    this.setCheck(transaction, ! transaction.isChecked)
  }

  //Check all visible (non-filtered) transactions
  toggleVisibleChecks() {
    this.setVisibleChecks( ! this.filter.checked.visible)
  }

  setVisibleChecks(visible) {
    if ( ! this.filter) return

    let filtered = inventoryFilterValueConverter.prototype.toView(this.transactions, this.filter)
    for (let transaction of filtered)
      this.setCheck(transaction, visible)

    this.filter.checked.visible = visible
  }

  //Cannot rely on 'this' other than this.filter
  //because used by inventoryFilterValueConverter
  setCheck(transaction, isChecked) {

    const qty = transaction.qty.to || transaction.qty.from || 0

    if (isChecked && ! transaction.isChecked) {
      this.filter.checked.qty += qty
      this.filter.checked.count++
    }

    if ( ! isChecked && transaction.isChecked) {
      this.filter.checked.qty -= qty
      this.filter.checked.count--
      this.filter.checked.visible = false
    }

    return transaction.isChecked = isChecked
  }

  isRepacked(transaction) {
    return transaction.bin && transaction.bin.length == 3
  }

  setTransactions(transactions = []) {
    if (transactions.length == this.limit)
      this.snackbar.show(`Displaying first 100 results`)

    this.transactions = this.sortTransactions(transactions)
    this.refreshFilter() //inventerFilterValueConverter sets the filter object, we need to make sure this triggers aurelia
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

  selectPending(pendingKey) {

    const [generic, pendingAt] = pendingKey.split(': ')

    let transactions = this.pending[generic] ? this.pending[generic][pendingAt] : []

    if (transactions)
      this.term = 'Pending '+generic+': '+pendingAt.slice(5, 19)

    console.log('select pending', this.term)
    this.setTransactions(transactions)
    this.toggleDrawer()
  }

  selectInventory(type, key) {
    this.term = key

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

  selectTerm(type, key) {

    type == 'pending'
      ? this.selectPending(key)
      : this.selectInventory(type, key)

    this.router.navigate(`inventory?${type}=${key}`, {trigger:false})
    console.log('select term: filter reset')
    this.filter = {checked:this.filter && this.filter.checked}
    this.setVisibleChecks(false)
  }

  refreshFilter(obj) {
    if (obj) obj.val.isChecked = ! obj.val.isChecked
    this.filter = Object.assign({}, this.filter)
  }

  refreshPending() {
    //Aurelia doesn't provide an Object setter to detect arbitrary keys so we need
    //to trigger and update using Object.assign rather than just adding a property
    this.pending = Object.assign({}, this.pending)
  }

  updateSelected(updateFn) {
    const length = this.transactions.length
    let all = []
    //since we may be deleting as we go, loop backward
    for (let i = length - 1; i >= 0; i--)  {
      let transaction = this.transactions[i]

      if ( ! transaction.isChecked) continue

      //Remove from transactions displayed. This currently works because all actions
      //pend, unpend, dispense, and repack remove transaction from the current list
      //if we add another action where this is not true, we will need to pass an additional parameter.
      this.transactions.splice(i, 1)

      updateFn(transaction)

      //Save the transaction
      all.unshift(this.db.transaction.put(transaction)
      .catch(err => {
        transaction.next.pop()
        this.transactions.splice(i, 0, transaction)
        this.snackbar.error('Error removing inventory', err)
      }))
    }

    this.filter.checked.visible = false

    return Promise.all(all)
  }

  unpendInventory() {
    const term = this.transactions[0].drug.generic
    this.updateSelected(transaction => {
      this.unsetPending(transaction) //this must happen first so we have next info
      transaction.isChecked = false
      transaction.next = []
    })
    //We must let these transactions save witout next for them to appear back in inventory
    .then(_ => this.selectTerm('drug.generic', term))

    this.refreshPending()
  }

  pendInventory(createdAt = new Date().toJSON()) {
    const term = this.transactions[0].drug.generic+': '+createdAt
    this.updateSelected(transaction => {
      if (transaction.next[0]) //this is for moving all of one pending to another (we must delete the original)
        this.unsetPending(transaction)

      transaction.isChecked = false
      transaction.next = [{pending:{}, createdAt}]
      this.setPending(transaction) //this must happen last so we have next info
    })
    //Since transactions pushed to pendying syncronously we get need to wait for the save to complete
    this.selectTerm('pending', term)

    this.refreshPending()
  }

  //Group pending into this structure {drug:{pendedAt1:[...drugs], pendedAt2:[...drugs]}}
  //this will allow easy functionality of the "Pend to" feature in case someone forgot to
  //pend a drug with the original group.
  setPending(transaction) {
    const generic  = transaction.drug.generic
    const pendedAt = transaction.next[0].createdAt

    this.pending[generic] = this.pending[generic] || {}
    this.pending[generic][pendedAt] = this.pending[generic][pendedAt] || []
    this.pending[generic][pendedAt].push(transaction)
  }

  unsetPending(transaction) {
    const pendedAt = transaction.next[0].createdAt
    const generic = transaction.drug.generic

    if ( ! this.pending[generic][pendedAt].length)
      delete this.pending[generic][pendedAt]

    if ( ! Object.keys(this.pending[generic]).length)
      delete this.pending[generic]
  }

  dispenseInventory() {
    const next = [{dispensed:{}, createdAt:new Date().toJSON()}]
    this.updateSelected(transaction => transaction.next = next)
  }

  disposeInventory() {
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
        verifiedAt:createdAt,
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

    //Keep record of any excess that is implicitly destroyed.  Excess must be >= 0 for recordkeeping
    //and negative excess (repack has more quantity than bins) is disallowed by html5 validation
    //because we don't know where the extra pills came from.
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
    if ($event.target.tagName != 'I' || ! this.transactions.length)
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
}

//ADDED step of converting object to array
export class inventoryFilterValueConverter {
  toView(transactions = [], filter = {}){
    //restart filter on transaction changes but keep checks
    //where they are if user is just modifying the filter
    let ndcFilter     = {}
    let expFilter     = {}
    let repackFilter  = {}
    let formFilter    = {}
    let checkVisible  = true

    filter.checked = filter.checked || {}
    filter.checked.qty = filter.checked.qty || 0
    filter.checked.count = filter.checked.count || 0

    transactions = transactions.filter((transaction, i) => {

      //TODO we could reduce code by making this a loop of keys.  Lot's of redundancy here
      let qty    = transaction.qty.to || transaction.qty.from
      let exp    = transaction.exp.to || transaction.exp.from
      let ndc    = transaction.drug._id
      let form   = transaction.drug.form
      let repack = inventory.prototype.isRepacked(transaction) ? 'Repacked' : 'Inventory'
      let pending = transaction.next[0] && transaction.next[0].pending

      if ( ! expFilter[exp]) {
        console.log('pending', pending, 'filter.exp', filter.exp, 'filter.exp[exp]', filter.exp && filter.exp[exp], 'filter.exp[exp].isChecked', filter.exp && filter.exp[exp] && filter.exp[exp].isChecked)
        expFilter[exp] = {isChecked:filter.exp && filter.exp[exp] ? filter.exp[exp].isChecked : pending || false, count:0, qty:0}
      }

      if ( ! ndcFilter[ndc])
        ndcFilter[ndc] = {isChecked:filter.ndc && filter.ndc[ndc] ? filter.ndc[ndc].isChecked : pending || ! i, count:0, qty:0}

      if ( ! formFilter[form])
        formFilter[form] = {isChecked:filter.form && filter.form[form] ? filter.form[form].isChecked : pending || ! i, count:0, qty:0}

      if ( ! repackFilter[repack])
        repackFilter[repack] = {isChecked:filter.repack && filter.repack[repack] ? filter.repack[repack].isChecked : true, count:0, qty:0}

      if ( ! expFilter[exp].isChecked) {
        if (ndcFilter[ndc].isChecked && formFilter[form].isChecked && repackFilter[repack].isChecked) {
          expFilter[exp].count++
          expFilter[exp].qty += qty
        }

        return inventory.prototype.setCheck.call({filter}, transaction, false)
      }
      if ( ! ndcFilter[ndc].isChecked) {
        if (expFilter[exp].isChecked && formFilter[form].isChecked && repackFilter[repack].isChecked) {
          ndcFilter[ndc].count++
          ndcFilter[ndc].qty += qty
        }

        return inventory.prototype.setCheck.call({filter}, transaction, false)
      }

      if ( ! formFilter[form].isChecked) {
        if (expFilter[exp].isChecked && ndcFilter[ndc].isChecked && repackFilter[repack].isChecked) {
          formFilter[form].count++
          formFilter[form].qty += qty
        }
        return inventory.prototype.setCheck.call({filter}, transaction, false)
      }

      if ( ! repackFilter[repack].isChecked) {
        if (expFilter[exp].isChecked && ndcFilter[ndc].isChecked && formFilter[form].isChecked) {
          repackFilter[repack].count++
          repackFilter[repack].qty += qty
        }

        return inventory.prototype.setCheck.call({filter}, transaction, false)
      }

      if ( ! transaction.isChecked)
        checkVisible = false

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

    filter.exp     = expFilter
    filter.ndc     = ndcFilter
    filter.form    = formFilter
    filter.repack  = repackFilter
    filter.checked.visible = transactions.length ? checkVisible : false //unchecked if not transactions

    return transactions
  }
}
