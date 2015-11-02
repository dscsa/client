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
    this.db.drugs().then(drugs => {
      this.drugs = drugs
      this.add()
      this.select(this.drugs.filter(drug => drug._id === params.id)[0] || this.drugs[0])
    })
  }

  select(drug) {
    let url = drug._id ? 'drugs/'+drug._id : 'drugs'
    this.router.navigate(url, { trigger: false })
    this.drug  = drug
  }

  add() {
    this.drugs.unshift({
      name:'',
      strength:'',
      form:'',
      brand:'',
      image:'',
      labeler:'',
      ndc:''
    })
    this.drugs = this.drugs.slice() //Aurelia hack to reactivate the filter
  }

  create() {
    if ( ! confirm('Are you sure that you want to add this new drug?'))
      return
    console.log('adding', this.drug)
    return this.db.drugs.post(this.drug).then(drug => {
      this.add()
      this.drug._id = drug._id
      this.drug._rev = drug._rev
    })
  }

  save($event, $this) {
    //Do not save if clicking around within the same/new drug.
    if ( ! this.drug._id || $this.contains($event.relatedTarget))
      return

    console.log('saving', this.drug)
    return this.db.drugs.put(this.drug)
  }
}

//TODO make this work with added items
export class filterValueConverter {
  toView(drugs = [], filter = ''){
    filter = filter.toLowerCase()
    return drugs.filter(drug => {
      return ~ `${drug.name} ${drug.strength} ${drug.form} ${drug.ndc}`.toLowerCase().indexOf(filter)
    })
  }
}
