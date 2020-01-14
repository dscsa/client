import {inject} from 'aurelia-framework';
import {Pouch}     from '../libs/pouch'
import {Router} from 'aurelia-router'
import {canActivate} from '../resources/helpers'

//TODO this is causing Router to revert route and switches to not be upgraded @pageState()
@inject(Pouch, Router)
export class account {

  constructor(db, router){
    this.db           = db
    this.router       = router
    this.canActivate  = canActivate
    this.csvHref = window.location.protocol+'//'+window.location.hostname
    this.csvDate = `${new Date().toJSON().slice(0, -8)}`
  }

  activate() {

    this.db.user.session.get().then(session => {

      this.session = session

      //TODO allow a valueConverter for each state or do a new search
      this.db.account.allDocs({include_docs:true, endkey:'_design'}).then(accounts => {
        this.accounts = accounts.rows.map(account => account.doc).filter(account => {
          if (account._id != session.account._id)
            return true
          this.account = account
        })
      })

      return this.db.user.query('account._id', { key:session.account._id, include_docs:true})
      .then(users => {
        this.users = users.rows.map(user => user.doc)
        this.selectUser()
      })
    })
  }

  selectUser(user) {
    this.user = user || this.users.filter(user => user._id == this.session._id)[0]
  }

  saveUser() {
    this.user._id && this.db.user.put(this.user)
    return true
  }

  addUser() {
    this.users.unshift(this.user)
    this.db.user.post(this.user)
    .catch(err => {
      this.users.shift()
      this.snackbar.show(err.message || err.reason)
    })
  }

  deleteUser() {
    let index = this.users.indexOf(this.user)
    this.db.user.remove(this.user).then(_ => {
      this.users.splice(index, 1)
      this.selectUser()
    })
    .catch(err => {
      console.log(err)
      this.snackbar.show(err.message || err.reason)
    })
  }

  //Simple debounce doesn't work here to prevent double click
  //because account is not authorized until the db returns
  //which means isAuthorized isn't updated yet for the since click
  authorize(_id) {
    console.log('account.authorize', _id, this.account.authorized)
    let index  = this.account.authorized.indexOf(_id)
    let method = ~ index ? 'delete' : 'post'
    this.db.account.authorized[method](_id)
    .then(res => this.account.authorized = res.authorized)
    .catch(err => console.error('account.authorize', err))
    //TODO reset checkbox and show snackbar if change not made
  }


  switchUsers(){
    console.log("switching users")
    this.dialog.showModal()
  }

  attemptSwitch(){
    console.log(this.phone)
    console.log(this.password)

    //TODO here: use phone & password to try and log in, update cookies, and then refresh. do not uninstall/reinstall everything

    this.db.user.session.post({phone:this.phone, password:this.password})
    .then(loading => {
      this.disabled = true

      //wait for all resources except 'drugs' to sync
      this.loading  = loading.resources
      this.progress = loading.progress

      return Promise.all(loading.syncing)
    })
    .then(resources => {
      //TODO
      //display success message and then close modal window and refresh page
    })
    .catch(err => {
      this.snackbar.error('Login failed', err)
    })

  }

  closeSwitchUsersDialog(){
    this.dialog.close()
  }

  logout() {
    this.disableLogout = 'Uninstalling...'
    this.db.user.session.delete().then(_ => {
      this.router.navigate('login', {trigger:true})
    })
    .catch(err => console.trace('Logout failed:',err))
  }

  importCSV($event) {
    this.snackbar.show(`Uploading CSV File`) //'transaction.csv'
    const elem = $event.target
    console.log(elem.parentNode.parentNode.getAttribute('href'), elem.parentNode.parentNode.href, elem.parentNode.parentNode)
    return this.db.ajax({method:'post', url:elem.parentNode.parentNode.getAttribute('href'), body:elem.files[0], json:false})
    .then(rows => this.snackbar.show('Import Succesful'))
    .catch(err => this.snackbar.error('Import Error', err))
  }
}
