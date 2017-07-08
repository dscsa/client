import {inject}     from 'aurelia-framework'
import {Router}     from 'aurelia-router'
import {Pouch}         from '../libs/pouch'
import {HttpClient} from 'aurelia-http-client'
import {canActivate} from '../resources/helpers'

//@pageState()
@inject(Pouch, Router, HttpClient)
export class join {

  constructor(db, router, http){
    this.db     = db
    this.router = router
    this.http   = http

    this.account = {
      name:'',
      license:'Pharmacy',
      street:'',
      city:'',
      state:'',
      zip:'',
      ordered:{}
    }

    this.user = {
      name:{first:'Guest',last:'User'},
      phone:'650.488.7434'
    }
    this.canActivate = canActivate
  }

  join() {
    console.log('this.account.phone', this.account.phone)
    this.db.account.post(this.account)
    .then(res => {
      this.user.account = {_id:res.id}
      console.log('this.user.phone', this.user.phone)
      let password = this.user.password
      return this.db.user.post(this.user)
      .then(_ => this.user.password = password)
    })
    .then(_ => {
      console.log(1)
      //local user is created but now replicator must call bulk docs which then triggers creation of a
      //_user login. Since, we don't know exactly how long this will take so we must do a timeout here
      return new Promise(resolve => setTimeout(resolve, 1000))
    })
    .then(_ => {
      console.log(2)
      return this.db.user.session.post(this.user)
    })
    .then(loading => {
      console.log(3)
      //wait for all resources except 'drugs' to sync .filter(r => r.name != 'drugs')
      this.disabled = true
      this.loading  = loading.resources
      this.progress = loading.progress

      return Promise.all(loading.syncing)
    })
    .then(_ => {
      console.log('join success', _)
      return this.router.navigate('shipments')
    })
    .catch(err => this.snackbar.error('Join failed', {err, account:this.account, user:this.user}))
  }
}
