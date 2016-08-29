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

//whether mm/yy or mm/dd/yy, month is always first and year is always last
function parseUserDate(date) {
  date = (date || "").split('/') //can't do default arugment because can be null as well as undefined
  return {
    year:date.pop(),
    month:date.shift()
  }
}

//To get last day in month, set it to next month and subtract a day
function toJsonDate({month, year}) {
  let date = new Date('20'+year,month, 1)
  date.setDate(0)
  return date.toJSON()
}

export class toArrayValueConverter {
  toView(obj = {}){
    let arr = []
    for (var key in obj)
      arr.push({key, val:obj[key]})

    return arr
  }
}

//ADDED step of converting object to array
export class inventoryFilterValueConverter {
  toView(transactions = [], filter){
    for (let transaction of transactions) {
      filter.exp[transaction.exp.from].count = 0
      filter.exp[transaction.exp.from].qty = 0
      filter.ndc[transaction.drug._id].count = 0
      filter.ndc[transaction.drug._id].qty = 0
    }

    transactions = transactions.filter(transaction => {
      if (filter.rx) {
        if ( ! transaction.rx || ! transaction.rx.from) return false
        if ( ! transaction.rx.from.includes(filter.rx)) return false
      }

      if ( ! filter.exp[transaction.exp.from].isChecked) {
        if (filter.ndc[transaction.drug._id].isChecked) {
          filter.exp[transaction.exp.from].count++
          filter.exp[transaction.exp.from].qty += transaction.qty.from
        }
        return false
      }
      if ( ! filter.ndc[transaction.drug._id].isChecked) {
        if (filter.exp[transaction.exp.from].isChecked) {
          filter.ndc[transaction.drug._id].count++
          filter.ndc[transaction.drug._id].qty += transaction.qty.from
        }
        return false
      }

      filter.exp[transaction.exp.from].count++
      filter.ndc[transaction.drug._id].count++
      filter.exp[transaction.exp.from].qty += transaction.qty.from
      filter.ndc[transaction.drug._id].qty += transaction.qty.from
      return true
    })

    filter.exp = Object.assign({}, filter.exp)
    filter.ndc = Object.assign({}, filter.ndc)

    return transactions
  }
}
