//@pageState()
export class App {

  configureRouter(config, router){
    this.routes  = router.navigation
    config.title = 'SIRUM'
    config.map([
      { route: 'login',                            moduleId: 'views/login',     title:'Login',     nav:true},
      { route: 'join',                             moduleId: 'views/join',      title:'Join',      nav:true},
      { route: 'inventory',                        moduleId: 'views/inventory', title:'Inventory', nav:true, roles:["user"]},
      { route: ['shipments', 'shipments/:id', ''], moduleId: 'views/shipments', title:'Shipments', nav:true, roles:["user"]},
      { route: ['drugs', 'drugs/:id'],             moduleId: 'views/drugs',     title:'Drugs',     nav:true, roles:["user"]},
      { route: ['records', 'records/:id'],         moduleId: 'views/records',   title:'Records',   nav:true, roles:["user"]},
      { route: 'account',                          moduleId: 'views/account',   title:'Account',   nav:true, roles:["user"]}
    ])
  }
}
