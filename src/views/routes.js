//@pageState()
export class App {

  configureRouter(config, router){
    config.title = 'SIRUM';
    config.addPipelineStep('authorize', AuthorizeStep);

    config.map([
      { route: 'login',                            moduleId: 'views/login',     title:'Login',     nav:true},
      { route: ['join'],                           moduleId: 'views/join',      title:'Join',      nav:true},
      { route: ['inventory', 'inventory/:id'],     moduleId: 'views/inventory', title:'Inventory', nav:true, roles:["user"]},
      { route: ['shipments', 'shipments/:id', ''], moduleId: 'views/shipments', title:'Shipments', nav:true, roles:["user"]},
      { route: ['drugs', 'drugs/:id'],             moduleId: 'views/drugs',     title:'Drugs',     nav:true, roles:["user"]},
      { route: ['records', 'records/:id'],         moduleId: 'views/records',   title:'Records',   nav:true, roles:["user"]},
      { route: 'account',                          moduleId: 'views/account',   title:'Account',   nav:true, roles:["user"]}
    ])
    this.router = router
  }
}

import {inject}   from 'aurelia-framework'
import {Db}       from '../libs/pouch'
import {Router, Redirect} from 'aurelia-router'

@inject(Router, Db)
export class AuthorizeStep {
  constructor(router, db){
    this.db = db
    //Unfortunately on browser reload run method is not called
    //so if session has expired we need to check here as well
    if ( ! document.cookie)
      router.navigate('login')
  }

  run(routing, nextStep) {
    //Run must return a promise of a navigation route.  i.e., Second parameter is not a pure callback
    return this.db.user.session.get().then(session => {
      let next = routing.getAllInstructions()[0].config
      for (let route of routing.router.navigation) {
        if ( ! session || ! session.account) {
          route.isVisible = ! route.config.roles; continue
        }
        let role = session.account._id.length == 7 ? 'user' : 'admin'
        route.isVisible = route.config.roles && ~route.config.roles.indexOf(role)
      }

      if (next.navModel.isVisible) return nextStep()
      let redirect = new Redirect(next.navModel.config.roles ? 'login' : 'shipments')
      return nextStep.cancel(redirect)
    })
    .catch(err => console.log('router error', err))
  }
}
