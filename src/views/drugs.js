import {inject} from 'aurelia-framework'
import {Router} from 'aurelia-router'
import {Db}     from '../libs/pouch'
import {Csv}    from '../libs/csv'
import {scrollSelect, toggleDrawer} from '../resources/helpers'


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

    this.toggleDrawer = toggleDrawer
    this.scrollSelect = scrollSelect
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

      if ( ! params.id)
        return this.selectDrawer(this.drawer.ordered[0])

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

      if ($event.which == 13)//Enter get rid of the results
        this.selectGroup(null, true)
    })

    $event.stopPropagation() //scrolling groups doesn't need to scroll drugs as well
  }

  scrollDrugs($event) {
    this.scrollSelect($event, this.group.drugs.indexOf(this.drug), this.group.drugs, this.selectDrug)
  }

  //Three entrances.
  //1) User searches and then selects group from autocomplete (group already supplied)
  //2) selectDrawer and we need to find the group with that particular generic name
  //3) selectDrug and we need to find the group with that particular generic name
  selectGroup(group, autoselectDrug) {

    this.term = group.name

    if ( ! group.drugs)
      group = this.search().then(_ => {
        //Use filter to get an exact match not just one ingredient
        return this.groups.filter(group => this.term == group.name)[0]
      })

    this.db.transaction.get({generic:this.term, 'shipment._id':this.account._id}).then(transactions => {
      this.inventory = transactions.reduce((a, b) => a+b.qty.from, 0)
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

  selectDrug(drug, autoselectGroup) {

    this.drug = drug || {
      generics:this.group.drugs[0].generics,
      form:this.group.drugs[0].form
    }

    let url = this.drug._id ? 'drugs/'+this.drug._id : 'drugs'
    this.router.navigate(url, { trigger: false })

    document.querySelector('md-input input').focus()

    if (autoselectGroup)
      this.selectGroup({name:this.drug.generic})
  }

  selectDrawer(generic) {
    this.selectGroup({name:generic}, true)
    this.toggleDrawer()
  }

  search() {

    let term = (this.term || '').trim()

    if (term.length < 3)
      return Promise.resolve(this.groups = []) //always return a promise

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
      //Add New Order but Keep Add New Item on Top
      this.drawer.ordered.unshift(this.group.name)
      this.account.ordered[this.group.name] = {}
    }

    this.saveOrder()
  }

  exportCSV() {
    this.snackbar.show(`Exporting drugs as csv. This may take a few minutes`)
    this.db.drug.get().then(drugs => {
      this.csv.unparse('Drugs.csv', drugs.map(drug => {
        return {
          '':drug,
          _id:" "+drug._id,
          upc:" "+drug.upc,
          ndc9:" "+drug.ndc9,
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
    return true
  }

  removeGeneric() {
    this.drug.generics.pop()
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
      setTimeout(_ => this.selectDrug(this.drug, true), 500)
    })
    .catch(err => this.snackbar.show(`Drug not added: ${err.reason}`))
  }

  saveDrug() {
    this.db.drug.put(this.drug)
    .then(res => {
      //If we move the last drug out of the group, make sure we unorder it
      if (
        this.group.name != this.drug.generic &&
        this.group.drugs.length == 1 &&
        this.account.ordered[this.group.name]
      ) this.order()

      //Wait for the server PUT to replicate back to client
      setTimeout(_ => this.selectDrug(this.drug, true), 500)
    })
    .catch(err => this.snackbar.show(`Drug not saved: ${err.reason}`))
  }

  deleteDrug() {
    console.log('TO BE IMPLEMENETED')
    //TODO complicated since drug might be used in a transaction.  Switch trans to a new drug
  }
}
