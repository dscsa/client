import {inject} from 'aurelia-framework'
import {Router} from 'aurelia-router'
import {Db}     from '../libs/pouch'
import {Csv}    from '../libs/csv'
import {canActivate, scrollSelect, toggleDrawer, drugSearch} from '../resources/helpers'


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
      return this.db.account.get({_id:session.account._id})
    })
    .then(accounts => {
      this.account = accounts[0]
      this.drawer  = {
        ordered:Object.keys(this.account.ordered).sort()
      }

      if (params.id)
        return this.db.drug.get({_id:params.id}).then(drugs => {
          this.selectDrug(drugs[0], true)
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
    this.term = group.name

    this.db.transaction.get({generic:group.name, inventory:true}).then(inventory => {
      this.inventory = inventory[0] && inventory[0].qty
    })

    if ( ! group.drugs) //Not set if called from selectDrug or selectDrawer
      group.drugs = this.search().then(_ => {
        //Use filter to get an exact match not just one ingredient
        return this.groups.length ? this.groups.filter(group => this.term == group.name)[0].drugs : []
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
    let url = this.drug ? 'drugs/'+this.drug._id : 'drugs'
    this.router.navigate(url, { trigger: false })

    //Default is for Add Drug menu item in view
    this.drug = drug || {
      generics:this.drug ? this.drug.generics : [{name:'', strength:''}],
      form:this.drug && this.drug.form
    }


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

  exportOrdered() {
    this.snackbar.show(`Exporting orders as csv. This may take a few minutes`)
    let csv    = new Csv(['generic'], ['inventory', 'maxInventory', 'minQty', 'minDays', 'verifiedMessage', 'destroyedMessage', 'defaultLocation'])
    let orders = []
    for (let generic in this.account.ordered) {
      let order = this.account.ordered[generic]
      orders.push(this.db.transaction.get({generic, inventory:"sum"}).then(inventory => {
        order.generic   = generic
        order.inventory = inventory[0]
        return order
      }))
    }

    Promise.all(orders).then(orders => csv.unparse('Orders.csv', orders))
  }

  exportDrugs() {
    this.snackbar.show(`Exporting drugs as csv. This may take a few minutes`)
    this.db.drug.get().then(drugs => {
      this.csv.unparse('Drugs.csv', drugs.map(drug => {
        return {
          '':drug,
          _id:" "+drug._id,
          upc:"UPC "+drug.upc,
          ndc9:"NDC9 "+drug.ndc9,
          generics:drug.generics.map(generic => generic.name+" "+generic.strength).join(';'),
          ordered:this.account.ordered[drug.generic]
        }
      }))
    })
  }

  importDrugs() {
    let start = Date.now()
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
          }),
          price:drug.price
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

  saveOrder() {
    return this.db.account.put(this.account).catch(_ => {
      this.snackbar.show(`Order could not be saved: ${err.reason || err.message}`)
    })
  }

  addDrug() {
    this._savingDrug = true
    this.db.drug.post(this.drug)
    .then(res => {
      //Wait for the server POST to replicate back to client
      setTimeout(_ => {
        this._savingDrug = false
        this.selectDrug(this.drug, true)
      }, 1000)
    })
    .catch(err => {
      this._savingDrug = false
      this.snackbar.show(`Drug not added: ${err.reason || err.message}`)
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
      setTimeout(_ => {
        this._savingDrug = false
        this.selectDrug(this.drug, true)
      }, 1000)
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
