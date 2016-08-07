export function configure(aurelia) {

  Promise.config({warnings:false})
  console.log = console.log.bind(console)

  aurelia.use
    .standardConfiguration()
    .plugin('aurelia-animator-css')

  aurelia.start().then(a => a.setRoot('views/routes'));
}
