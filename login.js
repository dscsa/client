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
    this.db.user.session.delete().then(_ => {
      this.disabled = false
      console.log('delete successful going to login')
    })
    .catch(e => console.log('delete not successful', e))
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
      console.log('login successful')
      this.router.navigate('shipments')
    })
    .catch(err => {
      this.disabled = false
      console.log('login failed because', err.message, err.stack)
    })
  }
}
