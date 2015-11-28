import {inject} from 'aurelia-framework';
import {Db} from 'db/pouch'

@inject(Db)
export class drugs {

  constructor(Db){
    this.db = Db
  }

  //TODO change to PouchDB-Find $regex or $text once available
  search(now, old) {
    if ( ! now || now.length < 4)
      return Promise.resolve([])

    let start = performance.now()
    //  console.log(this.db.drugs.toString())
    //TODO would a limit speep this up? now.length < 7 ? {limit:5} : {limit:50}
    return this.db.drugs.query('drug/search', {key:now.replace(/-/g, '').toLowerCase()})
    .then(drugs => {
      console.log('searching drugs', now, performance.now() - start)
      return drugs.reverse()
    })
  }

  add(_id, shipment) {
    return this.db.drugs({_id}).then(drugs => {
      let transaction = {
        drug:drugs[0]._id,
        shipment:shipment._id, //if undefined server will assume inventory and put account_id here.
        names:drugs[0].names,
        form:drugs[0].form,
        retail:drugs[0].retail,
        wholesale:drugs[0].wholesale,
        qty:{from:null, to:null},
        lot:{from:null, to:null},
        exp:{from:null, to:null}
      }
      console.log(drugs[0], transaction)
      return this.db.transactions.post(transaction)
    })
  }

  save(drug, $event, $this) {
    //Do not save if clicking around within the same drug.
    //TODO only save if change occured
    if ($this.contains($event.relatedTarget))
      return

    console.log('saving', drug)
    return this.db.transactions.put(drug)
  }
}
