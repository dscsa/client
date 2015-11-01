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
      { route: 'accounts',                     moduleId: '../accounts',  title:'Accounts',  nav:true, roles:["admin"]}
    ]);

    this.router = router
  }
}

import {inject}   from 'aurelia-framework'
import {Db}       from '../db/pouch'
import {Redirect} from 'aurelia-router'

@inject(Db)
export class AuthorizeStep {
  constructor(db){
    this.db = db;
  }

  run(routing, next) {
    let session = this.db.users(true).session()
    for (let row of routing.router.navigation) {
      if ( ! session) {
        row.isVisible = ! row.config.roles; continue
      }
      var role = session.account._id.length == 7 ? 'user' : session.account
      row.isVisible = row.config.roles && ~row.config.roles.indexOf(role)
    }
    if (routing.nextInstructions.some(i => i.config.navModel.isVisible))
        return next()
    console.log('Authorization Failed')
    return next.cancel(new Redirect('login'))
  }
}
