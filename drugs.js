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
    this.drug   = {names:[''], pkgs:[{code:'', size:''}]}
  }

  activate(params) {
    params.id && this.select(params.id)
  }

  select(_id) {
    //console.log('selecting drug', drug)
    this.db.drugs({_id})
    .then(drugs => {
      let url  = drugs[0]._id ? 'drugs/'+drugs[0]._id : 'drugs'
      this.router.navigate(url, { trigger: false })
      this.drug  = drugs[0]
      this.drug.pkgs = [{code:'', size:''}]
      console.log('this.drug', this.drug)
    })
  }

  search($event) {
    if ($event.target.value.length < 4)
      return this.drugs = []

    console.log('searching for', $event.target.value)
    return this.db.drugs.query('drug/search', {key:$event.target.value.replace(/-/g, '').toLowerCase()})
    .then(drugs => {
      console.log('drugs', drugs)
      this.drugs = drugs
      this.select(this.drugs[0].id)
    })
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

  drugName() {
    console.log('modifying name')
    this.drug.names[this.drug.names.length-1]
      ? this.drug.names.push('')
      : this.drug.names.pop()

    return true
  }

  drugPkg() {
    console.log('modifying pkg')
    let i = this.drug.pkgs.length-1
    this.drug.pkgs[i].code && this.drug.pkgs[i].size
      ? this.drug.pkgs.push({code:'', size:''})
      : this.drug.pkgs.pop()

    return true
  }

  save($event, form) {
    //Do not save if clicking around within the same/new drug.
    if (this.drug._rev ? form.contains($event.relatedTarget) : $event)
      return
    console.log('saving', this.drug)
    return this.db.drugs.put(this.drug)
  }

  delete() {
    console.log('TO BE IMPLEMENETED')
  }
}
