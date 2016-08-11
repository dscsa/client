import {inject} from 'aurelia-framework'
import {Router} from 'aurelia-router'
import {Db}     from '../libs/pouch'

@inject(Db, Router)
export class login {

  constructor(db, router){
    this.db       = db
    this.router   = router
    this.email    = 'oregon@sirum.org'
    this.password = ''
  }

  login() {
    this.db.user.session.post({email:this.email, password:this.password})
    .then(loading => {

      this.disabled = true

      //wait for all resources except 'drugs' to sync
      this.loading  = loading.resources
      this.progress = loading.progress

      return Promise.all(loading.syncing)
    })
    .then(resources => {
      this.router.navigate('shipments')
    })
    .catch(err => {
      this.disabled = false
      this.snackbar.show('Login failed: '+err.reason)
    })
  }
}
