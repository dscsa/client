//TODO
//Autofocus on new drug
//Disable From/To based on Filter's switch

import {inject}     from 'aurelia-framework';
import {Router}     from 'aurelia-router';
import {Db}         from '../libs/pouch'
import {HttpClient} from 'aurelia-http-client';
import {canActivate, toggleDrawer} from '../resources/helpers'

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
    this.canActivate = canActivate
    this.recordTypes = [
      {label:'Received', value:'received'},
      {label:'Accepted', value:'verified'},
      {label:'Dispensed', value:'dispensed'},
      {label:'Disposed', value:'disposed'}
    ]
  }

  deactivate() {
    removeEventListener('keyup', this.scroll)
  }

  activate(params) {
    addEventListener('keyup', this.scroll)
    return this.db.user.session.get().then(session => {
      this.account = session.account //this is not a full account, just an _id
      let opts = {group_level:3, startkey:[this.account._id], endkey:[this.account._id, {}]}
      return Promise.all([
        this.db.transaction.query('count', opts),
        this.db.transaction.query('rxs', opts),
        this.db.transaction.query('value', opts)
      ])
      .then(all => this.months = this.collate(all, true))
    })
  }

  collate([count, rxs, value], reverse) {
    let arr = count.rows.map((count, i) => {
      return {
        date:count.key.slice(1).join('-'),
        key:count.key,
        count:count.value,
        rxs:rxs.rows[i].value,
        value:value.rows[i].value
      }
    })
    console.log('collate', arr)
    return reverse ? arr.reverse() : arr
  }

  selectMonth(month) {
    this.month = month
    let opts = {group_level:4, startkey:month.key, endkey:month.key.concat({})}
    return Promise.all([
      this.db.transaction.query('count', opts),
      this.db.transaction.query('rxs', opts),
      this.db.transaction.query('value', opts)
    ])
    .then(all => this.days = this.collate(all))
  }

  selectDay(date, $event) {
    this.month = null
    this.days = []

    if ($event) {
      this.toggleDrawer()
      $event.stopPropagation() //prevent select month from firing
    }

    //Just in case the user inverts the to & from dates.
    // let from = fromDate <= toDate ? fromDate : toDate
    // let to   = fromDate > toDate ? fromDate : toDate
    let to = new Date(date)
    to.setHours(24*2)

    //Do not show inventory $eq, $lt, $gt,
    let opts = {
      startkey:[this.account._id, date],
      endkey:[this.account._id, to.toJSON().slice(0, 10)],
      include_docs:true
    }

    this.db.transaction.query('createdAt', opts).then(transactions => {
      this.transactions = transactions.rows.map(row => row.doc)
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

  //Activated from constructor and each time a transaction is selected
  selectTransaction(transaction) {
    this.transaction = transaction || this.transactions[0]

    if ( ! this.transaction) return

    this.db.transaction.history.get(this.transaction._id)
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
                   pad(v.shipment.account.from.street)+pad(v.shipment.account.to.street)+'Date '+v._id.slice(2, 10)+'<br>'+
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
