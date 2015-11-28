import {inject} from 'aurelia-framework'
import {Router} from 'aurelia-router'
import {Db}     from 'db/pouch'

//@pageState()
@inject(Db, Router)
export class drugs {
  //constructor(HttpClient = 'aurelia-http-client', Db = './pouch'){
  constructor(db, router){
    this.db     = db
    this.router = router
    this.drugs  = []
    this.drug   = {names:['']}
  }

  activate(params) {
    if (params.id)
      this.select(params.id)
  }

  select(_id) {
    //console.log('selecting drug', drug)
    this.db.drugs({_id})
    .then(drugs => {
      let url  = drugs[0]._id ? 'drugs/'+drugs[0]._id : 'drugs'
      this.router.navigate(url, { trigger: false })
      this.drug  = drugs[0]
      console.log('this.drug', this.drug)
    })
  }

  search($event) {
    if ($event.target.value.length < 4)
      return

    console.log('searching for', $event.target.value)
    return this.db.drugs.query('drug/search', {key:$event.target.value})
    .then(drugs => {
      console.log('drugs', drugs)
      this.drugs = drugs
      //this.select(params.id ? this.drugs.filter(drug => drug._id === params.id)[0] : this.drugs[0])
    })
    console.log()
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

  import() {
    let db    = this.db
    let data  = []
    let start = Date.now()

    function capitalize(txt) {
      return txt ? txt.replace(/\w+/g, txt => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()) : ''
    }

    Papa.parse(this.$file.files[0], {
      header:true,
      //worker:true,
      step: function(results, parser) {
        let row = results.data[0]

        if ( ! row.rxstring || ! row.spl_strength || ! row.product_code)
          return

        let brand = row.rxstring.split(' [')
      	data.push({
          _id:row.product_code,
          names:capitalize(row.spl_strength.slice(0, -1)).split(';'),
          brand: brand.length > 1 ? capitalize(row.medicine_name) : '',
          form:brand[0].split(' ').slice(-2).join(' '),
          ndc9:row.ndc9,
          upc:row.product_code.replace('-', ''),
          image:row.splimage ? "http://pillbox.nlm.nih.gov/assets/large/"+row.splimage+".jpg" : null,
          labeler:capitalize(row.author.split(/,|\.| LLC| Inc| \(| USA| -|limit/)[0])
        })
      },
      complete: function(results, file) {
        console.log(Date.now() - start)
      	db.drugs.bulkDocs(data)
        .then(_ => console.log(Date.now() - start, _))
      }
    })
  }

  save($event, $this) {
    console.log('$this', form)
    //Do not save if clicking around within the same/new drug.
    if ( ! this.drug._id || form.contains($event.relatedTarget))
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
