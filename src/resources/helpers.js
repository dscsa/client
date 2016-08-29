export function incrementBox($event, transaction) {
  if ($event.which == 107 || $event.which == 187) { // + key on numpad, keyboard
    transaction.location = transaction.location[0]+(+transaction.location.slice(1)+1)
    return false //don't actually add the +
  }

  if ($event.which == 109 || $event.which == 189) {// - key on numpad, keyboard
    transaction.location = transaction.location[0]+(+transaction.location.slice(1)-1)
    return false //don't actually add the -
  }

  return true
}

export function saveTransaction(transaction) {
  Promise.resolve(this._saveTransaction).then(_ => {
    console.log('saveTransaction', transaction)
    this._saveTransaction = this.db.transaction.put(transaction)
    .catch(err => {
      this.snackbar.show(`Error saving transaction: ${err.reason || err.message }`) //message is for pouchdb errors
    })
  })

  return true
}

export function scrollSelect($event, index, list, cb) {

  let last  = list.length - 1

  if ($event.which == 38) //Keyup
    cb.call(this, list[index > 0 ? index - 1 : last])

  if ($event.which == 40) //keydown
    cb.call(this, list[index < last ? index+1 : 0])
}

export function focusInput(selector) {
  let elem = document.querySelector(`${selector} input`)

  elem
    ? elem.focus()
    : console.log(`Cannot find ${selector} input`)

  return false
}

export function toggleDrawer() {
  let drawer = document.querySelector('.mdl-layout__header')
  drawer && drawer.firstChild.click() //view might not be attached yet meaning selector is null
}
}
