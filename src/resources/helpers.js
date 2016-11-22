
export function expShortcuts($event, $index) {
  //Enter should focus on quantity
  if ($event.which == 13)
    return this.focusInput(`#qty_${$index}`)

  return true
}

export function qtyShortcuts($event, $index) {
  //Enter should focus on rx_input, unless it is hidden
  if ($event.which == 13)
    return this.focusInput(`#box_${$index}`, `md-autocomplete`)

  return clearIfAsterick($event)
}

export function incrementBox($event, transaction) {
  if ($event.which == 107 || $event.which == 187) { // + key on numpad, keyboard
    transaction.location = transaction.location[0]+(+transaction.location.slice(1)+1)
    saveTransaction.call(this, transaction)
    return false //don't actually add the +
  }

  if ($event.which == 109 || $event.which == 189) {// - key on numpad, keyboard
    transaction.location = transaction.location[0]+(+transaction.location.slice(1)-1)
    saveTransaction.call(this, transaction)
    return false //don't actually add the -
  }

  return clearIfAsterick($event)
}

function clearIfAsterick($event) {
  return $event.which == 106 || ($event.shiftKey && $event.which == 56) ? $event.target.value = "" : true
}

export function saveTransaction(transaction) {
  return this._saveTransaction = Promise.resolve(this._saveTransaction).then(_ => {
    return this.db.transaction.put(transaction)
  }).catch(err => {
    delete this._saveTransaction
    this.snackbar.show(`Error saving transaction: ${err.reason || err.message }`)
    throw err
  })
}

export function scrollSelect($event, curr, list = [], cb) {

  let index = list.indexOf(curr)
  let last  = list.length - 1

  if ($event.which == 38) //Keyup
    cb.call(this, list[index > 0 ? index - 1 : last])

  if ($event.which == 40) //keydown
    cb.call(this, list[index < last ? index+1 : 0])
}

export function focusInput(selector, fallback) {
  let elem = document.querySelector(`${selector} input`)

  if (elem && ! elem.disabled)
    elem.focus()
  else if (fallback)
    document.querySelector(`${fallback} input`).focus()
  else
    console.log(`Cannot find ${selector} input`)

  return false
}

export function toggleDrawer() {
  let drawer = document.querySelector('.mdl-layout__header')
  drawer && drawer.firstChild.click() //view might not be attached yet meaning selector is null
}

export function drugSearch() {
  let term = (this.term || '').trim()

  //always do searches serially
  return this._search = Promise.resolve(this._search).then(_ => {
    return this.db.drug.get(/^[\d-]+$/.test(term) ? {ndc:term} : {generic:term})
  })
}

//whether mm/yy or mm/dd/yy, month is always first and year is always last
export function parseUserDate(date) {
  date = (date || "").split('/') //can't do default arugment because can be null as well as undefined
  return {
    year:date.pop(),
    month:date.shift()
  }
}

//To get last day in month, set it to next month and subtract a day
export function toJsonDate({month, year}) {
  let date = new Date('20'+year,month, 1)
  date.setDate(0)
  return date.toJSON()
}

//Calls the direct query to pouch to wait on the drug database being synced. Then it
//reopens the search field and changes the placeholder.
export function waitForDrugsToIndex(){
  this.db.drug.drugIsIndexed.get().then(_ => {
   this.drugsIndexed = true
   this.placeholder = "Search Drugs By Generic Name..."
  })
}

import {Redirect} from 'aurelia-router'

export function canActivate(_, next, {router}) {
  return this.db.user.session.get().then(session => {

    let loggedIn = session && session.account

    for (let route of router.navigation)
        route.isVisible = loggedIn
          ? route.config.roles && ~route.config.roles.indexOf('user')
          : ! route.config.roles

    let canActivate = next.navModel.isVisible || ! next.nav

    return canActivate || router.currentInstruction
      ? canActivate
      : new Redirect(loggedIn ? 'shipments' : 'login')
  })
  .catch(err => console.log('loginRequired error', err))
}
