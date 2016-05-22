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
      { route: ['drugs', 'drugs/:id'],         moduleId: '../drugs',     title:'Drugs',     nav:true, roles:["user"]},
      { route: ['records', 'records/:id'],     moduleId: '../records',   title:'Records',   nav:true, roles:["user"]},
      { route: 'account',                      moduleId: '../account',   title:'Account',   nav:true, roles:["user"]}
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
    if ( ! document.cookie) {
      console.log('emergency logout')
      router.navigate('login')
    }
  }

  run(routing, next) {
    this.db.user.session.get().then(session => {
      for (let row of routing.router.navigation) {
        if ( ! session || ! session.account) {
          row.isVisible = ! row.config.roles; continue
        }
        var role = session.account._id.length == 7 ? 'user' : 'admin'
        row.isVisible = row.config.roles && ~row.config.roles.indexOf(role)
      }

      if (routing.getAllInstructions().some(i => i.config.navModel.isVisible || i.config.route == 'login'))
        next()
      else
        next.cancel(new Redirect('login'))
    })
  }
}
