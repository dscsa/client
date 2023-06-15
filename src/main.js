import environment from './config/environment.json';
import {PLATFORM} from 'aurelia-pal';

export function configure(aurelia) {
  aurelia.use
    .standardConfiguration()
    // TODO: Figure out how to get this working
    // .plugin(PLATFORM.moduleName(('aurelia-animator-css'))
    .globalResources(PLATFORM.moduleName('resources/value-converters'))
    .feature(PLATFORM.moduleName('resources/index'));

  aurelia.use.developmentLogging(environment.debug ? 'debug' : 'warn');

  if (environment.testing) {
    aurelia.use.plugin(PLATFORM.moduleName('aurelia-testing'));
  }

    // console.log = console.log.bind(console)

    // aurelia.start().then(a => a.setRoot('client/src/views/routes'));

  aurelia.start().then(() => aurelia.setRoot(PLATFORM.moduleName('views/routes')));
}
