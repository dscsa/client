import {inject} from 'aurelia-framework';
import {Pouch}     from '../libs/pouch'
import {Router} from 'aurelia-router';
import {csv}    from '../libs/csv'
import {canActivate, expShortcuts, qtyShortcuts, removeTransactionIfQty0, incrementBin, saveTransaction, focusInput, scrollSelect, drugSearch, waitForDrugsToIndex, toggleDrawer, getHistory} from '../resources/helpers'

@inject(Pouch, Router)
export class inventory {

  constructor(db, router){
    this.db      = db
    this.router  = router
    this.csv     = csv
    this.repacks = []
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
    this.getHistory      = getHistory
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

      //Since pending are set into an object rather than array we don't have control to append to
      //beginning or end (object keys are iterated in the order they are added), this will always
      //push new pended keys to the last keys in the object.  But we want new keys to be listed first
      //in the pending drawer so we use unshift to reverse the order inside the pendingFilter which means
      //we do NOT want to reverse the order here (they would be reversed twice which would negate it)
      this.db.transaction.query('inventory.pending', {include_docs:true, startkey:[this.account], endkey:[this.account, {}]})
      .then(res => {
        this.setPending(res.rows.map(row => row.doc))
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

  toggleCheck(transaction) {
    console.log('toggleCheck transaction',  transaction)
    this.setCheck(transaction, ! transaction.isChecked)
  }

  //Check all visible (non-filtered) transactions
  toggleVisibleChecks() {
    this.setVisibleChecks( ! this.filter.checked.visible)
  }

  setVisibleChecks(isChecked) {
    if ( ! this.filter) return

    let filtered = inventoryFilterValueConverter.prototype.toView(this.transactions, this.filter)

    for (let transaction of filtered)
      this.setCheck(transaction, isChecked)

    this.filter.checked.visible = isChecked
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

  setTransactions(transactions = [], type, limit) {
    if (transactions.length == limit) {
      this.type = type
      this.snackbar.show(`Displaying first 100 results`)
    } else
      this.type = null

    this.transactions = transactions
    this.noResults    = this.term && ! transactions.length
    this.filter = {} //after new transactions set, we need to set filter so checkboxes don't carry over
    console.log(transactions.length, transactions)
  }

  search() {
    if (this.isBin(this.term))
      return this.selectTerm('bin', this.term)

    if (this.isExp(this.term))
      return this.selectTerm('exp', this.term, true)

    //Drug search is by NDC and we want to group by generic
    this.drugSearch().then(drugs => {
      this.terms = drugs.map(drug => drug.generic).filter((generic, index, generics) => generics.indexOf(generic) == index);
    })
  }

  isBin(term) {
    return /[A-Za-z][0-9]{2,3}/.test(term)
  }

  isExp(term) {
    return /20\d\d-\d\d-?\d?\d?/.test(term)
  }

  selectPending(pendingKey) {

    const [pendId, label] = pendingKey.split(': ')
    const generic         = label.split(' - ')[0]

    let transactions = this.pending[pendId] ? this.pending[pendId][generic].transactions : []

    if (transactions)
      this.term = 'Pending '+pendingKey

    this.setTransactions(transactions)
    this.toggleDrawer()
  }

  selectInventory(type, key, limit) {
    this.term = key

    let opts = {include_docs:true, limit, reduce:false}

    if (type == 'bin') {
      opts.startkey = [this.account, key.slice(0,3), key.slice(3)]
      opts.endkey   = [this.account, key.slice(0,3), key.slice(3)+'\uffff']
    } else if (type == 'exp') {
      opts.startkey = [this.account, key]
      opts.endkey   = [this.account, key+'\uffff']
    } else {
      //Only show medicine at least one month from expiration
      //just in case there is a lot of it and limit prevent us from seeing more
      var minExp = new Date()
      minExp.setMonth(minExp.getMonth() + 1)
      opts.startkey = [this.account, key, minExp.toJSON()]
      opts.endkey   = [this.account, key, '\uffff']
    }

    const setTransactions = res => this.setTransactions(res.rows.map(row => row.doc), type, limit)
    this.db.transaction.query('inventory.'+type, opts).then(setTransactions)
  }

  selectTerm(type, key) {

    console.log('selectTerm', type, key)

    this.setVisibleChecks(false) //reset selected qty back to 0

    type == 'pending'
      ? this.selectPending(key)
      : this.selectInventory(type, key, 100)

    this.router.navigate(`inventory?${type}=${key}`, {trigger:false})
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
      this.setCheck(transaction, false)
      this.transactions.splice(i, 1)

      //If pending we want to move it.  Dispense/disposed/unpend all remove from pending
      this.unsetPending(transaction)

      updateFn(transaction)

      //Save the transaction
      all.unshift(this.db.transaction.put(transaction)
      .catch(err => {
        transaction.next.pop()
        this.transactions.splice(i, 0, transaction)
        this.snackbar.error('Error removing inventory', err)
      }))
    }

    this.refreshPending() //unsetPending and updateFn may (un)pend some items

    this.filter.checked.visible = false

    return Promise.all(all)
  }

  unpendInventory() {
    const term = this.repacks.drug.generic
    this.updateSelected(transaction => {
      transaction.isChecked = false
      transaction.next = []
    })
    //We must let these transactions save without next for them to appear back in inventory
   .then(_ => this.selectTerm('drug.generic', term))
  }

  //Three OPTIONS
  //1) They pick an existing pendId and _id is passed as parameter
  //2) They type in their own pendId and pendToId is passed as parameter
  //3) They do Pend New without a pendId in which case the createdAt date will be used later
  pendInventory(_id, pendQty) {

    let toPend = []
    let next   = [{pending:{_id}, createdAt:new Date().toJSON()}]
    let pendId = this.getPendId({next})

    if (pendQty)
      next[0].pending._id = pendId+' - '+pendQty

    this.updateSelected(transaction => {
      transaction.isChecked = false
      transaction.next = next
      toPend.push(transaction)
    })

    //Since transactions pushed to pendying syncronously we get need to wait for the save to complete
    //Generic search is sorted primarily by EXP and not BIN.  This is correct on refresh but since we
    //want pending queue to be ordered by BIN instantly we need to mimic the server sort on the client
    this.setPending(toPend)

    let label = this.pending[pendId][this.repacks.drug.generic].label //must wait until after setPending

    this.selectTerm('pending', pendId+': '+label)
  }

  sortPending(a, b) {

    var aPack = this.isRepacked(a)
    var bPack = this.isRepacked(b)

    if (aPack > bPack) return -1
    if (aPack < bPack) return 1

    //Flip columns and rows for sorting, since shopping is easier if you never move backwards
    let aBin = a.bin[0]+a.bin[2]+a.bin[1]+(a.bin[3] || '')
    let bBin = b.bin[0]+b.bin[2]+b.bin[1]+(b.bin[3] || '')

    if (aBin > bBin) return 1
    if (aBin < bBin) return -1

    return 0
  }

  //Group pending into this structure {drug:{pendedAt1:[...drugs], pendedAt2:[...drugs]}}
  //this will allow easy functionality of the "Pend to" feature in case someone forgot to
  //pend a drug with the original group.
  setPending(transactions) {

    for (let transaction of transactions) {

      //We want to group by PendId and not PendQty so detach pendQty from pendId and prepend it to generic instead
      let pendId  = this.getPendId(transaction)
      let pendQty = this.getPendQty(transaction)
      let generic = transaction.drug.generic
      let label   = generic + (pendQty ? ' - '+pendQty : '')

      this.pending[pendId] = this.pending[pendId] || {}
      this.pending[pendId][generic] = this.pending[pendId][generic] || {label, transactions:[]}
      this.pending[pendId][generic].transactions.push(transaction)
      this.pending[pendId][generic].transactions.sort(this.sortPending.bind(this)) //seems wasteful but this seems like overkill https://stackoverflow.com/questions/1344500/efficient-way-to-insert-a-number-into-a-sorted-array-of-numbers
    }
  }

  unsetPending(transaction) {

    if ( ! transaction.next[0] || ! transaction.next[0].pending)
      return //called indiscriminately from updateSelected

    const generic = transaction.drug.generic
    const pendId  = this.getPendId(transaction)

    if ( ! this.pending[pendId][generic].transactions.length)
      delete this.pending[pendId][generic]

    if ( ! Object.keys(this.pending[pendId]).length)
      delete this.pending[pendId]

    //Don't need to splice the pendingAt array because updateSelected does that automatically
    this.refreshPending() //updateFn may pend some items
  }

  dispenseInventory() {
    const next = [{dispensed:{}, createdAt:new Date().toJSON()}]
    this.updateSelected(transaction => transaction.next = next)
  }

  disposeInventory() {
    this.updateSelected(transaction => {
      transaction.next = []
      transaction.verifiedAt = null
      transaction.bin = null
    })
  }

  //TODO this allows for mixing different NDCs with a common generic name, should we prevent this or warn the user?
  repackInventory() {

    let newTransactions = [],
        next = [],
        createdAt = new Date().toJSON()


    //Keep record of any excess that is implicitly destroyed.  Excess must be >= 0 for recordkeeping
    //and negative excess (repack has more quantity than bins) is disallowed by html5 validation
    //because we don't know where the extra pills came from.  If 0 still keep record in case we need to
    //adjust it after the fact (on sever with reconcileRepackQty)
    newTransactions.push({
      exp:{to:this.repacks[0].exp, from:null},
      qty:{to:this.repacks.excessQty, from:null},
      user:{_id:this.user},
      shipment:{_id:this.account},
      drug:this.repacks.drug,
      next:[] //Keep it pending if we are on pending screen
    })

    //Create the new (repacked) transactions
    for (let repack of this.repacks) {

      if ( ! repack.bin || ! repack.exp || ! repack.qty) //ignore last row
        continue

      let newTransaction = {
        verifiedAt:createdAt,
        exp:{to:repack.exp, from:null},
        qty:{to:+repack.qty, from:null},
        user:{_id:this.user},
        shipment:{_id:this.account},
        bin:repack.bin,
        drug:this.repacks.drug,
        next:next
      }

      //Only add to display if we are not in pending screen
      //if pended we don't want it to appear
      if (this.term.slice(0,7) != 'Pending')
        this.transactions.unshift(newTransaction)

      newTransactions.push(newTransaction)
    }

    //Once we have the new _ids insert them into the next property of the checked transactions
    this.db.transaction.bulkDocs(newTransactions).then(rows => {

      console.log('Repacked vials have been created', rows)

      const next = rows.map(row => {
        return {transaction:{_id:row.id}, createdAt}
      })

      this.updateSelected(transaction => transaction.next = next)

      this.printLabels(newTransactions.slice(1)) //don't include the "excess" one

    }).catch(err => {
      console.error(err)
      this.snackbar.show(`Transactions could not repackaged: ${err.reason}`)
    })
  }

  getPendId(transaction) {

    //getPendId from a transaction
    if (transaction) {
      const pendId  = transaction.next[0].pending._id
      const created = transaction.next[0].createdAt
      return pendId ? pendId.split(' - ')[0] : created.slice(5, 16).replace('T', ' ')  //Google App Script is using Pend Id as "Order# - Qty" and we want to group only by Order#.
    }

    //Get the currectly selected pendId
    //Hacky. Maybe we should set these individually rather than splitting them.
    return this.term.replace('Pending ', '').split(': ')[0]
  }

  getPendQty(transaction) {

    //getPendId from a transaction
    if (transaction) {
      const pendId  = transaction.next[0].pending._id
      return pendId ? pendId.split(' - ')[1] : undefined
    }

    return this.term.split(' - ')[1]
  }


  printLabels(transactions) {

    transactions = transactions || this.transactions.filter(t => t.isChecked)
    let pendId   = this.getPendId()

    let labels = transactions.map(transaction => {
      return [
        `<p style="page-break-after:always;">`,
        `<strong>${transaction.drug.generic}</strong>`,
        pendId, //needs to work for X00 bins that are technically no longer pended, default to this? -> transaction.next[0] && transaction.next[0].pending && transaction.next[0].pending._id,
        `Ndc ${transaction.drug._id}`,
        `Exp ${transaction.exp.to.slice(0, 7)}`,
        `Bin ${transaction.bin}`,
        `Qty ${transaction.qty.to}`,
        `Pharmacist ________________`,
        `</p>`
      ].join('<br>')
    })

    let win = window.open()
    if ( ! win)
      return this.snackbar.show(`Enable browser pop-ups to print vial labels`)

    win.document.write(labels.join(''))
    win.print()
    win.close()
  }

  //Upon repacking, excess forced to be >= 0 and is recorded as a new transaction that was "disposed"
  //However we want to allow users to adjust repack quantities after being made.  To do this we need to
  //adjust the excess quantity up or down accordingly.
  saveAndReconcileTransaction(transaction) {
    console.log('saveAndReconcileTransaction')
    //Get current qty so we can see if the qty changed
    this.db.transaction.get(transaction._id).then(repack => {
      const qtyChange = transaction.qty.to - repack.qty.to

      if ( ! qtyChange) {
        return this.saveTransaction(transaction)
      }

      return this.db.transaction.query('next.transaction._id', {key:[this.account, transaction._id], include_docs:true}).then(res => {

        if ( ! res.rows.length) {
          return this.saveTransaction(transaction)
        }

        let excess = res.rows.pop().doc.next.pop().transaction._id

        return this.db.transaction.get(excess).then(excess => {
            excess.qty.to -= qtyChange

            if (excess.qty.to < 0) {
              transaction.qty.to = repack.qty.to
              return this.snackbar.show(`Cannot set repack qty to be more than qty orginally repacked, ${repack.qty.to+excess.qty.to+qtyChange}`)
            }

            this.db.transaction.put(excess)
            return this.saveTransaction(transaction)
        })
      })
    })
  }

  setRepackRows(repack, $last, $index) {

    console.log('setRepackRows', repack, $index, $last, this.repacks.length)

    //Last repack is the only empty one.  Remove any others that are empty
    if ( ! $last && ! repack.qty) {
      this.repacks.splice($index, 1)
      this.menu.resize() //Recalculate menu height
    }

    //If user fills in last repack then add another for them copying over exp and bin
    if ($last && repack.qty) {
      this.repacks.push({})
      this.menu.resize() //Recalculate menu height

      //If qty is set on last row, then fill in exp and bin automatically using the previous rows info
      if ( ! repack.exp)
        repack.exp = this.repacks[$index-1].exp

      if ( ! repack.bin)
        repack.bin = this.repacks[$index-1].bin
    }

    //Recalculate total
    this.setExcessQty()
  }

  setRepackQty() {
    let qtyInPendId  = this.getPendQty() || 30*Math.floor(this.filter.checked.qty/30) //default to rounding nearest 30
    let qtyRemainder = this.filter.checked.qty - qtyInPendId
    qtyInPendId  && this.repacks.push({exp:this.repacks.exp, qty:qtyInPendId})
    qtyRemainder && this.repacks.push({exp:this.repacks.exp, qty:qtyRemainder})
  }

  setExcessQty() {
    let repackQty = this.repacks.reduce((totalQty, repack) => Math.max(0, repack.qty) + totalQty, 0)
    this.repacks.excessQty = this.filter.checked.qty - repackQty
  }

  openMenu($event) {
    console.log('openMenu called', $event.target.tagName, this.transactions.length, $event.target.tagName != 'I', ! this.transactions.length, this.repacks)
    if ($event.target.tagName != 'I' && $event.target.tagName != 'BUTTON')
      return true //only calculate for the parent element, <i vertical menu icon>, and not children //true needed so public inventory link works

    if ( ! this.transactions.length) {
      console.log('openMenu transactions.length == 0', this.repacks)
      return true
    }

    const term = this.term.replace('Pending ', '')

    this.pendToId  = ''
    this.pendToQty = ''
    this.repacks   = this.setRepacks()
    this.matches   = this.setMatchingPends(this.repacks.drug)

    if (this.repacks.drug) {
      this.setRepackQty()
      this.setExcessQty()
    }

    console.log('openMenu', this.ordered[this.term], this.repacks)
  }

  setMatchingPends(drug) {

    let matches = []
    let pendId  = this.getPendId()

    if (drug)
      for (let pendToId in this.pending)
        if (pendId != pendToId && drug.generic in this.pending[pendToId])
          matches.push(this.pending[pendToId][drug.generic].label)

    return matches
  }

  setRepacks() {
    let repacks = []
    repacks.exp  = '' //hacky but effective to set properties to array here
    repacks.drug = null
    //Filter Selected and then two reduces, one for drug, one for exp.
    //1) If all same drug then repacks.drug is the generic name, otherwise dscsa_default_post_value
    //2) Repacks.exp is the minimum expiration date of the transactions selected
    for (let transaction of this.transactions) {

      if ( ! transaction.isChecked) continue

      if (repacks.drug == null) {
        repacks.drug = transaction.drug
        console.log('this.repacks.drug is null', repacks.drug)
      } else if (repacks.drug._id != transaction.drug._id) {//Can only repack drugs with same NDC.  TODO Show Error?
        repacks.drug = false
        console.log('this.repacks.drug mismatch', repacks.drug, transaction.drug)
      }

      repacks.exp = repacks.exp && repacks.exp < transaction.exp.to
        ? repacks.exp
        : transaction.exp.to
    }

    return repacks
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
      this.focusInput(`#exp_${$index+1}`)
    else
      this.incrementBin($event, this.transactions[$index])

    return true
  }

  showHistoryDialog(id) {
    console.log('getHistory', id)
    this.history = 'Loading...'
    this.dialog.showModal()
    this.getHistory(id).then(history => {
      console.log(history)
      this.history = history
    })
  }

  closeHistoryDialog() {
    this.dialog.close()
  }
}

//ADDED step of converting object to array
export class inventoryFilterValueConverter {
  toView(transactions = [], filter = {}, term = ''){
    //restart filter on transaction changes but keep checks
    //where they are if user is just modifying the filter
    let ndcFilter     = {}
    let expFilter     = {}
    let repackFilter  = {}
    let formFilter    = {}
    let checkVisible  = true
    let defaultCheck  = inventory.prototype.isExp(term) || inventory.prototype.isBin(term)

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
        //console.log('pending', !!pending, 'exp', exp, 'filter.exp', filter.exp, 'filter.exp[exp]', filter.exp && filter.exp[exp], 'filter.exp[exp].isChecked', filter.exp && filter.exp[exp] && filter.exp[exp].isChecked)
        expFilter[exp] = {isChecked:filter.exp && filter.exp[exp] ? filter.exp[exp].isChecked : defaultCheck || pending || false, count:0, qty:0}
      }

      if ( ! ndcFilter[ndc])
        ndcFilter[ndc] = {isChecked:filter.ndc && filter.ndc[ndc] ? filter.ndc[ndc].isChecked : defaultCheck || pending || ! i, count:0, qty:0}

      if ( ! formFilter[form])
        formFilter[form] = {isChecked:filter.form && filter.form[form] ? filter.form[form].isChecked : defaultCheck || pending || ! i, count:0, qty:0}

      if ( ! repackFilter[repack])
        repackFilter[repack] = {isChecked:filter.repack && filter.repack[repack] ? filter.repack[repack].isChecked : defaultCheck || pending || ! repackFilter['Repacked'], count:0, qty:0}

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

//Allow user to search by pendId OR generic name
export class pendingFilterValueConverter {
  toView(pending = {}, term = ''){
    term = term.toLowerCase()
    let matches = [] //an array of arrays
    for (let pendId in pending) {
      if ( ~ pendId.toLowerCase().indexOf(term)) {
        matches.unshift({key:pendId, val:pending[pendId]})
        continue
      }

      let genericMatches = {}

      for (let generic in pending[pendId])
        if ( ~ generic.toLowerCase().indexOf(term))
          genericMatches[generic] = pending[pendId][generic]

      if (Object.keys(genericMatches).length)
        matches.unshift({key:pendId, val:genericMatches})
    }

    return matches
  }
}
