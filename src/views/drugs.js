import {inject} from 'aurelia-framework'
import {Router} from 'aurelia-router'
import {Db}     from '../libs/pouch'
import {Csv}    from '../libs/csv'

//@pageState()
@inject(Db, Router)
export class drugs {
  //constructor(HttpClient = 'aurelia-http-client', Db = './pouch'){
  constructor(db, router){
    this.csv    = new Csv(['_id', 'generics', 'form'], ['brand', 'labeler', 'image'])
    this.db     = db
    this.router = router
    this.term   = ''
    this.scrollDrugs = this.scrollDrugs.bind(this)
  }

  deactivate() {
    removeEventListener('keyup', this.scrollDrugs)
  }

  activate(params) {
    addEventListener('keyup', this.scrollDrugs)
    return this.db.user.session.get()
    .then(session => {
      return this.db.account.get({_id:session.account._id})
    })
    .then(accounts => {
      this.account = accounts[0]
      this.drawer  = {
        ordered:Object.keys(this.account.ordered)
      }

      // Object.keys(this.account.ordered).map(generic => {
      //   let ordered = { name:generic }
      //
      //   return ordered
      // })

      if ( ! params.id) {
        return this.selectGroup(null, true)
      }

      return this.db.drug.get({_id:params.id}).then(drugs => {
        this.selectDrug(drugs[0], true)
      })
    })
  }

  scrollGroups($event) {
    Promise.resolve(this._search).then(_ => {
      //group won't be a reference so we must search manually
      let index = this.groups.map(group => group.name).indexOf(this.group.name)
      this.scrollSelect($event, index, this.groups, group => this.selectGroup(group, true))

      if ($event.which == 13) { //Enter get rid of the results
        this.selectGroup(null, true)
        document.querySelector('md-autocomplete input').blur()
      }
    })

    $event.stopPropagation() //scrolling groups doesn't need to scroll drugs as well
  }

  scrollDrugs($event) {
    this.scrollSelect($event, this.group.drugs.indexOf(this.drug), this.group.drugs, this.selectDrug)
  }

  scrollSelect($event, index, list, cb, autoselect) {

    let last  = list.length - 1

    if ($event.which == 38) //Keyup
      cb.call(this, list[index > 0 ? index - 1 : last])

    if ($event.which == 40) //keydown
      cb.call(this, list[index < last ? index+1 : 0])
  }

  selectGroup(group, autoselectDrug) {
    group = group || this.search().then(_ => {
      return this.groups[0] || {drugs:[]}
    })

    Promise.resolve(group).then(group => {
      this.group = group
      //TODO if this was called by selectDrug then we should establish establish a reference
      //between the approriate this.group.drugs and this.drug so that changes to the drug
      //appear in realtime on the right hand side.  This works if selectGroup
      if (autoselectDrug)
        this.selectDrug(group.drugs[0])
    })
  }

  selectDrug(drug = {generics:[{}]}, autoselectGroup) {
    if ( ! drug.generic && drug.form) //new drug won't have drug.form yet
      drug.generic = drug.generics.map(generic => generic.name+" "+generic.strength).join(', ')+' '+drug.form

    this.drug = drug
    this.term = drug.generic || ''

    let url = drug._id ? 'drugs/'+drug._id : 'drugs'
    this.router.navigate(url, { trigger: false })

    if (autoselectGroup)
      this.selectGroup()
  }

  selectDrawer(generic) {
    this.term = generic
    this.db.drug.get({generic}).then(drugs => {
      //Use filter to get an exact match not just one ingredient
      let group = {name:generic, drugs:drugs.filter(drug => drug.generic == generic)}
      this.selectGroup(group, true)
    })
  }

  search() {

    let term = (this.term || '').trim()

    if (term.length < 3)
      return Promise.resolve(this.groups = [])

    if (/^[\d-]+$/.test(term)) {
      this.regex = RegExp('('+term+')', 'gi')
      var drugs  = this.db.drug.get({ndc:term})
    } else {
      this.regex = RegExp('('+term.replace(/ /g, '|')+')', 'gi')
      var drugs  = this.db.drug.get({generic:term})
    }

    let groups = {}
    return this._search = drugs.then(drugs => {
      for (let drug of drugs) {
        drug.generic = genericName(drug)
        groups[drug.generic] = groups[drug.generic] || {name:drug.generic, drugs:[]}
        groups[drug.generic].drugs.push(drug)
      }
      this.groups = Object.keys(groups).map(key => groups[key])
    })
  }

  //We might make a separate database and API out of this one day, but for now just save on account object.
  //TODO: Warn on delete since we won't save save any of the preferences?
  order() {
    if (this.account.ordered[this.group.name]) {
      //Delete this group from the drawer drawer
      this.drawer.ordered = this.drawer.ordered.filter(generic => {
        return generic != this.group.name
      })

      this.account.ordered[this.group.name] = undefined
    } else {
      console.log('order')
      //Add New Order but Keep Add New Item on Top
      this.drawer.ordered.unshift(this.group.name)
      this.account.ordered[this.group.name] = {}
    }

    this.saveOrder()
    //return true
  }

  exportCSV() {
    this.snackbar.show(`Exporting drugs as csv. This may take a few minutes`)
    this.db.drug.get().then(drugs => {
      this.csv.unparse('Drugs.csv', drugs.map(drug => {
        let generic = genericName(drug)
        return {
          '':drug,
          _id:" "+drug._id,
          upc:" "+drug.upc,
          ndc9:" "+drug.ndc9,
          generic:generic,
          generics:drug.generics.map(generic => generic.name+" "+generic.strength).join(';'),
          ordered:this.account.ordered[generic] || {minQty:null, minDays:null, message:null}
        }
      }))
    })
  }

  importCSV() {
    this.snackbar.show(`Parsing csv file`)
    function capitalize(text) {
      return text ? text.trim().toLowerCase().replace(/\b[a-z]/g, l => l.toUpperCase()) : text
    }
    function trim(text) {
      return text ? text.trim() : text
    }
    this.csv.parse(this.$file.files[0]).then(parsed => {
      this.$file.value = ''
      return Promise.all(parsed.map(drug => {
        return {
          _id:trim(drug._id),
          brand:trim(drug.brand),
          form:capitalize(drug.form),
          image:trim(drug.image),
          labeler:capitalize(drug.labeler),
          generics:drug.generics.split(";").filter(v => v).map(generic => {
            let [name, strength] = generic.split(/(?= [\d.]+)/)
            return {
              name:capitalize(name),
              strength:trim(strength || '').toLowerCase().replace(/ /g, '')
            }
          })
        }
      }))
    })
    .then(rows => {
      this.snackbar.show(`Parsed ${rows.length} rows. Uploading to server`)
      return this.db.drug.post(rows)
    })
    .then(_ => this.snackbar.show(`Drugs import completed in ${Date.now() - start}ms`))
    .catch(err => this.snackbar.show('Drugs not imported: '+err))
  }

  addGeneric() {
    this.drug.generics.push({name:'', strength:''})
    this.drug._rev && this.saveDrug() //button doesn't trigger focusout -> save (if not a new drug)
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
    this.db.drug.post(this.drug)
    .then(res => {
      //Wait for the server POST to replicate back to client
      setTimeout(_ => this.selectDrug(this.drug, true), 200)
    })
    .catch(err => this.snackbar.show(`Drug not added: ${err.name}`))
  }

  saveDrug() {
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

function genericName(drug) {
  return drug.generics.map(generic => generic.name+" "+generic.strength).join(', ')+' '+drug.form
}
