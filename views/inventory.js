import {inject} from 'aurelia-framework';
import {Db}     from 'libs/pouch'
import {Router} from 'aurelia-router';

@inject(Db, Router)
export class inventory {

  constructor(db, router){
    this.db      = db
    this.session =
    this.router  = router
  }

  activate(params) {
    return this.db.user.session.get().then(session => {
      return this.db.transaction.get({'shipment._id':session.account._id})
    })
    .then(transactions => {
      this.groups = {}

      for (let t of transactions) {
        if (this.groups[t.drug._id]) {
          this.groups[t.drug._id].total += +t.qty.from || 0
          this.groups[t.drug._id].sources.push(t)
        }
        else {
          this.groups[t.drug._id] = {total:+t.qty.from || 0, sources:[t]}
          this.db.drug.get({_id:t.drug._id})
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
    this.mode = ! this.mode
    this.repack = this.group.sources.map(s => s.qty.from)
    this.sumRepack()
    return true
  }

  //ValueConverter wasn't picking up on changes so trigger manually
  //For some reason input[type=number] doesn't save as a number
  //not sure if this is an html of aurelia bug
  sumGroup() {
    this.group.total = this.group.sources.reduce((a,b) => a + (+b.qty.from || 0), 0)
  }

  sumRepack() {
    this.repack.total = this.repack.reduce((a,b) => (+a)+(+b), 0)
  }

  saveTransaction(transaction) {
    console.log('saving', transaction)
    this.db.transaction.put(transaction)
    .catch(e => this.snackbar.show({
       message: `Transaction with exp ${transaction.exp[this.role.account]} and qty ${transaction.qty[this.role.account]} could not be saved`,
     }))
  }

//TODO don't bind when repacking so that you can skip and change things to get to 30
//Skip over and dont delete items that have a repack quantity of 0
  repackage() {
    let all   = []
    let exp   = null
    let trans = {
      _id:undefined,
      _rev:undefined,
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
        this.group.sources.splice(i, 1) //assume delete is successful
        all.push(this.db.transaction.delete(src))
      } else { //cannot take partial quantity from repackaged drug, so history must have length <= 1
        if (src.history.length == 1) {
          let [{transaction}] = src.history
          trans.history.push({transaction, qty})
        }
        src.qty.from -= qty
        all.push(this.db.transaction.put(src))
      }

      if (src.exp.from)
        trans.exp.from = Math.min(trans.exp.from, new Date(src.exp.from))
    }

    trans.exp.from = new Date(trans.exp.from).toJSON()

    //assume add is successful.  TODO fallback code on failure
    this.group.sources.unshift(trans)
    this.mode = false

    return this.db.transaction.post(trans).then(_ => Promise.all(all))
  }
}

//TODO combine with the shipment filter with the same code
export class dateValueConverter {

  toView(date) {
    if ( ! date ) return ''
    return date != this.model ? date.slice(5,7)+'/'+date.slice(2,4) : this.view
  }

  fromView(date){
    this.view  = date

    let [month, year] = date.split('/')
    date = new Date('20'+year,month, 1)
    date.setDate(0)

    return this.model = date.toJSON()
  }
}

export class numberValueConverter {
  fromView(str){
    return +str
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
    return transaction.drug.generics.map(generic => generic.name+" "+generic.strength).join(', ')+' '+transaction.drug.form
  }
}
