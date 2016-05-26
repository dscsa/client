import {inject} from 'aurelia-framework'
import {Router} from 'aurelia-router'
import {Db}     from 'db/pouch'

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
        ordered.unshift({
          name:'Add a New Drug',
          drugs:[{generics:[{}]}]
        })
        this.quickSearch.ordered = ordered
      })

      if ( ! params.id) {
        return all.then(_ => {
          this.selectGroup(this.quickSearch.ordered[0], true)
        })
      }

      return this.db.drug.get({_id:params.id}).then(drugs => {
        this.selectDrug(drugs[0])
        return this.search().then(_ => {
          //Groups could contain this.term and other active ingredients, so filter for the exact match
          this.selectGroup(this.groups.filter(group => group.name == this.term)[0])
        })
      })
    })
  }

  selectGroup(group, autoselect) {
    this.group = group
    if (autoselect && group.drugs[0])
      this.selectDrug(group.drugs[0])
  }

  selectDrug(drug) {
    let url = drug._id ? 'drugs/'+drug._id : 'drugs'
    this.term = drug.generic = drug.form ? drug.generics.map(generic => generic.name+" "+generic.strength).join(', ')+' '+drug.form : ''
    this.router.navigate(url, { trigger: false })
    this.drug = drug
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
    let db    = this.db
    let data  = []
    let start = Date.now()

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
      step: function(results, parser) {
        let row = results.data[0]

        if ( ! row._id) {
          console.error('_id field is required', results); return
        }

        if ( ! row['generics.name']) {
          console.error('generics.name field is required', results); return
        }

        if ( ! row['generics.strength']) {
          console.error('generics.strength field is required', results); return
        }

        let drug = {
          names:row['generics.name'].split(';'),
          strengths:row['generics.strength'].split(';'),
          generics:[]
        }

        if (drug.names.length != drug.strengths.length) {
          console.error('generics.name/strength must contain the same number of semicolons', drug); return
        }

        for (let i in drug.names) //Collate the two fields into one
          drug.generics.push({name:drug.names[i].trim(), strength:drug.strengths[i].trim()})

        data.push({
          _id:row._id,
          generics:drug.generics,
          brand:row.brand,
          form:row.form,
          image:row.image,
          labeler:row.labeler
        })
      },

      complete: function(results, file) {
        console.log("Upload of ", data.length, "rows completed in ", Date.now() - start)
      	this.db.drug.bulkDocs(data)
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
    return this.db.account.put(this.account)
  }

  saveDrug() {
    delete this.drug.generic
    console.log('saving Drug', this.drug)
    if (this.drug._rev)
      this.db.drug.put(this.drug)
    else {
      this.db.drug.post(this.drug)
      .then(drug => { //TODO: move this to pouch.js?
        this.drug.ndc9      = drug.ndc9
        this.drug.upc       = drug.upc
        this.drug.price     = drug.price
        this.drug.createdAt = drug.createdAt
        this.selectDrug(this.drug)
      })
      .catch(err => this.snackbar.show(`Drug could not be added: ${err.reason.msg}`))
    }
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
