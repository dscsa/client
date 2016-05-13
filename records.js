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
    //this.months  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    this.months  = ['January','February','March','April','May','June','July','August','September','October','November','December']
    this.years   = [2016,2015,2014,2013,2012,2011,2010]
    this.year    = new Date().getYear()+1900
    this.month   = this.months[new Date().getMonth()]
    this.stati   = ['created', 'verified', 'destroyed']
  }

  activate(params) {
    //TODO only search for selected date {'captured_at':new Date(this.month+' 01 '+this.year)}
    //TODO search based on type, donation vs destruction
    //TODO this '.' is weird, only way I could get $gt to exclude the account._id. Maybe this is a bug in pouchdb-find.  Or maybe the . is not a good delimiter?
    return Promise.all([
      this.db.transactions({'shipment._id':{$lt:this.account._id}}),
      this.db.transactions({'shipment._id':{$gt:this.account._id+'.'}})
    ]).then(all => {
      this.transactions = [...all[0], ...all[1]]
      if ( ! this.transactions[0]) return
      let selected = this.transactions.filter(t => t._id === params.id)[0]
      return this.select(selected || this.transactions[0])
    })
  }

  searchRange() {
    let fromMonth = this.months.indexOf(this.fromMonth)
    let toMonth   = this.months.indexOf(this.toMonth)+1

    let fromDate = new Date(this.fromYear,fromMonth, 1)
    let toDate   = new Date(this.toYear,toMonth, 1)
    toDate.setDate(0) //reduce it by a day to get end of previous month

    //Just in case the user inverts the to & from dates.
    let from = fromDate < toDate ? fromDate : toDate
    let to   = fromDate > toDate ? fromDate : toDate
//[this.status+'At']:{$gte:from, $lte:to},
    this.db.transactions({'shipment._id':{$gt:this.account._id}})
    .then(transactions => {
      console.log('searchRange2', transactions.length, transactions)
    })
  }

  //Activated from constructor and each time a shipment is selected
  select(transaction) {
    this.transaction = transaction
    this.router.navigate('records/'+transaction._id, { trigger: false })
    this.http.get('//localhost:3000/transactions/'+transaction._id+'/history')
    .then(history => {
      //console.log('history', history.content)
      //TODO move this to /history?text=true. Other formatting options?
      function id(k,o) {
        //console.log(o, typeof o)
        if (Array.isArray(o))
          return o
        return o.shipment.from.name+' '+o._id
      }
      //console.log('history', JSON.stringify(history.content, id, "*"))
      function pad(word) {
        return (word+' '.repeat(25)).slice(0, 25)
      }
      this.history = JSON.stringify(
        history.content,
        (k,v) => {
          if (Array.isArray(v))
            return v

            let status = this.status || 'pickup' //Might not be initialized yet
            let date   = v.shipment[status + 'At'] || v.verifiedAt || '0000-00-00'
            let href   = '/#/shipments/'+v.shipment._id.split('.')[2]

            return pad('From: '+v.shipment.account.from.name)+pad('To: '+v.shipment.account.to.name)+"<a href='"+href+"'>"+v.type+" <i class='material-icons' style='font-size:12px; vertical-align:text-top; padding-top:1px'>exit_to_app</i></a><br>"+
                   pad(v.shipment.account.from.street)+pad(v.shipment.account.to.street)+status[0].toUpperCase()+status.slice(1)+' '+date.slice(2, 10)+'<br>'+
                   pad(v.shipment.account.from.city+', '+v.shipment.account.from.state+' '+v.shipment.account.from.zip)+pad(v.shipment.account.to.city+', '+v.shipment.account.to.state+' '+v.shipment.account.to.zip)+'Quantity '+(v.qty.to || v.qty.from)
        },
        "   "
      )
      .replace(/\[\n?\s*/g, "<div style='margin-top:-12px'>")
      .replace(/\n?\s*\],?/g, '</div>')
      .replace(/ *"/g, '')
      .replace(/\n/g, '<br><br>')
      //console.log('history', JSON.stringify(this.history))
    })
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

export class drugNameValueConverter {
  toView(transaction){
    return transaction.drug.generics.map(generic => generic.name+" "+generic.strength).join(', ')+' '+transaction.drug.form
  }
}
