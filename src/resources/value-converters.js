 import {toJsonDate, parseUserDate} from '../resources/helpers'

//http://stackoverflow.com/questions/32017532/observe-property-on-an-array-of-objects-for-any-changes
export class jsonValueConverter {
  toView(object = null){
    return JSON.stringify(object, null, " ")
  }
}

export class numberValueConverter {
  fromView(str){
    return str === '' ? null : +str
  }
}

export class upperCaseValueConverter {
  fromView(str) {
    return str == null ? null : str.toUpperCase()
  }
}

export class shipmentFilterValueConverter {
  toView(shipments = [], filter = ''){
    filter = filter.toLowerCase()
    return shipments.filter(shipment => {
      return ~ `${shipment.account.from.name} ${shipment.account.to.name} ${shipment.tracking} ${shipment.status} ${shipment._id && shipment._id.slice(0, 10)}`.toLowerCase().indexOf(filter)
    })
  }
}

export class drugFilterValueConverter {
  toView(drugs = [], filter = ''){
    filter = filter.replace('.', '\\.').split(/, |[, ]/g)
    var regex = RegExp('(?=.*'+filter.join(')(?=.*( |0)')+')', 'i') //Use lookaheads to search for each word separately (no order).  Even the first term might be the 2nd generic
    return drugs.filter(drug => regex.test(drug.generic))
  }
}

export class recordFilterValueConverter {
  toView(days = [], filter = ''){
    return days.filter(day => ~ day.indexOf(filter))
  }
}

//TODO make this work with added items
export class userFilterValueConverter {
  toView(users = [], filter = ''){
    filter = filter.toLowerCase()
    let res = users.filter(user => {
      try {
        return ~ `${user.name.first} ${user.name.last}`.toLowerCase().indexOf(filter)
      }
      catch (err) {
        console.log('filter err', user, err)
      }
    })
    return res
  }
}

export class valueValueConverter {
  toView(transactions = [], decimals, trigger) {

    transactions = Array.isArray(transactions) ? transactions : [transactions]

    return transactions.reduce((total, transaction) => {
      if ( ! transaction.drug.price || ! transaction.qty) return 0
      let price = transaction.drug.price.goodrx || transaction.drug.price.nadac || 0
      let   qty = transaction.qty.to || transaction.qty.from || 0
      return total + qty * price
    }, 0).toFixed(decimals)
  }
}

export class boldValueConverter {
  toView(text, bold){
    if ( ! bold || ! text) return text

    if (typeof bold == 'string') //Handle a strength of 0.5mg and .5mg interchangeably
      bold = RegExp('('+bold.replace(/ /g, '|').replace('.', '( | 0)?\\.')+')', 'gi')

    return text.replace(bold, '<strong>$1</strong>')
  }
}

export class dateValueConverter {

  toView(date) {
    if ( ! date ) return ''
    return date != this.model ? date.slice(5,7)+'/'+date.slice(2,4) : this.view
  }

  fromView(date){

    if (date.includes('*'))
      return null

    let add = date.includes('+') || date.includes('=')
    let sub = date.includes('-')

    let {month, year} = parseUserDate(date.replace(/\+|\-|\=/g, ''))

    if (year.length > 2) //without this if user accidentally typed an extra character it would cause ongoing save error
      year = year.slice(0, 2)

    if (add) month++
    if (sub) month--

    if (month == 0) {
      month = 12
      year--
    }

    if (month == 13) {
      month = 1
      year++
    }

    //Keep zerp padding in front of the month which is lost when month changes
    this.view = ("00"+month).slice(-2)+'/'+year

    return this.model = toJsonDate({month, year})
  }
}

export class toArrayValueConverter {
  toView(obj = {}, sort){

    let arr = Object.keys(obj)

    if (sort) arr.sort()

    return arr.map(key => {
      return {key, val:obj[key]}
    })
  }
}

//ADDED step of converting object to array
export class inventoryFilterValueConverter {
  isRepacked(transaction) {
    return transaction.shipment._id.indexOf('.') == -1 ? 'Repacked' : 'Inventory'
  }
  toView(transactions = [], filter = {}){

    filter.ndc    = {}
    filter.exp    = {}
    filter.repack = {}
    filter.form   = {}

    transactions = transactions.filter(transaction => {

      //TODO we could reduce code by making this a loop of keys.  Lot's of redundancy here
      let qty    = transaction.qty.to || transaction.qty.from
      let exp    = transaction.exp.to || transaction.exp.from
      let ndc    = transaction.drug._id
      let form   = transaction.drug.form
      let repack = this.isRepacked(transaction)

      if ( ! filter.exp[exp])
        filter.exp[exp] = {isChecked:true, count:0, qty:0}

      if ( ! filter.ndc[ndc])
        filter.ndc[ndc] = {isChecked:true, count:0, qty:0}

      if ( ! filter.form[form])
        filter.form[form] = {isChecked:true, count:0, qty:0}

      if ( ! filter.repack[repack])
        filter.repack[repack] = {isChecked:true, count:0, qty:0}

      if ( ! filter.exp[exp].isChecked) {
        if (filter.ndc[ndc].isChecked && filter.form[form].isChecked && filter.repack[repack].isChecked) {
          filter.exp[exp].count++
          filter.exp[exp].qty += qty
        }
        return false
      }
      if ( ! filter.ndc[ndc].isChecked) {
        if (filter.exp[exp].isChecked && filter.form[form].isChecked && filter.repack[repack].isChecked) {
          filter.ndc[ndc].count++
          filter.ndc[ndc].qty += qty
        }
        return false
      }

      if ( ! filter.form[form].isChecked) {
        if (filter.exp[exp].isChecked && filter.ndc[ndc].isChecked && filter.repack[repack].isChecked) {
          filter.form[form].count++
          filter.form[form].qty += qty
        }
        return false
      }

      if ( ! filter.repack[repack].isChecked) {
        if (filter.exp[exp].isChecked && filter.ndc[ndc].isChecked && filter.form[form].isChecked) {
          filter.repack[repack].count++
          filter.repack[repack].qty += qty
        }
        return false
      }

      filter.exp[exp].count++
      filter.exp[exp].qty += qty

      filter.ndc[ndc].count++
      filter.ndc[ndc].qty += qty

      filter.form[form].count++
      filter.form[form].qty += qty

      filter.repack[repack].count++
      filter.repack[repack].qty += qty

      return true
    })

    return transactions
  }
}
