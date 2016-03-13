//TODO
//Autofocus on new drug
import {inject} from 'aurelia-framework';
import {Db}     from 'db/pouch'
import {Router}     from 'aurelia-router';

@inject(Db, Router)
export class inventory {

  constructor(db, router){
    this.db      = db
    this.session = db.users(true).session()
    this.router  = router
  }

  activate(params) {
    return this.db.transactions({'shipment._id':this.session.account._id})
    .then(transactions => {
      console.log('transactions', transactions)
      this.groups = {}

      for (let t of transactions) {
        if (this.groups[t.drug._id]) {
          this.groups[t.drug._id].total += +t.qty.from || 0
          this.groups[t.drug._id].sources.push(t)
        }
        else {
          this.groups[t.drug._id] = {total:+t.qty.from || 0, sources:[t]}
          this.db.drugs({_id:t.drug._id})
          .then(drugs => this.groups[t.drug._id].image = drugs[0].image)
        }
      }
      this.select(this.groups[params.id] || Object.values(this.groups)[0])
    })
    .catch(console.log)
  }

  select(group) {
    //Update URL with lifecycle methods so we can come back to this shipment
    if (group) {
      this.group = group
      this.router.navigate('inventory/'+group.sources[0].drug._id , { trigger: false })
    }
    else {
      this.group = {sources:[]}
    }
    this.mode = false
  }

  toggleRepack() {
    this.repack = this.group.sources.map(s => s.qty.from)
    return true
  }

  //ValueConverter wasn't picking up on changes so trigger manually
  //For some reason input[type=number] doesn't save as a number
  //not sure if this is an html of aurelia bug
  input() {
    this.group.total = this.group.sources.reduce((a,b) => {
      return a + (+b.qty.from || 0)
    }, 0)
  }

  saveTransaction(transaction) {
    console.log('saving', transaction)
    this.db.transactions.put(transaction)
    .catch(e => this.snackbar.show({
       message: `Transaction with exp ${transaction.exp[this.role.account]} and qty ${transaction.qty[this.role.account]} could not be saved`,
     }))
  }

//TODO don't bind when repacking so that you can skip and change things to get to 30
//Skip over and dont delete items that have a repack quantity of 0
  repackage() {

    let exp   = null
    let trans = {
      qty:{from:0, to:0},
      lot:{from:null, to:null},
      exp:{from:Infinity, to:Infinity}, //JSON.stringify will convert these to null if neccessary
      history:[]
    }

    trans = Object.assign({}, this.group.sources[0], trans)
    //Go backwards since we are deleting array vals as we go
    for (let i=this.repack.length-1; i>=0; i--) {
      let qty = +this.repack[i]
      let src = this.group.sources[i]

      //Falsey quantity such as null, "", or 0 should mean skip this source
      //Do not allow items to be repackaged a 2nd time with a partial quantity
      //because we don't know by how much to reduce each of the original qtys
      if ( ! qty || (src.qty.from != qty && src.history.length >1))
        continue

      trans.qty.from += qty

      if (src.qty.from == qty) {
        trans.history.push(...src.history)
        this.db.transactions.remove(src)
        .then(_ => this.group.sources.splice(i, 1))
      } else { //history must have length <= 1
        if (src.history.length == 1) {
          let [{transaction}] = src.history
          trans.history.push({transaction, qty})
        }
        src.qty.from -= qty
        this.db.transactions.put(src)
      }

      if ( ! src.exp.from) continue //We are done unless we have an expiration date

      let [m,y] = src.exp.from.split('/')
      trans.exp.from = new Date(Math.min(trans.exp.from, new Date('20'+y, m-1))) //month is indexed to 0
    }
    console.log(trans.exp.from, typeof trans.exp.from)
    //trans.exp.from = trans.exp.from && new Date(trans.exp.from).toJSON()
    return this.db.transactions.post(trans)
    .then(trans => {
      this.mode = false
      this.group.sources.push(trans)
    })
  }
}

export class dateValueConverter {
  toView(date = ''){
    if (typeof date != 'string' || date.length != 24)
      return date

    let result = date.slice(5, 7)+'/'+date.slice(2,4)
    console.log('toView', date, result)
    return result
  }
}

//ADDED step of converting object to array
export class filterValueConverter {
  toView(transactions = {}, filter = ''){
    filter = filter.toLowerCase()
    return Object.values(transactions).filter(transaction => {
      return ~ `${transaction.sources[0].name} ${transaction.sources[0].strength} ${transaction.sources[0].form} ${transaction.sources[0].drug}`.toLowerCase().indexOf(filter)
    })
  }
}

export class drugNameValueConverter {
  toView(transaction){
    console.log('transaction', transaction)
    return transaction.drug.generics.map(generic => generic.name+" "+generic.strength).join(', ')+' '+transaction.drug.form
  }
}
