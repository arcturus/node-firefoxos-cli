var ffos_cli = require('./index.js');

ffos_cli.installPackagedApp('boilerplate', './application.zip', function onInstall(err, done) {
  if (err) {
    console.error('Error updating app: ' + err);
  } else {
    console.log('Successfuly installed');
  }
  process.exit(0);
});

