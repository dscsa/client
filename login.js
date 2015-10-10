import {inject} from 'aurelia-framework'
import {Router} from 'aurelia-router'
import {Db}     from 'db/pouch'

@inject(Db, Router)
export class login {

  constructor(db, router){
    this.db       = db
    this.router   = router
    this.name     = 'adam@sirum.org'
    this.password = 'password'
    this.db.users(true).session.remove()
    .then(_ => this.enabled = true)
  }

  login() {
    let session = this.db.users({_id:this.name}).session

    this.enabled = false
    this.loading = session.loading

    session.post({password:this.password})
    .then(user => {
      console.log('LOGGED IN', user)
      this.router.navigate(user.account == 'admin' ? 'drugs' : 'account')
    })
    .catch(err => {
      this.enabled = true
      this.loading = null
      console.log('login failed because', err.message)
    })
  }
}
