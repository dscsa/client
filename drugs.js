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
    this.drug   = {generics:[''], pkgs:[{code:'', size:''}]}
  }

  activate(params) {
    params.id && this.select(params.id)
  }

  select(drug) {
    //console.log('selecting drug', drug)
    let url        = drug._id ? 'drugs/'+drug._id : 'drugs'
    this.router.navigate(url, { trigger: false })
    this.drug      = drug
    this.drug.pkgs = [{code:'', size:''}]
    console.log('this.drug', this.drug)

  }

  search() {

    let drugs, term = this.term.replace(this.drug.form, '').toLowerCase()
    console.log('searching for...', term)
    if (term.length < 3)
      return this.groups = []

    if (/^[\d-]+$/.test(term)) {
      this.regex  = RegExp('('+term+')', 'gi')
      drugs  = this.db.search.ndc(term)

    } else {
      this.regex  = RegExp('('+term.replace(/ /g, '|')+')', 'gi')
      drugs  = this.db.search.generic(term)
    }

    let groups = {}
    for (let drug of drugs) {
      let name = drug.generic+' '+drug.form
      groups[name]
        ? groups[name].drugs.push(drug)
        : groups[name] = {name, drugs:[drug]}
    }

    this.groups = Object.values(groups)
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
          generics:capitalize(row.spl_strength.slice(0, -1)).split(';').map(v => {
            v = v.split(' ')
            return {name:v.slice(0, -2).join(' '), strength:v.slice(-2).join(' ')}
          }),
          brand: brand.length > 1 ? capitalize(row.medicine_name) : '',
          form:brand[0].split(' ').slice(-2).join(' '),
          ndc9:row.ndc9,
          upc:row.product_code.replace('-', ''),
          image:row.splimage ? "http://pillbox.nlm.nih.gov/assets/large/"+row.splimage+".jpg" : null,
          labeler:capitalize(row.author.split(/,|\.| LLC| Inc| \(| USA| -|limit/)[0]),
          pkgs:[]
        })
      },
      complete: function(results, file) {
        console.log("Upload of ", data.length, "rows completed in ", Date.now() - start)
      	db.drugs.bulkDocs(data)
        .then(_ => console.log(Date.now() - start, _))
      }
    })
  }

  genericName() {
    console.log('modifying name')
    this.drug.generics[this.drug.generics.length-1]
      ? this.drug.generics.push('')
      : this.drug.generics.pop()

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

export class drugNameValueConverter {
  toView(drug, regex){
    if ( ! drug.generics[0])
      return

    let name = drug.generics.map(generic => generic.name+" "+generic.strength).join(', ')
    return name.replace(regex, '<strong>$1</strong>') + (drug.brand ? ' ('+drug.brand+')' : '')
    console.log('filter run')
  }
}

// return this.db.drugs.query('drug/search', {startkey:[term[0]], endkey:[term[0]+'\ufff0']})
// .then(drugs => {
//   console.log('before filter', Date.now() - start)
//
//   if (term[1]) {
//     term[1] = RegExp(term[1])
//     this.drugs = drugs.filter(drug => term[1].test(drug.key[1]))
//   }
//   else
//     this.drugs = drugs
//
//   console.log('after filter', Date.now() - start)
//   this.select(this.drugs[0].id)
// })
