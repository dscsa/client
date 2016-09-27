export function incrementBox($event, transaction) {
  if ($event.which == 107 || $event.which == 187) { // + key on numpad, keyboard
    transaction.location = transaction.location[0]+(+transaction.location.slice(1)+1)
    return false //don't actually add the +
  }

  if ($event.which == 109 || $event.which == 189) {// - key on numpad, keyboard
    transaction.location = transaction.location[0]+(+transaction.location.slice(1)-1)
    return false //don't actually add the -
  }

  return clearIfAsterick($event)
}

export function expShortcuts($event, $index) {
  //Enter should focus on quantity
  if ($event.which == 13)
    return this.focusInput(`#qty_${$index}`)

  return clearIfAsterick($event)
}

export function qtyShortcuts($event, $index) {
  //Enter should focus on rx_input, unless it is hidden
  if ($event.which == 13)
    return this.focusInput(`#box_${$index}`, `md-autocomplete`)

  return clearIfAsterick($event)
}

function clearIfAsterick($event) {
  return $event.which == 106 || $event.which == 56 ? $event.target.value = "" : true
}

export function saveTransaction(transaction) {
  return this._saveTransaction = Promise.resolve(this._saveTransaction).then(_ => {
    return this.db.transaction.put(transaction)
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

  if (term.length < 3) {
    return Promise.resolve(this._search = []) //always return a promise
  }

  if (/^[\d-]+$/.test(term)) {
    this.regex = RegExp('('+term+')', 'gi')
    this._search = this.db.drug.get({ndc:term})
  } else {
    this.regex = RegExp('('+term.replace(/ /g, '|')+')', 'gi')
    this._search = this.db.drug.get({generic:term})
  }

  return this._search
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
