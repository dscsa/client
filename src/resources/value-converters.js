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
      return ~ `${shipment.account.from.name} ${shipment.account.to.name} ${shipment.tracking} ${shipment.status} ${shipment.createdAt.slice(0, 10)}`.toLowerCase().indexOf(filter)
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
    for (let transaction of transactions) {
      let keys = {
           exp:transaction.exp.to || transaction.exp.from,
           ndc:transaction.drug._id,
          form:transaction.drug.form,
        repack:this.isRepacked(transaction)
      }

      for (let i in keys) {
        let key = keys[i]
        filter[i] = filter[i] || {}
        filter[i][key] = filter[i][key] || {isChecked:true}
        filter[i][key].count = 0
        filter[i][key].qty   = 0
      }
    }

    transactions = transactions.filter(transaction => {
      let qty    = transaction.qty.to || transaction.qty.from
      let exp    = transaction.exp.to || transaction.exp.from
      let ndc    = transaction.drug._id
      let form   = transaction.drug.form
      let repack = this.isRepacked(transaction)

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
