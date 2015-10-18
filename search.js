import {inject} from 'aurelia-framework';
import {Db} from 'db/pouch'

let db

//Wanted to make this.shipment have get and sets for the properties.  However that
//was causing dirty checking and computedFrom doesn't allow setters https://github.com/aurelia/binding/issues/136
@inject(Db)
export class drugs {

  constructor(Db){
    db = Db
  }

  //TODO Do we query PouchDB everytime or query once and filter the results?
  //Right now PouchDB-Find doesn't have $regex or $text so we must resort to query()
  search(now, old) {
    return db.drugs.query(`function(doc) {
        if ( ~ doc.name.indexOf('${now}'))
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
      ndc:drug.ndc,
      nadac:drug.nadac,
      qty:{from:null, to:null},
      lot:{from:null, to:null},
      exp:{from:null, to:null}
    }

    return db.transactions.post(transaction)
  }

  save(drug, $event, $this) {
    //Do not save if clicking around within the same drug.
    //TODO only save if change occured
    if ($this.contains($event.relatedTarget))
      return

    console.log('saving', drug)
    return db.transactions.put(drug)
  }
}
