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
    let search = this.db.search.then(_ => this.searchReady = true)

    if ( ! params.id)
      return

    let drug = this.db.drugs({_id:params.id})
    .then(drugs => {
      drugs[0].generic = drugs[0].generics.map(generic => generic.name+" "+generic.strength).join(', ')
      this.selectDrug(drugs[0])
    })

    Promise.all([drug, search]).then(all => {
      this.search()
      let groups  = this.groups.filter(group => group.name == this.term)
      this.selectGroup(groups[0])
    })
  }

  selectGroup(group, autoselect) {
    console.log('selectGroup', group.name)
    this.group = group

    if (autoselect)
      this.selectDrug(group.drugs[0])
  }

  selectDrug(drug) {
    let url        = drug._id ? 'drugs/'+drug._id : 'drugs'
    this.term = drug.generic+' '+drug.form
    this.router.navigate(url, { trigger: false })
    this.drug      = drug
    this.drug.pkgs = [{code:'', size:''}]
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

  importCSV() {
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

  addGeneric() {
    this.drug.generics.push('')
    return true
  }

  removeGeneric() {
    this.drug.generics.pop()
    return true
  }

  addPkgSize() {
    this.drug.pkgs.push({code:'', size:''})
    return true
  }

  removePkgSize() {
    this.drug.pkgs.pop()
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
    //console.log('filter run', regex)
    if ( ! drug.generics[0])
      return

    let generic = drug.generics.map(generic => generic.name+" "+generic.strength).join(', ')
    return generic.replace(regex, '<strong>$1</strong>') + (drug.brand ? ' ('+drug.brand+')' : '')
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
