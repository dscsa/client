import {inject} from 'aurelia-framework';
import {Pouch}     from '../libs/pouch'
import {Router} from 'aurelia-router';
import {csv}    from '../libs/csv'
import {canActivate, expShortcuts, qtyShortcuts, removeTransactionIfQty0, incrementBin, saveTransaction, focusInput, drugSearch, groupDrugs, drugName, waitForDrugsToIndex, toggleDrawer, getHistory, currentDate} from '../resources/helpers'

@inject(Pouch, Router)
export class shopping {

  constructor(db, router){
    this.db      = db
    this.router  = router
    this.csv     = csv
    this.transactions = []
    this.pended = {}

    this.shopList = []
    this.shoppingIndex = -1


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
    this.currentDate     = currentDate
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

      this.user    = { _id:session._id}
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



  setTransactions(transactions = [], type, limit) {
    if (transactions.length == limit) {
      this.type = type
      this.snackbar.show(`Displaying first 100 results`)
    } else
      this.type = null

    //Sort X00 bin alphabetically per Cindy's request.
    if ( ~ ['M00', 'T00', 'W00', 'R00', 'F00', 'X00', 'Y00', 'Z00'].indexOf(this.term))
      transactions = transactions.sort((a,b) => {
        if (a.drug.generic < b.drug.generic) return -1
        if (b.drug.generic < a.drug.generic) return 1
      })

    this.shopList = transactions
    for(var i = 0; i < this.shopList.length; i++){
      this.shopList[i].outcome = {
        'exact_match':false,
        'roughly_equal':false,
        'slot_before':false,
        'slot_after':false,
        'missing':false,
      }
    }
    console.log(this.shopList)
    this.transactions = transactions //TODO remove, only here for debugging
    this.noResults    = this.term && ! transactions.length
    this.filter = {} //after new transactions set, we need to set filter so checkboxes don't carry over
  }


  isRepack(transaction) {
    return transaction.bin && transaction.bin.length == 3
  }

  isBin(term) { //unlike shipment page allow for B00* to search all sections within large B00 bin but don't include repacks
    return /^[A-Za-z][0-6]?\d[\d*]$/.test(term)
  }

  isExp(term) {
    return /^20\d\d-\d\d-?\d?\d?$/.test(term)
  }


  //Given the pendedkey to identify the order, take all the items in that order
  //and display them one at a time for shopper
  selectOrder(pendedKey) {
    const [pendId, label] = pendedKey.split(': ')

    let transactions = Object.values(this.pended[pendId] || {}).reduce((arr, pend) => {
         return ! label || pend.label == label ? arr.concat(pend.transactions) : arr
    }, [])

    if (transactions)
      this.term = 'Pended '+pendedKey

    transactions.sort(this.sortPended.bind(this))

    this.setTransactions(transactions)

    this.shoppingIndex = 0
  }


  movePickingForward(){
    if(this.shoppingIndex == this.shopList.length -1){ //then we're finished
      //TODO: process the outcomes properties fully into transaction items
      //Offer up more orders
      return
    }

    this.shoppingIndex += 1
  }

  movePickingBackward(){
    if(this.shoppingIndex == 0) return
    this.shoppingIndex -= 1
  }

  //Toggles the radio options on each shopping item, stored as an extra property
  //of the transaction, to be processed after the order is complete and saves all results
  shoppingOption(key){
    this.shopList[this.shoppingIndex].outcome[key] = !this.shopList[this.shoppingIndex].outcome[key]
  }

  selectTerm(type, key) {

    console.log('selectTerm', type, key)

    this.setVisibleChecks(false) //reset selected qty back to 0
    this.repacks = []  //empty and left over repacks

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

  //TODO: this is what we do after completing a shoplist
  unpendInventory() {
    const term = this.repacks.drug.generic
    this.updateSelected(transaction => {
      console.log(transaction)
      console.log("UP")
      let next = transaction.next
      if(next[0] && next[0].pended){
       delete next[0].pended
       if(Object.keys(next[0]) == 0) next = [] //don't want to leave an empty object, throws off other stuff
      }
      transaction.isChecked = false
      transaction.next = next //TODO: should this add a new object to transaction.next
      //transaction.next = []
    })
    //We must let these transactions save without next for them to appear back in inventory
   .then(_ => term ? this.selectTerm('generic', term) : this.term = '')
  }

  //Sorts transactions that were pended
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
    const dispensed_obj = { _id: new Date().toJSON(), user: this.user  }

    this.updateSelected(transaction => {
      let next = transaction.next
      if(next.length == 0) next = [{}]
      next[0].dispensed = dispensed_obj //so we don't modify other data

      transaction.next = next
    })
  }

  disposeInventory() {
    const disposed_obj = { _id: new Date().toJSON(), user:  this.user  }

    this.updateSelected(transaction => {
      let next = transaction.next
      if(next.length == 0) next = [{}]
      next[0].disposed = disposed_obj //so we don't modify other data


      transaction.next = next
    })
  }


  getPendId(transaction) {

    //getPendId from a transaction
    if (transaction) {

      const pendId  = transaction.next[0] ? transaction.next[0].pended.group : null
      const created = transaction.next[0] ? transaction.next[0].pended._id : transaction._id

      return pendId ? pendId : created.slice(5, 16).replace('T', ' ')  //Google App Script is using Pend Id as "Order# - Qty" and we want to group only by Order#.
    }

    //Get the currectly selected pendId
    //Hacky. Maybe we should set these individually rather than splitting them.
    return this.term.replace('Pended ', '').split(': ')[0]
  }


  getPendQty(transaction) {

    //getPendId from a transaction
    if (transaction) {
      const pendId  = transaction.next[0] ? transaction.next[0].pended.group : null
      return pendId ? pendId : undefined
    }

    return this.term.split(' - ')[1]
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

  //Sorts the pended Orders
  //Currently only sorts by number of items, putting orders with fewer items at the top
  //todo: when we have a priority property, sort by tht first
  sortPended(arr){
    console.log("Orders before sorting")
    console.log(arr)

    arr = arr.sort((a,b) => {
      if(Object.keys(Object.values(a)[1]).length > Object.keys(Object.values(b)[1]).length) return 1
    })

    console.log("Orders after sorting")
    console.log(arr)

    return arr
  }
}

//ADDED step of converting object to array
export class shoppingFilterValueConverter {
  toView(transactions = [], filter = {}, term = ''){
    //restart filter on transaction changes but keep checks
    //where they are if user is just modifying the filter
    let ndcFilter       = {}
    let expFilter       = {}
    let repackFilter    = {}
    let formFilter      = {}
    let checkVisible    = true
    let oneMonthFromNow = currentDate(1)
    let isBin           = shopping.prototype.isBin(term)
    let defaultCheck    = isBin || shopping.prototype.isExp(term)

    filter.checked = filter.checked || {}
    filter.checked.qty = filter.checked.qty || 0
    filter.checked.count = filter.checked.count || 0

    transactions = transactions.filter((transaction, i) => {

      //TODO we could reduce code by making this a loop of keys.  Lot's of redundancy here
      let qty    = transaction.qty.to || transaction.qty.from
      let exp    = (transaction.exp.to || transaction.exp.from).slice(0, 7)
      let ndc    = transaction.drug._id
      let form   = transaction.drug.form
      let repack = shopping.prototype.isRepack(transaction) ? 'Repacked' : 'Inventory'
      let isExp  = exp > oneMonthFromNow ? 'Unexpired' : 'Expired'
      let pended = transaction.next[0] && transaction.next[0].pended

      if ( ! expFilter[exp]) {
        //console.log('pended', !!pended, 'exp', exp, 'filter.exp', filter.exp, 'filter.exp[exp]', filter.exp && filter.exp[exp], 'filter.exp[exp].isChecked', filter.exp && filter.exp[exp] && filter.exp[exp].isChecked)
        expFilter[exp] = {isChecked:filter.exp && filter.exp[exp] ? filter.exp[exp].isChecked : defaultCheck || pended || false, count:0, qty:0}
      }

      if ( ! expFilter[isExp]) {
        expFilter[isExp] = {isChecked:filter.exp && filter.exp[isExp] ? filter.exp[isExp].isChecked : ((isBin && isExp == 'Unexpired' && term[3] == '*') ? false : true), count:0, qty:0} //if someone search for 'A00*' show only the expired items by default (this will help data entry people purging expireds)
      }

      if ( ! ndcFilter[ndc])
        ndcFilter[ndc] = {isChecked:filter.ndc && filter.ndc[ndc] ? filter.ndc[ndc].isChecked : defaultCheck || pended || ! i, count:0, qty:0}

      if ( ! formFilter[form])
        formFilter[form] = {isChecked:filter.form && filter.form[form] ? filter.form[form].isChecked : defaultCheck || pended || ! i, count:0, qty:0}

      if ( ! repackFilter[repack])
        repackFilter[repack] = {isChecked:filter.repack && filter.repack[repack] ? filter.repack[repack].isChecked : defaultCheck || pended || ! repackFilter['Repacked'], count:0, qty:0}

      if ( ! expFilter[isExp].isChecked) {
        if (expFilter[exp].isChecked && ndcFilter[ndc].isChecked && formFilter[form].isChecked && repackFilter[repack].isChecked) {
          expFilter[isExp].count++
          expFilter[isExp].qty += qty
        }

        return shopping.prototype.setCheck.call({filter}, transaction, false)
      }

      if ( ! expFilter[exp].isChecked) {
        if (expFilter[isExp].isChecked && ndcFilter[ndc].isChecked && formFilter[form].isChecked && repackFilter[repack].isChecked) {
          expFilter[exp].count++
          expFilter[exp].qty += qty
        }

        return shopping.prototype.setCheck.call({filter}, transaction, false)
      }

      if ( ! ndcFilter[ndc].isChecked) {
        if (expFilter[isExp].isChecked && expFilter[exp].isChecked && formFilter[form].isChecked && repackFilter[repack].isChecked) {
          ndcFilter[ndc].count++
          ndcFilter[ndc].qty += qty
        }

        return shopping.prototype.setCheck.call({filter}, transaction, false)
      }

      if ( ! formFilter[form].isChecked) {
        if (expFilter[isExp].isChecked && expFilter[exp].isChecked && ndcFilter[ndc].isChecked && repackFilter[repack].isChecked) {
          formFilter[form].count++
          formFilter[form].qty += qty
        }
        return shopping.prototype.setCheck.call({filter}, transaction, false)
      }

      if ( ! repackFilter[repack].isChecked) {
        if (expFilter[isExp].isChecked && expFilter[exp].isChecked && ndcFilter[ndc].isChecked && formFilter[form].isChecked) {
          repackFilter[repack].count++
          repackFilter[repack].qty += qty
        }

        return shopping.prototype.setCheck.call({filter}, transaction, false)
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
    matches = shopping.prototype.sortPended(matches)
    return matches
  }
}
