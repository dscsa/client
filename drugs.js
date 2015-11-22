import {inject} from 'aurelia-framework'
import {Router} from 'aurelia-router'
import {Db}     from 'db/pouch'

//@pageState()
@inject(Db, Router)
export class drugs {
  //constructor(HttpClient = 'aurelia-http-client', Db = './pouch'){
  constructor(db, router){
    this.db = db
    this.router = router
  }

  activate(params) {
    return this.db.drugs().then(drugs => {
      console.log(drugs)
      this.drugs = drugs
      this.select(params.id ? this.drugs.filter(drug => drug._id === params.id)[0] : this.drugs[0])
    })
  }

  select(drug) {
    //console.log('selecting drug', drug)
    let url  = drug._id ? 'drugs/'+drug._id : 'drugs'
    this.router.navigate(url, { trigger: false })
    this.drug  = drug
  }

  add() {
    this.drugs.unshift({
      _id:'',
      name:'',
      strength:'',
      form:'',
      brand:'',
      image:'',
      labeler:'',
    })
    this.drug  = this.drugs[0]
    this.drugs = this.drugs.slice() //Aurelia hack to reactivate the filter
  }

  save($event, $this) {
    //Do not save if clicking around within the same/new drug.
    if ( ! this.drug._id || $this.contains($event.relatedTarget))
      return

    console.log('saving', this.drug)
    return this.db.drugs.put(this.drug).then(drug => {
      if (this.drug._id) return
      this.drug._id = drug._id
      this.add()
    })
  }
}

export class priceValueConverter {
  toView(price){
    //I think couchdb is doing something weird, sometimes/unpredictably converting numbers to strings
    return price && '$'+(+price).toFixed(2)
  }
}

//TODO make this work with added items
export class filterValueConverter {
  toView(drugs = [], filter = ''){
    filter = filter.toLowerCase()
    return drugs.filter(drug => {
      return ~ `${drug.name} ${drug.strength} ${drug.form} ${drug._id}`.toLowerCase().indexOf(filter)
    })
  }
}
