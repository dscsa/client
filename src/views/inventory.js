import {inject} from 'aurelia-framework';
import {Pouch}     from '../libs/pouch'
import {Router} from 'aurelia-router';
import {csv}    from '../libs/csv'
import {canActivate, expShortcuts, qtyShortcuts, removeTransactionIfQty0, incrementBin, saveTransaction, focusInput, drugSearch, groupDrugs, drugName, waitForDrugsToIndex, toggleDrawer, getHistory} from '../resources/helpers'

@inject(Pouch, Router)
export class inventory {

  constructor(db, router){
    this.db      = db
    this.router  = router
    this.csv     = csv
    this.repacks = []
    this.transactions = []
    this.pended = {}

    this.placeholder     = "Search by generic name, ndc, exp, or bin" //Put in while database syncs
    this.waitForDrugsToIndex = waitForDrugsToIndex
    this.expShortcuts    = expShortcuts
    this.qtyShortcutsKeydown    = qtyShortcuts
    this.removeTransactionIfQty0 = removeTransactionIfQty0
    this.saveTransaction = saveTransaction
    this.incrementBin    = incrementBin
    this.focusInput      = focusInput
    this.drugSearch      = drugSearch
    this.drugName        = drugName
    this.groupDrugs      = groupDrugs
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
      this.account = { _id:session.account._id} //temporary will get overwritten with full account

      this.db.account.get(session.account._id).then(account => this.account = account)

      //Since pended are set into an object rather than array we don't have control to append to
      //beginning or end (object keys are iterated in the order they are added), this will always
      //push new pended keys to the last keys in the object.  But we want new keys to be listed first
      //in the pended drawer so we use unshift to reverse the order inside the pendedFilter which means
      //we do NOT want to reverse the order here (they would be reversed twice which would negate it)
      this.db.transaction.query('pended-by-name-bin', {include_docs:true, startkey:[this.account._id], endkey:[this.account._id, {}]})
      .then(res => {
        this.setPended(res.rows.map(row => row.doc))
        this.refreshPended() //not needed on development without this on production, blank drawer on inital load
      })
      .then(_ => {
        let keys = Object.keys(params)
        if (keys[0])
          this.selectTerm(keys[0], params[keys[0]])
      })
    })
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

  setTransactions(transactions = [], type, limit) {
    if (transactions.length == limit) {
      this.type = type
      this.snackbar.show(`Displaying first 100 results`)
    } else
      this.type = null

    this.transactions = transactions
    this.noResults    = this.term && ! transactions.length
    this.filter = {} //after new transactions set, we need to set filter so checkboxes don't carry over
  }

  search() {

    console.log('search', this.term)

    if (this.isBin(this.term))
      return this.selectTerm('bin', this.term)

    if (this.isExp(this.term))
      return this.selectTerm('exp<', this.term, true)

    //Drug search is by NDC and we want to group by generic
    this.drugSearch().then(drugs => {
      console.log(drugs.length, this.account.ordered, this.account)
        this.groups = this.groupDrugs(drugs, this.account.ordered)
        console.log(drugs.length, this.groups.length, this.groups)
    })
  }

  isRepack(transaction) {
    return transaction.bin && transaction.bin.length == 3
  }

  isBin(term) {
    return /^[A-Za-z][0-6]?\d{2}$/.test(term)
  }

  isExp(term) {
    return /^20\d\d-\d\d-?\d?\d?$/.test(term)
  }

  selectPended(pendedKey) {

    const [pendId, label] = pendedKey.split(': ')

    let transactions = Object.values(this.pended[pendId]).reduce((arr, pend) => {
         return ! label || pend.label == label ? arr.concat(pend.transactions) : arr
    }, [])

    if (transactions)
      this.term = 'Pended '+pendedKey

    transactions.sort(this.sortPended.bind(this))

    this.setTransactions(transactions)
    this.toggleDrawer()
  }

  selectInventory(type, key, limit) {
    this.term = key

    let opts = {include_docs:true, limit, reduce:false}

    if (type == 'bin') {
      var query  = 'inventory-by-bin-verifiedat'
      var bin    = key.split('') //don't do concat because bins can be of length 3 or 4
      opts.startkey = [this.account._id, bin[0], bin[1], bin[2], bin[3]]
      opts.endkey   = [this.account._id, bin[0], bin[1], bin[2], bin[3] ? bin[3]+'\uffff' : {}]
    } else if (type == 'exp<') {
      var query = 'expired.qty-by-bin'
      var [year, month] = key.split('-')
      opts.startkey = [this.account._id, year, month]
      opts.endkey   = [this.account._id, year, month+'\uffff']
    } else if (type == 'generic') {
      //Only show medicine at least one month from expiration
      //just in case there is a lot of it and limit prevent us from seeing more
      var query = 'inventory.qty-by-generic'
      var [year, month] = this.currentDate(1, true)
      opts.startkey = [this.account._id, 'month', year, month, key]
      opts.endkey   = [this.account._id, 'month', year, month, key, {}] //Use of {} rather than \uffff so we don't combine different drug.forms
    }

    const setTransactions = res => this.setTransactions(res.rows.map(row => row.doc), type, limit)
    this.db.transaction.query(query, opts).then(setTransactions)
  }

  selectTerm(type, key) {

    console.log('selectTerm', type, key)

    this.setVisibleChecks(false) //reset selected qty back to 0

    type == 'pended'
      ? this.selectPended(key)
      : this.selectInventory(type, key, 100)

    this.router.navigate(`inventory?${type}=${key}`, {trigger:false})
  }

  refreshFilter(obj) {
    if (obj) obj.val.isChecked = ! obj.val.isChecked
    this.filter = Object.assign({}, this.filter)
  }

  refreshPended() {
    //Aurelia doesn't provide an Object setter to detect arbitrary keys so we need
    //to trigger and update using Object.assign rather than just adding a property
    this.pended = Object.assign({}, this.pended)
  }

  updateSelected(updateFn) {
    const length = this.transactions.length
    let checkedTransactions = []
    //since we may be deleting as we go, loop backward
    for (let i = length - 1; i >= 0; i--)  {
      let transaction = this.transactions[i]

      if ( ! transaction.isChecked) continue

      checkedTransactions.unshift(transaction)

      //Remove from transactions displayed. This currently works because all actions
      //pend, unpend, dispense, and repack remove transaction from the current list
      //if we add another action where this is not true, we will need to pass an additional parameter.
      this.setCheck(transaction, false)
      this.transactions.splice(i, 1) //optimistic UI

      //If pended we want to move it.  Dispense/disposed/unpend all remove from pended
      this.unsetPended(transaction)

      updateFn(transaction)
    }

    this.refreshPended() //unsetPended and updateFn may (un)pend some items

    this.filter.checked.visible = false

    //Save the transactions.  TODO should we preverse order by saving i from loop above?
    return this.db.transaction.bulkDocs(checkedTransactions)
    .catch(err => this.snackbar.error('Error removing inventory. Please reload and try again', err))
  }

  unpendInventory() {
    const term = this.repacks.drug.generic
    this.updateSelected(transaction => {
      transaction.isChecked = false
      transaction.next = []
    })
    //We must let these transactions save without next for them to appear back in inventory
   .then(_ => term ? this.selectTerm('generic', term) : this.term = '')
  }

  //Three OPTIONS
  //1) They pick an existing pendId and _id is passed as parameter
  //2) They type in their own pendId and pendToId is passed as parameter
  //3) They do Pend New without a pendId in which case the createdAt date will be used later
  pendInventory(_id, pendQty) {

    let toPend = []
    let next   = [{pended:{_id}, createdAt:new Date().toJSON()}]
    let pendId = this.getPendId({next})

    if (pendQty)
      next[0].pended._id = pendId+' - '+pendQty

    this.updateSelected(transaction => {
      transaction.isChecked = false
      transaction.next = next
      toPend.push(transaction)
    })

    //Since transactions pushed to pendying syncronously we get need to wait for the save to complete
    //Generic search is sorted primarily by EXP and not BIN.  This is correct on refresh but since we
    //want pended queue to be ordered by BIN instantly we need to mimic the server sort on the client
    this.setPended(toPend)

    let label = pendId

    if (this.repacks.drug.generic) //not true if we are showing multiple drugs e.g search by exp date, fulled pended order, bin
      label += ': '+this.pended[pendId][this.repacks.drug.generic].label //must wait until after setPended

    this.selectTerm('pended', label)
  }

  sortPended(a, b) {

    var aPack = this.isRepack(a)
    var bPack = this.isRepack(b)

    if (aPack > bPack) return -1
    if (aPack < bPack) return 1

    //Flip columns and rows for sorting, since shopping is easier if you never move backwards
    let aBin = a.bin[0]+a.bin[2]+a.bin[1]+(a.bin[3] || '')
    let bBin = b.bin[0]+b.bin[2]+b.bin[1]+(b.bin[3] || '')

    if (aBin > bBin) return 1
    if (aBin < bBin) return -1

    return 0
  }

  //Group pended into this structure {drug:{pendedAt1:[...drugs], pendedAt2:[...drugs]}}
  //this will allow easy functionality of the "Pend to" feature in case someone forgot to
  //pend a drug with the original group.
  setPended(transactions) {

    for (let transaction of transactions) {

      //We want to group by PendId and not PendQty so detach pendQty from pendId and prepend it to generic instead
      let pendId  = this.getPendId(transaction)
      let pendQty = this.getPendQty(transaction)
      let generic = transaction.drug.generic
      let label   = generic + (pendQty ? ' - '+pendQty : '')

      this.pended[pendId] = this.pended[pendId] || {}
      this.pended[pendId][generic] = this.pended[pendId][generic] || {label, transactions:[]}
      this.pended[pendId][generic].transactions.push(transaction)
    }
  }

  unsetPended(transaction) {

    if ( ! transaction.next[0] || ! transaction.next[0].pended)
      return //called indiscriminately from updateSelected

    const generic = transaction.drug.generic
    const pendId  = this.getPendId(transaction)

    let i = this.pended[pendId][generic].transactions.indexOf(transaction)

    this.pended[pendId][generic].transactions.splice(i, 1) //Assume transaction is found and i is not false

    //console.log(pendId, generic, i, 'of', this.pended[pendId][generic].transactions.length)

    if ( ! this.pended[pendId][generic].transactions.length)
      delete this.pended[pendId][generic]

    if ( ! Object.keys(this.pended[pendId]).length)
      delete this.pended[pendId]

    //NOTE Developer should call this.refreshPended() after all transactions are unpended
  }

  dispenseInventory() {
    const next = [{dispensed:{}, createdAt:new Date().toJSON()}]
    this.updateSelected(transaction => transaction.next = next)
  }

  disposeInventory() {
    const next = [{disposed:{}, createdAt:new Date().toJSON()}]
    this.updateSelected(transaction => transaction.next = next)
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
      shipment:{_id:this.account._id},
      drug:this.repacks.drug,
      next:[{disposed:{}, createdAt}]
    })

    //Create the new (repacked) transactions
    for (let repack of this.repacks) {

      if ( ! repack.bin || ! repack.exp || ! repack.qty) //ignore last row
        continue

      let newTransaction = {
        exp:{to:repack.exp, from:null},
        qty:{to:+repack.qty, from:null},
        user:{_id:this.user},
        shipment:{_id:this.account._id},
        bin:repack.bin,
        drug:this.repacks.drug,
        next:next
      }

      //Only add to display if we are not in pended screen
      //if pended we don't want it to appear
      if (this.term.slice(0,7) != 'Pended')
        this.transactions.unshift(newTransaction)

      newTransactions.push(newTransaction)
    }

    console.log('newTransaction',  this.repacks.length, this.repacks, newTransactions.length, newTransactions)

    //Once we have the new _ids insert them into the next property of the checked transactions
    this.db.transaction.bulkDocs(newTransactions).then(rows => {

      //Since removing from array go backwards to ensure that indexes remain in sync
      let errors = []
      for (let i = rows.length - 1; i >= 0; i--) {
        if ( ! rows[i].error) continue
        if ( ! errors.includes(rows[i].message)) errors.push(rows[i].message)
        this.transactions.splice(i, 1)
      }

      if (errors.length) {
        console.error('Repacked vials could not be created', errors, rows)
        return this.snackbar.show(`Repack error `+errors.join(', '))
      }

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
      const pendId  = transaction.next[0].pended._id
      const created = transaction.next[0].createdAt
      return pendId ? pendId.split(' - ')[0] : created.slice(5, 16).replace('T', ' ')  //Google App Script is using Pend Id as "Order# - Qty" and we want to group only by Order#.
    }

    //Get the currectly selected pendId
    //Hacky. Maybe we should set these individually rather than splitting them.
    return this.term.replace('Pended ', '').split(': ')[0]
  }

  getPendQty(transaction) {

    //getPendId from a transaction
    if (transaction) {
      const pendId  = transaction.next[0].pended._id
      return pendId ? pendId.split(' - ')[1] : undefined
    }

    return this.term.split(' - ')[1]
  }


  printLabels(transactions) {

    transactions = transactions || this.transactions.filter(t => t.isChecked)
    let pendId   = this.getPendId()

    let labels = transactions.map(transaction => {
      return [
        `<p style="page-break-after:always; white-space:nowrap">`,
        `<strong>${transaction.drug.generic}</strong>`,
        transaction._id.slice(2, -1),
        `Ndc ${transaction.drug._id}`,
        `Exp ${transaction.exp.to.slice(0, 7)}`,
        `Bin ${transaction.bin}`,
        `Qty ${transaction.qty.to}`,
        pendId, //needs to work for X00 bins that are technically no longer pended, default to this? -> transaction.next[0] && transaction.next[0].pended && transaction.next[0].pended._id,
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

      //Reload filter to get updated quantities
      this.transactions = this.transactions.slice()

      if (transaction.isChecked) //Update total selected
        this.filter.checked.qty += qtyChange

      console.log('saveAndReconcileTransaction', qtyChange, transaction.qty.to, repack.qty.to)

      return this.db.transaction.query('next.transaction._id', {key:[this.account._id, transaction._id], include_docs:true}).then(res => {

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
    let repackQty = this.repacks.reduce((totalQty, repack) => {
      //console.log('setExcessQty', totalQty, repack.qty, repack)
      return Math.max(0, repack.qty || 0) + totalQty // default to 0 for the empty repack row otherwise undefined makes everything become NaN
    }, 0)
    this.repacks.excessQty = this.filter.checked.qty - repackQty
    //console.log('this.repacks.excessQty', this.repacks.excessQty, this.filter.checked.qty, repackQty, this.repacks)
  }

  currentDate(addMonths, split) {
    var minExp = new Date()
    minExp.setMonth(minExp.getMonth() + addMonths)
    minExp = minExp.toJSON()
    return split ? minExp.split(/\-|T|:|\./) : minExp
  }

  exportCSV() {

    let [year, month, day] = this.currentDate(1, true)
    let name = `Inventory ${year}-${month}-${day}.csv`
    let opts = {
      reduce:false,
      startkey:[this.account._id, 'month', year, month],
      endkey:[this.account._id, 'month', year, month+'\uffff']
    }

    this.db.transaction.query('inventory.qty-by-generic', opts).then(transactions => {
      this.csv.fromJSON(name, transactions.rows.map(row => {
        var sortedDrug = row.key[8].split(' ')
        return {
          'drug.generic':row.key[4],
          'drug.gsns':row.key[5],
          'drug.brand':row.key[6],
          'drug._id':row.key[7],
          'exp.to':sortedDrug[1].slice(0,7),
          'qty.to':row.value,
          'bin':row.key[9],
          '_id':row.id
        }
      }))
    })
  }

  openMenu($event) {
    console.log('openMenu called', $event.target.tagName, this.transactions.length, $event.target.tagName != 'I', ! this.transactions.length, this.repacks)
    if ($event.target.tagName != 'I' && $event.target.tagName != 'BUTTON' && $event.target.tagName != 'MD-MENU')
      return true //only calculate for the parent element, <i vertical menu icon>, and not children //true needed so public inventory link works

    if ( ! this.transactions.length) {
      console.log('openMenu transactions.length == 0', this.repacks)
      return true
    }

    const term = this.term.replace('Pended ', '')

    this.pendToId  = ''
    this.pendToQty = ''
    this.repacks   = this.setRepacks()
    this.matches   = this.setMatchingPends(this.repacks.drug)

    if (this.repacks.drug) {
      this.setRepackQty()
      this.setExcessQty()
    }

    console.log('openMenu', this.account.ordered[this.term], this.repacks)
  }

  setMatchingPends(drug) {

    let matches = []
    let pendId  = this.getPendId()

    if (drug)
      for (let pendToId in this.pended) {
        let match = this.pended[pendToId][drug.generic]
        if (pendId != pendToId && match)
          matches.push({pendId:pendToId, pendQty:this.getPendQty(match.transactions[0])})
      }
    return matches
  }

  setRepacks() {
    let repacks = []
    repacks.exp    = '' //hacky but effective to set properties to array here
    repacks.drug = null
    //Filter Selected and then two reduces, one for drug, one for exp.
    //1) If all same drug then repacks.drug is the generic name, otherwise dscsa_default_post_value
    //2) Repacks.exp is the minimum expiration date of the transactions selected
    for (let transaction of this.transactions) {

      if ( ! transaction.isChecked) continue

      if (repacks.drug == null) {
        repacks.drug = JSON.parse(JSON.stringify(transaction.drug))
        repacks.drug.price = {goodrx:0, nadac:0, retail:0, updatedAt:new Date().toJSON()} //need to do a weighted average price of everything being repacked
        console.log('this.repacks.drug is null', repacks.drug)
      } else if (repacks.drug._id != transaction.drug._id) {//Can only repack drugs with same NDC.  TODO Show Error?
        repacks.drug = false
        console.error('this.repacks.drug mismatch', repacks.drug, transaction.drug)
      }

      //Need to do a weighted average of prices (not just first/last transaction price), otherwise inventory.value in reports can change just because 2+ transactions are repacked into one
      repacks.drug.price.goodrx += transaction.drug.price.goodrx * transaction.qty.to / this.filter.checked.qty
      repacks.drug.price.nadac  += transaction.drug.price.nadac  * transaction.qty.to / this.filter.checked.qty
      repacks.drug.price.retail += transaction.drug.price.retail * transaction.qty.to / this.filter.checked.qty
      console.log('setRepacks weighted price', repacks.drug.price.goodrx, transaction.drug.price.goodrx, transaction.qty.to, this.filter.checked.qty)

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
    let ndcFilter       = {}
    let expFilter       = {}
    let repackFilter    = {}
    let formFilter      = {}
    let checkVisible    = true
    let oneMonthFromNow = inventory.prototype.currentDate(1)
    let isBin           = inventory.prototype.isBin(term)
    let defaultCheck    = isBin || inventory.prototype.isExp(term)

    filter.checked = filter.checked || {}
    filter.checked.qty = filter.checked.qty || 0
    filter.checked.count = filter.checked.count || 0

    transactions = transactions.filter((transaction, i) => {

      //TODO we could reduce code by making this a loop of keys.  Lot's of redundancy here
      let qty    = transaction.qty.to || transaction.qty.from
      let exp    = transaction.exp.to || transaction.exp.from
      let ndc    = transaction.drug._id
      let form   = transaction.drug.form
      let repack = inventory.prototype.isRepack(transaction) ? 'Repacked' : 'Inventory'
      let isExp  = exp > oneMonthFromNow ? 'Unexpired' : 'Expired'
      let pended = transaction.next[0] && transaction.next[0].pended

      if ( ! expFilter[exp]) {
        //console.log('pended', !!pended, 'exp', exp, 'filter.exp', filter.exp, 'filter.exp[exp]', filter.exp && filter.exp[exp], 'filter.exp[exp].isChecked', filter.exp && filter.exp[exp] && filter.exp[exp].isChecked)
        expFilter[exp] = {isChecked:filter.exp && filter.exp[exp] ? filter.exp[exp].isChecked : defaultCheck || pended || false, count:0, qty:0}
      }

      if ( ! expFilter[isExp]) {
        expFilter[isExp] = {isChecked:filter.exp && filter.exp[isExp] ? filter.exp[isExp].isChecked : ((isBin && isExp == 'Unexpired' && term != 'X00') ? false : true), count:0, qty:0} //if someone search for 'A00' show only the expired items by default (this will help data entry people purging expireds)
      }

      if ( ! ndcFilter[ndc])
        ndcFilter[ndc] = {isChecked:filter.ndc && filter.ndc[ndc] ? filter.ndc[ndc].isChecked : defaultCheck || pended || ! i, count:0, qty:0}

      if ( ! formFilter[form])
        formFilter[form] = {isChecked:filter.form && filter.form[form] ? filter.form[form].isChecked : defaultCheck || pended || ! i, count:0, qty:0}

      if ( ! repackFilter[repack])
        repackFilter[repack] = {isChecked:filter.repack && filter.repack[repack] ? filter.repack[repack].isChecked : ((isBin && repack == 'Repacked' && term != 'X00') ? false : true), count:0, qty:0} //if someone search for 'A00' show the whole bin but not the repacks by default (this will help data entry people purging expireds)

      if ( ! expFilter[isExp].isChecked) {
        if (expFilter[exp].isChecked && ndcFilter[ndc].isChecked && formFilter[form].isChecked && repackFilter[repack].isChecked) {
          expFilter[isExp].count++
          expFilter[isExp].qty += qty
        }

        return inventory.prototype.setCheck.call({filter}, transaction, false)
      }

      if ( ! expFilter[exp].isChecked) {
        if (expFilter[isExp].isChecked && ndcFilter[ndc].isChecked && formFilter[form].isChecked && repackFilter[repack].isChecked) {
          expFilter[exp].count++
          expFilter[exp].qty += qty
        }

        return inventory.prototype.setCheck.call({filter}, transaction, false)
      }

      if ( ! ndcFilter[ndc].isChecked) {
        if (expFilter[isExp].isChecked && expFilter[exp].isChecked && formFilter[form].isChecked && repackFilter[repack].isChecked) {
          ndcFilter[ndc].count++
          ndcFilter[ndc].qty += qty
        }

        return inventory.prototype.setCheck.call({filter}, transaction, false)
      }

      if ( ! formFilter[form].isChecked) {
        if (expFilter[isExp].isChecked && expFilter[exp].isChecked && ndcFilter[ndc].isChecked && repackFilter[repack].isChecked) {
          formFilter[form].count++
          formFilter[form].qty += qty
        }
        return inventory.prototype.setCheck.call({filter}, transaction, false)
      }

      if ( ! repackFilter[repack].isChecked) {
        if (expFilter[isExp].isChecked && expFilter[exp].isChecked && ndcFilter[ndc].isChecked && formFilter[form].isChecked) {
          repackFilter[repack].count++
          repackFilter[repack].qty += qty
        }

        return inventory.prototype.setCheck.call({filter}, transaction, false)
      }

      if ( ! transaction.isChecked)
        checkVisible = false

      expFilter[isExp].count++
      expFilter[isExp].qty += qty

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
export class pendedFilterValueConverter {
  toView(pended = {}, term = ''){
    term = term.toLowerCase()
    let matches = [] //an array of arrays
    for (let pendId in pended) {
      if ( ~ pendId.toLowerCase().indexOf(term)) {
        matches.unshift({key:pendId, val:pended[pendId]})
        continue
      }

      let genericMatches = {}

      for (let generic in pended[pendId])
        if ( ~ generic.toLowerCase().indexOf(term))
          genericMatches[generic] = pended[pendId][generic]

      if (Object.keys(genericMatches).length)
        matches.unshift({key:pendId, val:genericMatches})
    }

    return matches
  }
}
