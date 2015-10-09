import {inject} from 'aurelia-framework'
import {Router} from 'aurelia-router'
import {Db}  from 'db/pouch'
import pageState from 'config/page-state'

//@pageState()
@inject(Db, Router)
export class drugs {
  //constructor(HttpClient = 'aurelia-http-client', Db = './pouch'){
  constructor(db, router){
    this.db = db
    this.router = router
  }

  activate(params) {


    let _id = params.id ? 'drugs/'+params.id : undefined
    
    this.db.drugs().then(drugs => {
      this.drugs = drugs
      this.add()
      this.select(this.drugs.filter(drug => drug._id === _id)[0])
    })
  }

  select(drug) {

    this.drug  = drug

    this.router.navigate(drug._id || 'drugs', { trigger: false })
  }

  add() {
    this.drugs.unshift({
      name:'',
      strength:'',
      form:'',
      brand:'',
      image:'',
      labeler:'',
      ndc:'',
      price:''
    })
  }

  save($event, $this) {
    //Do not save if clicking around within the same donation.
    //TODO only save if change occured
    if ($this.contains($event.relatedTarget))
      return

    if (this.drug._id) {
      console.log('saving', this.drug)
      return this.db.drugs.put(this.drug)
    }

    if (this.drug.name && confirm('Are you sure that you want to add this new drug?')) {
      console.log('adding', this.drug)
      this.add()
      return this.db.drugs.post(this.drug)
    }
  }
}

//TODO make this work with added items
export class filterValueConverter {

  toView(drugs = [], filter = ''){

    filter = filter.toLowerCase()

    return drugs.filter(drug => {
      return ~ `${drug.name} ${drug.tracking} ${drug.status}`.toLowerCase().indexOf(filter)
    })
  }
}
