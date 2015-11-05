import {inject} from 'aurelia-framework';
import {Db} from 'db/pouch'

@inject(Db)
export class drugs {

  constructor(Db){
    this.db = Db
  }

  //TODO change to PouchDB-Find $regex or $text once available
  search(now, old) {
    return this.db.drugs.query(`function(doc) {
        if ( ~ doc.name.toLowerCase().indexOf('${ (now || '').toLowerCase()}'))
          emit(true)
    }`)
  }

  add(drug, shipment) {
    let transaction = {
      drug:drug._id,
      shipment:shipment._id, //if undefined server will assume inventory and put account_id here.
      name:drug.name,
      strength:drug.strength,
      form:drug.form,
      retail:drug.retail,
      wholesale:drug.wholesale,
      qty:{from:null, to:null},
      lot:{from:null, to:null},
      exp:{from:null, to:null}
    }

    return this.db.transactions.post(transaction)
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
