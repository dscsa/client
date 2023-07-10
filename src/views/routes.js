//@pageState()
import {PLATFORM} from 'aurelia-pal';
export class App {

    configureRouter(config, router) {
        this.routes = router.navigation
        config.title = 'SIRUM';

        // config.options.pushState = true;
        // config.options.root = '/account/';

        config.map([
            {
                route: 'login',
                moduleId: PLATFORM.moduleName('./login'),
                title: 'Login',
                nav: true
            },
            {
                route: 'join',
                moduleId: PLATFORM.moduleName('./join'),
                title: 'Join',
                nav: true
            },
            {
                route: 'account',
                moduleId: PLATFORM.moduleName('./account'),
                title: 'Account',
                nav: true,
                roles: ["user"]
            },
            {
                route: ['picking', 'picking/:groupName/step/:stepNumber'],
                name: 'picking',
                moduleId: PLATFORM.moduleName('./picking'),
                title: 'Picking',
                nav: true,
                roles: ["user"]
            },
            {
                route: 'inventory',
                moduleId: PLATFORM.moduleName('./inventory'),
                title: 'Inventory',
                nav: true,
                roles: ["user"]
            },
            {
                route: ['shipments', 'shipments/:id', ''],
                moduleId: PLATFORM.moduleName('./shipments'),
                title: 'Shipments',
                nav: true,
                roles: ["user"]
            },
            {
                route: ['drugs', 'drugs/:id'],
                moduleId: PLATFORM.moduleName('./drugs'),
                title: 'Drugs',
                nav: true,
                roles: ["user"]
            },
        ])
    }
}
