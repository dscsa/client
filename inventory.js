//TODO
//Autofocus on new drug
import {inject} from 'aurelia-framework';
import {Db}     from 'db/pouch'
import {drugs}  from 'search'
import {Router}     from 'aurelia-router';


@inject(Db, drugs, Router)
export class inventory {

  constructor(db, drugs, router){
    this.db      = db
    this.session = db.users(true).session()
    this.drugs   = drugs
    this.router  = router
  }

  activate(params) {
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
      this.groups     = Object.values(groups)
      this.select(groups[params.id] || this.groups[0])
    })
    .catch(console.log)
  }

  select(group) {
    //Update URL with lifecycle methods so we can come back to this shipment
    if (group) {
      this.group = group
      this.router.navigate('inventory/'+group.sources[0].ndc , { trigger: false })
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

    let exp = null
    let transaction = {
      qty:{from:0, to:0},
      lot:{from:null, to:null},
      exp:{from:null, to:null},
      history:[]
    }

    transaction = Object.assign({}, this.group.sources[0], transaction)
    //Go backwards since we are deleting array vals as we go
    for (let i=this.repack.length-1; i>=0; i--) {
      let qty = +this.repack[i]
      if ( ! qty) continue
      transaction.qty.from += qty
      let source = this.group.sources[i]
      if (source.exp.from) {
        let [month, year] = source.exp.from.split('/')
        let date = new Date('20'+year, month-1) //month indexed to 0
        if ( ! transaction.exp.from || transaction.exp.from > date)
          transaction.exp.from = date
      }
      transaction.history.push(...source.history)
      this.db.transactions.remove(source)
      .then(_ => {
        this.group.sources.splice(i, 1)
      })
    }
    transaction.exp.from = transaction.exp.from.toJSON()
    return this.db.transactions.post(transaction)
    .then(_ => {
      this.mode = false
      this.group.sources.push(transaction)
    })
  }
}

export class dateValueConverter {
  toView(date){
    return ! date || date.length != 24 ? date : date.slice(5,7)+'/'+date.slice(2,4)
  }
}
