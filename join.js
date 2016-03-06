import {inject}     from 'aurelia-framework'
import {Router}     from 'aurelia-router'
import {Db}         from 'db/pouch'
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
      first:'Adam',
      last:'Kircher',
      name:'adam@sirum.org',
      phone:'650.799.2817',
      password:'password'
    }
  }

  join() {
    this.db.accounts.post(this.account)
    .then(account => {
      this.user.account = {_id:account._id}
      return this.db.users.post(this.user)
    })
    .then(user => {
      return this.db.users({_id:user.name}).session.post({password:user.password})
    })
    .then(_ => {
      console.log('join success', _)
      return this.router.navigate('account', {trigger:true, replace:true})
    })
    .catch(_ => {
      console.log('join failed', _)
    })
  }
}
