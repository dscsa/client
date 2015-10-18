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
          groups[o.ndc].total += +o.qty.to || 0
          groups[o.ndc].sources.push(o)
        }
        else {
          groups[o.ndc] = {total:+o.qty.to || 0, sources:[o]}

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
  }

  //ValueConverter wasn't picking up on changes so trigger manually
  //For some reason input[type=number] doesn't save as a number
  //not sure if this is an html of aurelia bug
  input() {
    this.group.total = this.group.sources.reduce((a,b) => {
      return a + (+b.qty.to || 0)
    }, 0)
  }

  add(transaction) {
    this.search = null
    this.drugs.add(transaction, {from:{}}).then(_ => {
      console.log('adding')
      this.activate()
    })
    .catch(console.log)
  }

  repackage() {
    //Since we don't know which facility right now, just use the first one
    this.db.shipments({_id:this.group.sources[0]}).then(shipments => {

      let repacked = {history:{name:shipments.pop().to.name, ids:[], qtys:[]}, qty:{from:0, to:0}}
      repacked = Object.assign({}, this.group.sources[0], repacked)

      //Go backwards since we are deleting array vals as we go
      for (let i = this.group.sources.length - 1; i >= 0; i--) {

        let source = this.group.sources[i]

        if ( ! source.qty.to && ! source.qty.from)
          continue

        repacked.qty.from += +source.qty.from
        repacked.qty.to   += +source.qty.to

        if (Date(repacked.exp.from) > Date(source.exp.from))
          repacked.exp.from = source.exp.from

        if (Date(repacked.exp.to) > Date(source.exp.to))
          repacked.exp.to = source.exp.to

        //TODO add overlapping elements rather than repeating
        if (source.history.ids) {
          repacked.history.ids.push(...source.history.ids)
          repacked.history.qtys.push(...source.history.qtys)
        }

        this.group.sources.splice(i, 1)
        this.db.transactions.remove(source)
      }

      this.group.sources.unshift(repacked)
      this.db.transactions.post(repacked)
    })
  }
}
