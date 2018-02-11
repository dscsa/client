import {inject} from 'aurelia-framework'
import {Router} from 'aurelia-router'
import {Pouch}     from '../libs/pouch'
import {csv}    from '../libs/csv'
import {canActivate, scrollSelect, toggleDrawer, drugSearch} from '../resources/helpers'


//@pageState()
@inject(Pouch, Router)
export class drugs {
  constructor(db, router){
    this.csv    = csv
    this.db     = db
    this.router = router
    this.term   = ''
    this.scrollDrugs = this.scrollDrugs.bind(this)

    this.toggleDrawer = toggleDrawer
    this.scrollSelect = scrollSelect
    this.drugSearch   = drugSearch
    this.canActivate = canActivate
  }

  deactivate() {
    removeEventListener('keyup', this.scrollDrugs)
  }

  activate(params) {

    addEventListener('keyup', this.scrollDrugs)
    return this.db.user.session.get()
    .then(session => {
      return this.db.account.get(session.account._id)
    })
    .then(account => {
      this.account = account
      this.drawer  = {
        ordered:Object.keys(this.account.ordered).sort()
      }

      if (params.id)
        return this.db.drug.get(params.id).then(drug => {
          this.selectDrug(drug, true)
        })

      if (this.drawer.ordered[0])
        return this.selectDrawer(this.drawer.ordered[0])

      return this.selectDrug()
    })
  }

  scrollGroups($event) {
    Promise.resolve(this._search).then(_ => {
      //group won't be a reference so we must search manually
      this.scrollSelect($event, this.group, this.groups, group => this.selectGroup(group, true))

      if ($event.which == 13)//Enter get rid of the results
        this.selectGroup(null, true)
    })

    $event.stopPropagation() //scrolling groups doesn't need to scroll drugs as well
  }

  scrollDrugs($event) {
    this.group && this.scrollSelect($event, this.drug, this.group.drugs, this.selectDrug)
  }

  //Three entrances.
  //1) User searches and then selects group from autocomplete (group already supplied)
  //2) selectDrawer and we need to find the group with that particular generic name
  //3) selectDrug and we need to find the group with that particular generic name
  selectGroup(group, autoselectDrug) {
    console.log('selectGroup()', group, this.drug && this.drug.generic)

    this.term = group.name

    let minDays = this.account.ordered[group.name].minDays || this.account.default.minDays
    let indate  = new Date()
    console.log('indate 1', indate, indate.getDate(), indate.getDate() + minDays)
    indate.setDate(indate.getDate() + minDays)
    console.log('indate 2', indate, indate.getDate(), indate.toJSON())
    indate = indate.toJSON().slice(0, 10)
    console.log('indate 3', this.account.ordered[group.name].minDays, this.account.default.minDays, minDays, indate)

    this.db.transaction.query('inventory', {startkey:[this.account._id, group.name, indate], endkey:[this.account._id, group.name, {}]})
    .then(inventory => {
      console.log('indate inventory', indate, inventory)
      this.indateInventory = inventory.rows[0] ? inventory.rows[0].value['qty.binned'] || 0 + inventory.rows[0].value['qty.repacked'] || 0 : 0
      console.log('indate inventory', this.indateInventory)
    })

    this.db.transaction.query('inventory', {startkey:[this.account._id, group.name], endkey:[this.account._id, group.name, indate]})
    .then(inventory => {
      console.log('outdate inventory', indate, inventory)
      this.outdateInventory = inventory.rows[0] ? inventory.rows[0].value['qty.binned'] || 0 + inventory.rows[0].value['qty.repacked'] || 0 : 0
      console.log('outdate inventory', this.outdateInventory)
    })

    if ( ! group.drugs) //Not set if called from selectDrug or selectDrawer
      group.drugs = this.search().then(_ => {
        //Use filter to get an exact match not just one ingredient
        let filtered = this.groups.filter(group => this.term == group.name)
        return filtered.length ? filtered[0].drugs : []
      })

    Promise.resolve(group.drugs).then(drugs => {
      group.drugs = drugs
      this.group  = group
      //TODO if this was called by selectDrug then we should establish establish a reference
      //between the approriate this.group.drugs and this.drug so that changes to the drug
      //appear in realtime on the right hand side.  This works if selectGroup
      if (autoselectDrug)
        this.selectDrug(group.drugs[0])
    })
  }

  selectDrug(drug, autoselectGroup) {
    //Default is for Add Drug menu item in view
    console.log('selectDrug()', this.group && this.group.name, drug && drug.generic)
    this.drug = drug || {
      generics:this.drug ? this.drug.generics : [{name:'', strength:''}],
      form:this.drug && this.drug.form
    }

    let url = this.drug._id ? 'drugs/'+this.drug._id : 'drugs'
    this.router.navigate(url, { trigger: false })

    if (autoselectGroup)
      this.selectGroup({name:this.drug.generic || this.term})
  }

  selectDrawer(generic) {
    this.selectGroup({name:generic}, true)
    this.toggleDrawer()
  }

  search() {
    return this.drugSearch().then(drugs => {
      let groups = {}
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
    console.log('before order()', this.group.name, this.drug.generic)

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
    console.log('after order()', this.group.name, this.drug.generic)
    this.saveAccount()
  }

  exportCSV(generic) {
    let inventory = this.db.transaction.query('inventory', {key:[this.account._id]})
    let drugs = this.db.drug.allDocs({include_docs:true, endkey:'_design'})
    Promise.all([inventory, drugs]).then(([inventory, drugs]) => {
      console.log('Export queries run')
      let ndcMap = {}
      for (const row of inventory.rows) {
        ndcMap[row.key[2]] = row.value
      }
      console.log('Inital map complete')
      this.csv.fromJSON(`Drugs ${new Date().toJSON()}.csv`, drugs.rows.map(row => {
        return {
          order:this.account.ordered[row.doc.generic],
          '':row.doc,
          upc:"UPC "+row.doc.upc,
          ndc9:"NDC9 "+row.doc.ndc9,
          generics:row.doc.generics.map(generic => generic.name+" "+generic.strength).join(';'),
          inventory:ndcMap[row.doc._id]
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

    this.csv.toJSON(this.$file.files[0], drugs => {
      this.$file.value = ''
      let errs  = []
      let chain = Promise.resolve()

      for (let i in drugs) {
        chain = chain
        .then(_ => {
          let drug = drugs[i]

          drug = {
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
            }),
            price:drug.price
          }

          return this.db.drug.post(drug)
          .catch(err => {
            drug._err = 'Upload Error: '+JSON.stringify(err)
            errs.push(drug)
          })
          .then(_ => {
            if (+i && (i % 100 == 0))
              this.snackbar.show(`Imported ${i} of ${drugs.length}`)
          })
        })
      }

      return chain.then(_ => errs)  //return something so we do download errors
    })
    .then(rows => this.snackbar.show('Import Succesful'))
    .catch(err => this.snackbar.error('Import Error', err))
  }

  addGeneric() {
    this.drug.generics.push({name:'', strength:''})
    return true
  }

  removeGeneric() {
    this.drug.generics.pop()
    setTimeout(_ => document.forms[0].dispatchEvent(new Event('change')))
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

  saveAccount() {
    console.log('before saveAccount()', this.group.name, this.drug.generic)
    return this.db.account.put(this.account).catch(_ => {
      console.log('after saveAccount()', this.group.name, this.drug.generic)
      this.snackbar.show(`Error while saving: ${err.reason || err.message}`)
    })
  }

  showDefaultsDialog() {
    console.log('showDefaultsDialog')
    this.dialog.showModal()
  }

  closeDefaultsDialog() {
    this.dialog.close()
  }

  addDrug() {
    this._savingDrug = true
    this.db.drug.post(this.drug)
    .then(res => {
      this.drug._rev = res.rev
      this.selectDrug(this.drug, true)
      this._savingDrug = false
    })
    .catch(err => {
      this._savingDrug = false
      console.log(err)
      this.snackbar.show(`Drug not added: ${err.reason || err.message || JSON.stringify(err.errors)}`)
    })
  }

  saveDrug() {
    this._savingDrug = true
    this.db.drug.put(this.drug)
    .then(res => {
      //If we move the last drug out of the group, make sure we unorder it
      if (
        this.group.name != this.drug.generic &&
        this.group.drugs.length == 1 &&
        this.account.ordered[this.group.name]
      ) this.order()

      //Wait for the server PUT to replicate back to client
      this.selectDrug(this.drug, true)
      this._savingDrug = false
    })
    .catch(err => {
      this._savingDrug = false
      this.snackbar.show(`Drug not saved: ${err.reason || err.message}`)
    })
  }

  deleteDrug() {
    console.log('TO BE IMPLEMENETED')
    //TODO complicated since drug might be used in a transaction.  Switch trans to a new drug
  }
}
