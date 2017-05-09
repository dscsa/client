
export function expShortcuts($event, $index) {
  //Enter should focus on quantity
  if ($event.which == 13)
    return this.focusInput(`#qty_${$index}`)

  return true
}

export function qtyShortcuts($event, $index) {
  //Enter should focus on rx_input, unless it is hidden
  if ($event.which == 13)
    return this.focusInput(`#bin_${$index}`, `md-autocomplete`)

  return clearIfAsterick($event)
}

export function incrementBin($event, transaction) {
  if ($event.which == 107 || $event.which == 187) { // + key on numpad, keyboard
    transaction.bin = transaction.bin[0]+(+transaction.bin.slice(1)+1)
    saveTransaction.call(this, transaction)
    return false //don't actually add the +
  }

  if ($event.which == 109 || $event.which == 189) {// - key on numpad, keyboard
    transaction.bin = transaction.bin[0]+(+transaction.bin.slice(1)-1)
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
    delete this._saveTransaction //otherwise subsequent saves will keep showing same error
    //throw to continue to propogate error if our other code wants to catch
    throw this.snackbar.error(err)
  })
}

//Callback must take the selected item as its first argument
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


let search = {
  generic(generic, clearCache) {
    const start = Date.now()
    const terms = generic.toLowerCase().replace('.', '\\.').split(/, |[, ]/g)

    //We do caching here if user is typing in ndc one digit at a time since PouchDB's speed varies a lot (50ms - 2000ms)
    if (generic.startsWith(search._term) && ! clearCache) {
      const regex = RegExp('(?=.*'+terms.join(')(?=.*( |0)')+')', 'i') //Use lookaheads to search for each word separately (no order).  Even the first term might be the 2nd generic
      return search._drugs.then(drugs => drugs.filter(drug => regex.test(drug.generic))).then(drugs => {
        console.log('generic filter returned', drugs.length, 'rows and took', Date.now() - start, 'term', generic, 'cache', search._term)
        search._term = generic
        return drugs
      })
    }

    search._term = generic

    return search._drugs = this.db.drug.query('generics.name', search.range(terms[0])).then(search.map(start))
  },

  addPkgCode(term, drug) {
    var pkg, ndc9, upc
    if (term.length > 8) {
      ndc9 = '^'+drug.ndc9+'(\\d{2})$'
      upc  = '^'+drug.upc+'(\\d{'+(10 - drug.upc.length)+'})$'
      pkg  = term.match(RegExp(ndc9+'|'+upc))
    }

    drug.pkg = pkg ? pkg[1] || pkg[2] : ''
    return drug
  },

  range(term) {
    return {startkey:term, endkey:term+'\uffff', include_docs:true}
  },

  map(start) {
    return res => {
      console.log('query returned', res.rows.length, 'rows and took', Date.now() - start)
      return res.rows.map(row => row.doc)
    }
  },

  //For now we make this function stateful (using "this") to cache results
  ndc(ndc, clearCache) {
    const start = Date.now()
    var term = ndc.replace(/-/g, '')

    //This is a UPC barcode ('3'+10 digit upc+checksum).
    if (term.length == 12 && term[0] == '3')
      term = term.slice(1, -1)

    var ndc9 = term.slice(0, 9)
    var upc  = term.slice(0, 8)

    //We do caching here if user is typing in ndc one digit at a time since PouchDB's speed varies a lot (50ms - 2000ms)
    if (term.startsWith(search._term) && ! clearCache) {
      console.log('FILTER', 'ndc9', ndc9, 'upc', upc, 'term', term, 'this.term', search._term)
      return search._drugs.then(drugs => drugs.filter(drug => {
        search.addPkgCode(term, drug)
        //If upc.length = 9 then the ndc9 code should yield a match, otherwise the upc  which is cutoff at 8 digits will have false positives
        return drug.ndc9.startsWith(ndc9) || (drug.upc.length != 9 && term.length != 11 && drug.upc.startsWith(upc))
      }))
    }

    console.log('QUERY', 'ndc9', ndc9, 'upc', upc, 'term', term, 'this.term', search._term)

    search._term = term

    ndc9 = this.db.drug.query('ndc9', search.range(ndc9)).then(search.map(start))

    upc = this.db.drug.query('upc', search.range(upc)).then(search.map(start))

    //TODO add in ES6 destructuing
    return search._drugs = Promise.all([upc, ndc9]).then(results => {

      let deduped = {}

      for (const drug of results[0])
        if (drug.upc.length != 9 && term.length != 11) //If upc.length = 9 then the ndc9 code should yield a match, otherwise the upc which is cutoff at 8 digits will have false positives
          deduped[drug._id] = drug

      for (const drug of results[1])
          deduped[drug._id] = drug

      deduped = Object.keys(deduped).map(key => search.addPkgCode(term, deduped[key]))
      console.log('query returned', deduped.length, 'rows and took', Date.now() - start)
      return deduped
    })
  }
}

export function drugSearch() {
  if ( ! this.term || this.term.length < 3)
    return Promise.resolve([])

  //When adding a new NDC for an existing drug search term is the same but we want the
  //results to display the new drug too, so we need to disable filtering old results
  const clearCache = this._savingDrug
  const term = this.term.trim()

  //always do searches serially
  return this._search = Promise.resolve(this._search).then(_ => {
    return search[/^[\d-]+$/.test(term) ? 'ndc' : 'generic'].call(this, term, clearCache)
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
   this.placeholder = "Search Drugs By Generic Name Or NDC..."
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
