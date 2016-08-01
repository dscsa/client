import {inject}     from 'aurelia-framework'
import {Router}     from 'aurelia-router'
import {Db}         from '../libs/pouch'
import {HttpClient} from 'aurelia-http-client';

//@pageState()
@inject(Db, Router, HttpClient)
export class join {

  constructor(db, router, http){
    this.db     = db
    this.router = router
    this.http   = http

    this.account = {
      name:'SNF2',
      license:'RCFE',
      street:'4744 Charles Samuel Dr',
      city:'Tallahassee',
      state:'FL',
      zip:'32309',
      ordered:{}
    }

    this.user = {
      name:{first:'Adam',last:'Kircher'},
      email:'adam@sirum.org',
      phone:'650.799.2817',
      password:'password'
    }
  }

  join() {
    this.db.account.post(this.account)
    .then(account => {
      this.user.account = {_id:account._id}
      return this.db.user.post(this.user)
    })
    .then(_ => {
      return this.db.user.session.post({email:this.user.email, password:this.user.password})
    })
    .then(loading => {
      //wait for all resources except 'drugs' to sync .filter(r => r.name != 'drugs')
      this.loading = loading.resources

      return Promise.all(loading.syncing)
    })
    .then(_ => {
      console.log('join success', _)
      return this.router.navigate('account')
    })
    .catch(err => {
      this.snackbar.show('Join failed: '+err.reason)
    })
  }
}