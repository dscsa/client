//TODO
//Autofocus on new drug
import {inject} from 'aurelia-framework';
import {Db}     from 'db/pouch'
import {drugs}  from 'search'

@inject(Db, drugs)
export class inventory {

  constructor(db, drugs){
    this.db      = db
    this.session = db.users(true).session()
    this.drugs   = drugs
  }

  activate() {
    return this.db.transactions({shipment:this.session.account._id})
    .then(transactions => {
      let groups = {}

      for (let o of transactions.reverse()) {
        if (groups[o.ndc]) {
          groups[o.ndc].total += +o.qty.from || 0
          groups[o.ndc].sources.push(o)
        }
        else {
          groups[o.ndc] = {total:+o.qty.from || 0, sources:[o]}

          this.db.drugs({_id:o.drug})
          .then(drugs => groups[o.ndc].image = drugs[0].image)
        }
      }
      this.groups = Object.keys(groups).map(group => groups[group])
      this.select(this.groups[0])
    })
    .catch(console.log)
  }

  select(group) {
    this.group = group || {sources:[]}
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

  add(transaction) {
    this.search = null
    this.drugs.add(transaction, {from:{}}).then(_ => {
      //Wait for the server POST to sync with PouchDB
      //TODO This is fragile. Is there a way to wait for sync to complete instead?
      setTimeout(this.activate.bind(this), 50)
    })
    .catch(console.log)
  }

//TODO don't bind when repacking so that you can skip and change things to get to 30
//Skip over and dont delete items that have a repack quantity of 0
  repackage() {

    let transaction = Object.assign({}, this.group.sources[0], {
      qty:{from:0, to:0},
      lot:{from:null, to:null},
      exp:{from:null, to:null},
      history:[]
    })

    let exp = null
console.log(this.group.sources, this.repack)
    //Go backwards since we are deleting array vals as we go
    for (let i=this.repack.length-1; i>=0; i--) {
      let qty = +this.repack[i]
      if ( ! qty) continue
      transaction.qty.from += qty
      let source = this.group.sources[i]
      console.log('i', i, this.repack[i], source)
      if (source.exp.from) {
        console.log(source.exp, typeof source.exp)
        let [month, year] = source.exp.from.split('/')
        let date = new Date('20'+year, month-1) //month indexed to 0
        if ( ! transaction.exp.from || transaction.exp.from > date)
          transaction.exp.from = date
      }
      transaction.history.push(...source.history)
      this.db.transactions.remove(source)
      this.group.sources.splice(i, 1)
    }
    transaction.exp.from = transaction.exp.from.toJSON()
    this.mode = false
    this.group.sources.push(transaction)
    return this.db.transactions.post(transaction)
  }
}

export class dateValueConverter {
  toView(date){
    return ! date || date.length != 24 ? date : date.slice(5,7)+'/'+date.slice(2,4)
  }
}
