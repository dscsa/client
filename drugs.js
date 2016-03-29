import {inject} from 'aurelia-framework'
import {Router} from 'aurelia-router'
import {Db}     from 'db/pouch'

//@pageState()
@inject(Db, Router)
export class drugs {
  //constructor(HttpClient = 'aurelia-http-client', Db = './pouch'){
  constructor(db, router){
    let session = db.users().session()
    this.db      = db
    this.router  = router
    this.drugs   = []
    this.drug    = {generics:[''], pkgs:[{code:'', size:''}]}
    this.account = session.account
    this.loading = session.loading
  }

  activate(params) {

    if ( ! params.id)
      return

    this.db.drugs({_id:params.id}).then(drugs => {
      this.drug = drugs[0]

      //TODO this doesn't work for multiple drug names
      this.term = this.drug.generics.map(generic => generic.name+" "+generic.strength).join(', ')+' '+this.drug.form

      this.search().then(_ => {
        //Groups could contain this.term and other active ingredients, so filter for the exact match
        this.selectGroup(this.groups.filter(group => group.name == this.term)[0])
      })
    })
  }

  selectGroup(group, autoselect) {
    this.group = group
    if (autoselect)
      this.selectDrug(group.drugs[0])
  }

  selectDrug(drug) {
    let url = drug._id ? 'drugs/'+drug._id : 'drugs'
    this.term = drug.generic
    this.router.navigate(url, { trigger: false })
    this.drug      = drug
    this.drug.pkgs = [{code:'', size:''}]
  }

  search() {
    let term = this.term.trim()

    if (term.length < 3)
      return this.groups = []

    if (/^[\d-]+$/.test(term)) {
      this.regex = RegExp('('+term+')', 'gi')
      var drugs = this.db.drugs({ndc:term})
    } else {
      this.regex = RegExp('('+term.replace(/ /g, '|')+')', 'gi')
      var drugs = this.db.drugs({generic:term})
    }

    let groups = {}
    return drugs.then(drugs => {
      for (let drug of drugs) {
        groups[drug.generic] = groups[drug.generic] || {name:drug.generic, drugs:[]}
        groups[drug.generic].drugs.push(drug)
      }
      this.groups = Object.values(groups)
    })
  }

  //We might make a separate database and API out of this one day, but for now just save on account object.
  //TODO: Warn on delete since we won't save save any of the preferences?
  order() {
    this.account.ordered[this.group.name] = this.account.ordered[this.group.name] ? undefined : {}
    this.saveOrder()
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
    this.drug.generics.push({name:'', strength:''})
    this.saveDrug() //button doesn't trigger focusout -> save
    return true
  }

  removeGeneric() {
    this.drug.generics.pop()
    this.saveDrug() //button doesn't trigger focusout -> save
    return true
  }

  // addPkgSize() {
  //   this.drug.pkgs.push({code:'', size:''})
  //   return true
  // }
  //
  // removePkgSize() {
  //   this.drug.pkgs.pop()
  //   return true
  // }

  saveOrder() {
    console.log('saving Order', this.account)
    return this.db.accounts.put(this.account)
  }

  saveDrug() {
    console.log('saving Drug', this.drug)
    return this.db.drugs.put(this.drug)
  }

  delete() {
    console.log('TO BE IMPLEMENETED')
  }
}
