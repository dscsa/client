import {inject} from 'aurelia-framework'
import {Router} from 'aurelia-router'
import {Db}     from 'libs/pouch'

//@pageState()
@inject(Db, Router)
export class drugs {
  //constructor(HttpClient = 'aurelia-http-client', Db = './pouch'){
  constructor(db, router){

    this.db      = db
    this.router  = router
    this.drugs   = []
  }

  activate(params) {
    return this.db.user.session.get()
    .then(session => {
      return this.db.account.get({_id:session.account._id})
    })
    .then(accounts => {

      this.account     = accounts[0]
      this.quickSearch = {}

      let all = Object.keys(this.account.ordered).map(generic => this.db.drug.get({generic})
      .then(drugs => {
        return {
          name:generic,
          drugs:drugs.filter(drug => drug.generic == generic)
        }
      }))

      all = Promise.all(all).then(ordered => {
        this.quickSearch.ordered = ordered
        this.addEmptyDrug()
      })

      if ( ! params.id) {
        return all.then(_ => {
          this.selectGroup(this.quickSearch.ordered[0], true)
        })
      }

      return this.db.drug.get({_id:params.id}).then(drugs => {
        this.selectDrug(drugs[0], true)
      })
    })
  }

  addEmptyDrug() {
    this.quickSearch.ordered.unshift({
      name:'Add a New Drug',
      drugs:[{generics:[{}]}]
    })
  }

  selectGroup(group, autoselectDrug) {

    group = group || this.search().then(_ => this.groups[0])

    Promise.resolve(group).then(group => {
      this.group = group
      if (autoselectDrug)
        this.selectDrug(group.drugs[0])
    })
  }

  selectDrug(drug, autoselectGroup) {

    if ( ! drug.generic && drug.form) //new drug won't have drug.form yet
      drug.generic = drug.generics.map(generic => generic.name+" "+generic.strength).join(', ')+' '+drug.form

    this.drug = drug
    this.term = drug.generic

    let url = drug._id ? 'drugs/'+drug._id : 'drugs'
    this.router.navigate(url, { trigger: false })

    if (autoselectGroup)
      this.selectGroup()
  }

  search() {
    let term = this.term.trim()

    if (term.length < 3)
      return this.groups = []

    if (/^[\d-]+$/.test(term)) {
      this.regex = RegExp('('+term+')', 'gi')
      var drugs = this.db.drug.get({ndc:term})
    } else {
      this.regex = RegExp('('+term.replace(/ /g, '|')+')', 'gi')
      var drugs = this.db.drug.get({generic:term})
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
    if (this.account.ordered[this.group.name]) {
      this.quickSearch.ordered = this.quickSearch.ordered.filter(group => {
        return group.name != this.group.name
      })

      this.account.ordered[this.group.name] = undefined
    } else {
      console.log('order')
      //Add New Order but Keep Add New Item on Top
      this.quickSearch.ordered.splice(1, 0, this.group)
      this.account.ordered[this.group.name] = {}
    }

    this.saveOrder()
    //return true
  }

  importCSV() {
    let $this = this
    let data  = []
    let start = Date.now()
    this.snackbar.show(`Parsing CSV File`)

    function capitalize(txt) {
      return txt ? txt.replace(/\w+/g, txt => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()) : ''
    }

    Papa.parse(this.$file.files[0], {
      header:true,
      //worker:true,
      // step: function(results, parser) {
      //   let row = results.data[0]
      //
      //   if ( ! row.rxstring || ! row.spl_strength || ! row.product_code)
      //     return
      //
      //   let brand = row.rxstring.split(' [')
      // 	data.push({
      //     _id:row.product_code,
      //     generics:capitalize(row.spl_strength.slice(0, -1)).split(';').map(v => {
      //       v = v.split(' ')
      //       return {name:v.slice(0, -2).join(' '), strength:v.slice(-2).join(' ')}
      //     }),
      //     brand: brand.length > 1 ? capitalize(row.medicine_name) : '',
      //     form:brand[0].split(' ').slice(-2).join(' '),
      //     ndc9:row.ndc9,
      //     upc:row.product_code.replace('-', ''),
      //     image:row.splimage ? "http://pillbox.nlm.nih.gov/assets/large/"+row.splimage+".jpg" : null,
      //     labeler:capitalize(row.author.split(/,|\.| LLC| Inc| \(| USA| -|limit/)[0]),
      //     pkgs:[]
      //   })
      // },
      step(results, parser) {
        let row = results.data[0]

        if ( ! row._id) {
          console.error('_id field is required', results); return
        }

        if ( ! row['generics']) {
          console.error('generics field is required', results); return
        }

        let generics = row['generics'].split(";").filter(v => v).map(generic => {
          let [name, strength] = generic.split(/(?= [\d.]+)/)
          console.log(generic, generic.split(/(?= [\d.]+)/), arguments)
          return {
            name:name.trim().toLowerCase().replace(/\b[a-z]/g, l => l.toUpperCase()),
            strength:strength.trim().toLowerCase()
          }
        })

        data.push({
          _id:row._id,
          generics:generics,
          brand:row.brand,
          form:row.form,
          image:row.image,
          labeler:row.labeler
        })
      },

      complete(results, file) {
        $this.snackbar.show(`Parsed ${data.length} rows. Uploading to server`)
      	$this.db.drug.post(data).then(_ => $this.snackbar.show(`CSV import completed in ${Date.now() - start}ms`))
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
    return this.db.account.put(this.account)
  }

  addDrug() {
    delete this.drug.generic
    this.db.drug.post(this.drug)
    .then(res => {
      //Even though new drug is listed as "ordered" it is not by default, so don't show it in the list
      this.quickSearch.ordered.splice(0, 1)
      this.addEmptyDrug()
      //Wait for the server POST to replicate back to client
      setTimeout(_ => this.selectDrug(this.drug, true), 100)
    })
    .catch(err => this.snackbar.show(`Drug not added: ${err.name}`))
  }

  saveDrug() {
    delete this.drug.generic
    this.db.drug.put(this.drug)
    .catch(err => this.snackbar.show(`Drug not saved: ${err.name}`))
  }

  deleteDrug() {
    console.log('TO BE IMPLEMENETED')
  }
}

export class jsonValueConverter {
  toView(object = null){
    return JSON.stringify(object, null, " ")
  }
}

export class numberValueConverter {
  fromView(str, decimals){
    //Match servers transaction.js default: Empty string -> null, string -> number, number -> number (including 0)
    return str != null && str !== '' ? +str : null
  }

  toView(str, decimals){
    //Match servers transaction.js default: Empty string -> null, string -> number, number -> number (including 0)
    return str != null && decimals ? (+str).toFixed(decimals) : str
  }
}
