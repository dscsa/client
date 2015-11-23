//TODO
//Autofocus on new drug
//Disable From/To based on Filter's switch

import {inject}     from 'aurelia-framework';
import {Router}     from 'aurelia-router';
import {Db}         from 'db/pouch'
import {HttpClient} from 'aurelia-http-client';

//@pageState()
@inject(Db, Router, HttpClient)
export class shipments {

  constructor(db, router, http){
    this.db      = db
    this.account = db.users(true).session().account
    this.router  = router
    this.http    = http
    this.months  = ['January','February','March','April','May','June','July','August','September','October','November','December']
    this.year    = new Date().getYear()+1900
    this.month   = this.months[new Date().getMonth()]
  }

  activate(params) {

    //TODO only search for selected date {'captured_at':new Date(this.month+' 01 '+this.year)}
    //TODO search based on type, donation vs destruction
    return this.db.transactions()
    .then(transactions => {
      //TODO do not include inventory items in original search rather than doing filter here
      this.transactions = transactions.filter(t => t.shipment && ~ t.shipment.indexOf('.'))
      let selected = this.transactions.filter(t => t._id === params.id)[0]
      return this.select(selected || this.transactions[0])
    })
  }

  //Activated from constructor and each time a shipment is selected
  select(transaction) {
    this.transaction = transaction
    this.router.navigate('records/'+transaction._id, { trigger: false })
    this.http.get('//localhost:3000/transactions/'+transaction._id+'/history')
    .then(history => {
      //TODO move this to /history?text=true. Other formatting options?
      function id(k,o) {
        console.log(o, typeof o)
        if (Array.isArray(o))
          return o
        return o.from.name+' '+o._id
      }
      console.log('history', JSON.stringify(history.content, id, "*"))
      function pad(word) {
        return (word+' '.repeat(25)).slice(0, 25)
      }
      this.history = JSON.stringify(
        history.content,
        function(k,v) {
          if (Array.isArray(v))
            return v

            let date = v.shipment[this.transaction_date + '_at'] || v.verified_at || ''
            let href = '/#/shipments/'+v.shipment._id.split('.')[2]

            return "<a href='"+href+"'>"+pad(v.from.name)+v.type+'<br>'+
                   pad(v.from.street)+'Date '+date.slice(2, 10)+'<br>'+
                   pad(v.from.city+', '+v.from.state+' '+v.from.zip)+'Quantity '+v.qty.to+'</a>'
        },
        "   "
      )
      .replace(/\[\n?\s*/g, "<div style='margin:-12px 0 0 8px;'>")
      .replace(/\n?\s*\],?/g, '</div>')
      .replace(/ *"/g, '')
      .replace(/\n/g, '<br><br>')
      console.log('history', JSON.stringify(this.history))
    })
  }
}

//TODO consolidate with filter in inventory
export class dateValueConverter {
  toView(date){
    return date ? date.slice(2,10) : ''
  }
}

export class filterValueConverter {
  toView(transactions = [], filter = ''){
    filter = filter.toLowerCase()
    return transactions.filter(transaction => {
      return ~ `${transaction.to.name} ${transaction.tracking} ${transaction.status}`.toLowerCase().indexOf(filter)
    })
  }
}
