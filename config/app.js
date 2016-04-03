//@pageState()
export class App {

  configureRouter(config, router){
    config.title = 'SIRUM';
    config.addPipelineStep('authorize', AuthorizeStep);

    config.map([
      { route: 'login',                        moduleId: '../login',     title:'Login',     nav:true},
      { route: ['join', ''],                   moduleId: '../join',      title:'Join',      nav:true},
      { route: ['inventory', 'inventory/:id'], moduleId: '../inventory', title:'Inventory', nav:true, roles:["user"]},
      { route: ['shipments', 'shipments/:id'], moduleId: '../shipments', title:'Shipments', nav:true, roles:["user"]},
      { route: 'account',                      moduleId: '../account',   title:'Account',   nav:true, roles:["user"]},
      { route: ['drugs', 'drugs/:id'],         moduleId: '../drugs',     title:'Drugs',     nav:true, roles:["user"]},
      { route: ['records', 'records/:id'],     moduleId: '../records',   title:'Records',   nav:true, roles:["user"]},
      { route: 'accounts',                     moduleId: '../accounts',  title:'Accounts',  nav:true, roles:["admin"]}
    ]);

    this.router = router
  }
}

import {inject}   from 'aurelia-framework'
import {Db}       from '../db/pouch'
import {Router, Redirect} from 'aurelia-router'

@inject(Router, Db)
export class AuthorizeStep {
  constructor(router, db){
    this.db = db

    //Unfortunately on browser reload run method is not called
    //so if session has expired we need to check here as well
    if ( ! db.users().session())
      router.navigate('login')
  }

  run(routing, next) {
    setTimeout(_ => {
      let session = this.db.users().session()
      for (let row of routing.router.navigation) {
        if ( ! session) {
          row.isVisible = ! row.config.roles; continue
        }
        var role = session.account._id.length == 7 ? 'user' : session.account
        row.isVisible = row.config.roles && ~row.config.roles.indexOf(role)
      }

      if (routing.getAllInstructions().some(i => i.config.navModel.isVisible))
        next()
      else {
        next.cancel(new Redirect('login'))
      }
    }, 0)
  }
}
