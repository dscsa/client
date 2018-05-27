
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

export function removeTransactionIfQty0($event, $index) {
  //Delete an item in the qty is 0.  Instead of having a delete button

  let transaction = this.transactions[$index]
  let doneeDelete = ! transaction.qty.from && transaction.qty.to === 0
  let donorDelete = ! transaction.qty.to   && transaction.qty.from === 0

  if ( ! donorDelete && ! doneeDelete)
    return true

  this.drugs = [] //get rid of previous results since someone might press enter and accidentally readd the same drug
  this.transactions.splice($index, 1) //Important to call splice before promise resolves since it will cancel the saveTransaction which would cause a conflict
  //TODO get rid of this.diff as well in case this transaction was selected
  this.db.transaction.remove(transaction)
  this.focusInput(`md-autocomplete`)
}

export function incrementBin($event, transaction) {
  if ($event.which == 107 || $event.which == 187) { // + key on numpad, keyboard
    transaction.bin = transaction.bin[0]+('00'+(+transaction.bin.slice(1)+1)).slice(-3)
    saveTransaction.call(this, transaction)
    return false //don't actually add the +
  }

  if ($event.which == 109 || $event.which == 189) {// - key on numpad, keyboard
    transaction.bin = transaction.bin[0]+('00'+(+transaction.bin.slice(1)-1)).slice(-3)
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
      upc  = '^'+drug.upc+'(\\d{' + (10 - drug.upc.length) + '})$' //upc could be 8, 9 or 10 digits long so just save all extra digits
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
      return search._drugs.then(drugs => {
        let filtered = drugs.filter(filter)
        return term.length == 9 || term.length == 11 ? filtered.reverse() : filtered
      })
    }

    function filter(drug) {
      search.addPkgCode(term, drug)
      //If upc.length = 9 then the ndc9 code should yield a match, otherwise the upc  which is cutoff at 8 digits will have false positives
      return drug.ndc9.startsWith(ndc9) || (drug.upc.length != 9 && term.length != 11 && drug.upc.startsWith(upc))
    }

    console.log('QUERY', 'ndc9', ndc9, 'upc', upc, 'term', term, 'this.term', search._term)

    search._term = term

    ndc9 = this.db.drug.query('ndc9', search.range(ndc9)).then(search.map(start))

    upc = this.db.drug.query('upc', search.range(upc)).then(search.map(start))

    //TODO add in ES6 destructuing
    return search._drugs = Promise.all([ndc9, upc]).then(([ndc9, upc]) => {

      let unique = {}

      for (const drug of ndc9)
        unique[drug._id] = drug

      for (const drug of upc)
        if (drug.upc.length != 9 && term.length != 11) //If upc.length = 9 then the ndc9 code should yield a match, otherwise the upc which is cutoff at 8 digits will have false positives
          unique[drug._id] = drug

      unique = Object.keys(unique).map(key => search.addPkgCode(term, unique[key]))
      console.log('query returned', unique.length, 'rows and took', Date.now() - start)
      return unique
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

//Accepted formats mm/yy, mmyy, mm/dd/yy, or mmddyy month is always first and year is always last
export function parseUserDate(date) {

  date = (date || '').split('/') //sometimes null is passed so default arg doesn't always work

  //Three digits seems ambiguous even with advanced logic 121 -> 12/18 || 01/21.
  if (date[1] || date[0].length < 4)
    return { month:date.shift(), year:date.pop() }

  return { month:date[0].slice(0, 2), year:date[0].slice(-2) }
}

//To get last day in month, set it to next month and subtract a day
// export function toJsonDate({month, year}) {
//   let date = new Date('20'+year,month, 1)
//   date.setDate(0)
//   return date.toJSON()
// }
//Can't round up must round down
export function toJsonDate({month, year}) {
  console.log('date', month, year, new Date('20'+year,month-1, 1).toJSON())
  return new Date('20'+year,month-1, 1).toJSON()
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

export function getHistory(id) {
  return this.db.transaction.history.get(id).then(_history => {
    console.log('history', id, _history)
    //TODO move this to /history?text=true. Other formatting options?
    function id(k,o) {
      //console.log(o, typeof o)
      if (Array.isArray(o))
        return o
      return o.shipment.from.name+' '+o._id
    }
    //console.log('_history', JSON.stringify(_history.content, id, "*"))
    function pad(word, num) {
      return (word+' '.repeat(num)).slice(0, num)
    }
    return JSON.stringify(
      _history,
      (k,v) => {
        if (Array.isArray(v))
          return v

          let status      = this.status || 'pickup' //Might not be initialized yet
          let href        = '/#/shipments/'+v.shipment._id
          let fromName    = 'From: '+v.shipment.account.from.name
          let fromStreet  = v.shipment.account.from.street
          let fromAddress = v.shipment.account.from.city+', '+v.shipment.account.from.state+' '+v.shipment.account.from.zip
          let date        = `<a href='${href}'>${pad(v._id.slice(0, 10), 20)}</a>`
          let qty         = pad('Quantity '+(v.qty.to || v.qty.from), 20)
          let tracking    = pad(v.type, 20)
          let toName      = ''
          let toStreet    = ''
          let toAddress   = ''

          if (v.shipment.account.to) {
            toName    = 'To: '+v.shipment.account.to.name
            toStreet  = v.shipment.account.to.street
            toAddress = v.shipment.account.to.city+', '+v.shipment.account.to.state+' '+v.shipment.account.to.zip
            tracking  = `<a target='_blank' href='https://www.fedex.com/apps/fedextrack/?tracknumbers=${v.shipment.tracking}'>${pad('FedEx Tracking', 20)}</a>`
          }

          return date     + pad(fromName, 35)    + toName    +"<br>"+
                 qty      + pad(fromStreet, 35)  + toStreet  +'<br>'+
                 tracking + pad(fromAddress, 35) + toAddress
      },
      "   "
    )
    .replace(/\[\n?\s*/g, "<div style='margin-top:-12px'>")
    .replace(/\n?\s*\],?/g, '</div>')
    .replace(/ *"/g, '')
    .replace(/\n/g, '<br><br>')
  })
}
