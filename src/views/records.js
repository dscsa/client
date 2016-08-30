//TODO
//Autofocus on new drug
//Disable From/To based on Filter's switch

import {inject}     from 'aurelia-framework';
import {Router}     from 'aurelia-router';
import {Db}         from '../libs/pouch'
import {HttpClient} from 'aurelia-http-client';
import {toggleDrawer} from '../resources/helpers'

//@pageState()
@inject(Db, Router, HttpClient)
export class records {

  constructor(db, router, http){
    this.db      = db
    this.router  = router
    this.http    = http
    this.history = ''
    this.days    = []
    this.scroll  = this.scroll.bind(this)
    this.toggleDrawer = toggleDrawer

    let today  = new Date();
    let start  = new Date(2016, 7, 1)

    while (today > start) {
      this.days.push(today.toJSON().slice(0, 10))
      today.setHours(-24)
    }
  }

  deactivate() {
    removeEventListener('keyup', this.scroll)
  }

  activate(params) {
    addEventListener('keyup', this.scroll)
    this.db.user.session.get().then(session => {
      this.account = session.account //this is not a full account, just an _id
      this.selectDay(params.id) //TODO save day in parameter for browser reloads
    })
  }

  selectDay(day, toggleDrawer) {
    this.day = day || this.days[0]
    this.router.navigate('records/'+this.day, { trigger: false })
    toggleDrawer && this.toggleDrawer()

    //Just in case the user inverts the to & from dates.
    // let from = fromDate <= toDate ? fromDate : toDate
    // let to   = fromDate > toDate ? fromDate : toDate
    let to = new Date(this.day)
    to.setHours(24*2)

    //Do not show inventory $eq, $lt, $gt,
    let query = {createdAt:{$gte:this.day, $lte:to.toJSON().slice(0, 10)}}

    return this.db.transaction.get(query).then(transactions => {
      this.transactions = transactions
      return this.selectTransaction()
    })
  }

  scroll($event) {
    let index = this.transactions.indexOf(this.transaction)
    let last  = this.transactions.length - 1

    if ($event.which == 38) //Keyup
      this.selectTransaction(this.transactions[index > 0 ? index - 1 : last])

    if ($event.which == 40) //keydown
      this.selectTransaction(this.transactions[index < last ? index+1 : 0])
  }
//this.http.get('//localhost:3000/transactions/'+transaction._id+'/history')
  //Activated from constructor and each time a transaction is selected
  selectTransaction(transaction) {
    this.transaction = transaction || this.transactions[0]

    if ( ! this.transaction) return

    this.db.transaction.get({_id:this.transaction._id}, {history:true})
    .then(history => {
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
        history.reverse(),
        (k,v) => {
          if (Array.isArray(v))
            return v

            let status = this.status || 'pickup' //Might not be initialized yet
            let href   = '/#/shipments/'+v.shipment._id

            return pad('From: '+v.shipment.account.from.name)+pad('To: '+v.shipment.account.to.name)+"<a href='"+href+"'>"+v.type+" <i class='material-icons' style='font-size:12px; vertical-align:text-top; padding-top:1px'>exit_to_app</i></a><br>"+
                   pad(v.shipment.account.from.street)+pad(v.shipment.account.to.street)+'Date '+v.createdAt.slice(2, 10)+'<br>'+
                   pad(v.shipment.account.from.city+', '+v.shipment.account.from.state+' '+v.shipment.account.from.zip)+pad(v.shipment.account.to.city+', '+v.shipment.account.to.state+' '+v.shipment.account.to.zip)+'Quantity '+(v.qty.to || v.qty.from)
        },
        "   "
      )
      .replace(/\[\n?\s*/g, "<div style='margin-top:-12px'>")
      .replace(/\n?\s*\],?/g, '</div>')
      .replace(/ *"/g, '')
      .replace(/\n/g, '<br><br>')
    })
  }

  exportCSV() {

  }
}
