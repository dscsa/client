export function configure(aurelia) {

  Promise.config({warnings:false})
  console.log = console.log.bind(console)

  aurelia.use
    .standardConfiguration()
    .plugin('aurelia-animator-css')
      .plugin('aurelia-http-client')
    .globalResources([
        'client/src/resources/value-converters',
    ])

  aurelia.start().then(a => {
      require('../../../../client/src/resources/v3/app.js');
      window.v3 = new v3();



      a.setRoot('client/src/views/routes');
    });
}
