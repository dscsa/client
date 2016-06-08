import {inject} from 'aurelia-framework'
import {Router} from 'aurelia-router'
import {Db}     from 'db/pouch'

@inject(Db, Router)
export class login {

  constructor(db, router){
    this.db       = db
    this.router   = router
    this.email    = 'adam@sirum.org'
    this.password = 'password'
    this.disabled = true
  }

  activate() {
    this.db.user.session.delete().then(_ => this.disabled = false)
    .catch(err => this.snackbar.show('Logout failed: '+err.reason))
  }

  login() {
    this.db.user.session.post({email:this.email, password:this.password})
    .then(loading => {

      this.disabled = true

      //wait for all resources except 'drugs' to sync
      this.loading = loading.resources

      return Promise.all(loading.syncing)
    })
    .then(resources => {
      this.router.navigate('shipments')
    })
    .catch(err => {
      this.disabled = false
      console.log(err, this.snackbar.show)
      this.snackbar.show('Login failed: '+err.reason)
    })
  }
}
