//@pageState()
export class App {

  configureRouter(config, router){
    config.title = 'SIRUM';
    config.addPipelineStep('authorize', AuthorizeStep);

    config.map([
      { route: 'login',                        moduleId: 'views/login',     title:'Login',     nav:true},
      { route: ['join', ''],                   moduleId: 'views/join',      title:'Join',      nav:true},
      { route: ['inventory', 'inventory/:id'], moduleId: 'views/inventory', title:'Inventory', nav:true, roles:["user"]},
      { route: ['shipments', 'shipments/:id'], moduleId: 'views/shipments', title:'Shipments', nav:true, roles:["user"]},
      { route: ['drugs', 'drugs/:id'],         moduleId: 'views/drugs',     title:'Drugs',     nav:true, roles:["user"]},
      { route: ['records', 'records/:id'],     moduleId: 'views/records',   title:'Records',   nav:true, roles:["user"]},
      { route: 'account',                      moduleId: 'views/account',   title:'Account',   nav:true, roles:["user"]}
    ]);

    this.router = router
  }
}

import {inject}   from 'aurelia-framework'
import {Db}       from 'libs/pouch'
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

      let route = routing.getAllInstructions()[0].config

      for (let row of routing.router.navigation) {
        if ( ! session || ! session.account || ! route.roles) {
          row.isVisible = ! row.config.roles; continue
        }
        var role = session.account._id.length == 7 ? 'user' : 'admin'
        row.isVisible = row.config.roles && ~row.config.roles.indexOf(role)
      }

      route.navModel.isVisible ? next() : next.cancel(new Redirect('login'))
    })
    .catch(err => console.log('router error', err))
  }
}
