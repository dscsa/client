 import {toJsonDate, parseUserDate} from '../resources/helpers'

//http://stackoverflow.com/questions/32017532/observe-property-on-an-array-of-objects-for-any-changes
export class jsonValueConverter {
  toView(object = null){
    return JSON.stringify(object, null, " ")
  }
}

export class numberValueConverter {
  fromView(str, decimals){
    //Match servers transaction.js default: Empty string -> null, string -> number, number -> number (including 0)
    return str != null && str !== '' ? +str : null
  }

  toView(str, decimals){
    //Match servers transaction.js default: Empty string -> null, string -> number, number -> number (including 0)
    return str != null && decimals ? (+str).toFixed(decimals) : str
  }
}

export class shipmentFilterValueConverter {
  toView(shipments = [], filter = ''){
    filter = filter.toLowerCase()
    return shipments.filter(shipment => {
      return ~ `${shipment.account.from.name} ${shipment.account.to.name} ${shipment.tracking} ${shipment.status}`.toLowerCase().indexOf(filter)
    })
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
    return users.filter(user => {
      return ~ `${user.name.first} ${user.name.last}`.toLowerCase().indexOf(filter)
    })
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
    bold = RegExp('('+bold.replace(/ /g, '|')+')', 'gi')
    return text.replace(bold, '<strong>$1</strong>')
  }
}

export class dateValueConverter {

  toView(date) {
    if ( ! date ) return ''
    return date != this.model ? date.slice(5,7)+'/'+date.slice(2,4) : this.view
  }

  fromView(date){
    let add = date.includes('+') || date.includes('=')
    let sub = date.includes('-')
    let {month, year} = parseUserDate(date.replace(/\+|\-|\=/g, ''))

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
    this.view  = ("00"+month).slice(-2)+'/'+year

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
  toView(transactions = [], filter){
    for (let transaction of transactions) {
      let exp  = transaction.exp.to || transaction.exp.from
      let ndc  = transaction.drug._id
      let form = transaction.drug.form
      filter.exp[exp].count = 0
      filter.exp[exp].qty = 0
      filter.ndc[ndc].count = 0
      filter.ndc[ndc].qty = 0
      filter.form[form].count = 0
      filter.form[form].qty = 0
    }

    transactions = transactions.filter(transaction => {

      let qty  = transaction.qty.to || transaction.qty.from
      let exp  = transaction.exp.to || transaction.exp.from
      let ndc  = transaction.drug._id
      let form = transaction.drug.form

      if ( ! filter.exp[exp].isChecked) {
        if (filter.ndc[ndc].isChecked && filter.form[form].isChecked) {
          filter.exp[exp].count++
          filter.exp[exp].qty += qty
        }
        return false
      }
      if ( ! filter.ndc[ndc].isChecked) {
        if (filter.exp[exp].isChecked && filter.form[form].isChecked) {
          filter.ndc[ndc].count++
          filter.ndc[ndc].qty += qty
        }
        return false
      }

      if ( ! filter.form[form].isChecked) {
        if (filter.exp[exp].isChecked && filter.ndc[ndc].isChecked) {
          filter.form[form].count++
          filter.form[form].qty += qty
        }
        return false
      }

      filter.exp[exp].count++
      filter.ndc[ndc].count++
      filter.form[form].count++
      filter.exp[exp].qty   += qty
      filter.ndc[ndc].qty   += qty
      filter.form[form].qty += qty
      return true
    })

    filter.exp = Object.assign({}, filter.exp)
    filter.ndc = Object.assign({}, filter.ndc)

    return transactions
  }
}
