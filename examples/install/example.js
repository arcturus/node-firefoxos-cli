var ffos_cli = require('../../index.js');

ffos_cli.installPackagedApp('boilerplate', './application.zip').then(function() {
  return ffos_cli.launchApp('boilerplate');
}, function(err) {
  console.error('ERROR :: ', err);
}).then(process.exit, process.exit);
