export function configure(aurelia) {

  console.log = console.log.bind(console)

  aurelia.use
    //.developmentLogging()
    .standardConfiguration()
    .plugin('aurelia-animator-css')

  aurelia.start().then(a => a.setRoot('routes'));
}
