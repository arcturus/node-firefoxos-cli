# Firefox OS Node Command Line Develoment Tools

node library + command line tool to perform basic web app development stuff


## Currenty supporting

- Installing app
- Taking screenshots
- Logcat
- Reset b2g process

## Next to come

- Uninstall
- Launch

Based on @fabricedesr amazing work on [b2gremote](https://github.com/fabricedesre/b2gremote)
and
digitalrald for his work on [make-fxos-install](https://github.com/digitarald/make-fxos-install)

## Don't forget
Enable remote debugging in the device and of course run

```shell
npm install
```

## Examples

In the `examples` folder you could find some code that shows the use of this library, also find below some code examples.

#### Installing

```javascript
var ffos_cli = require('./index.js');

ffos_cli.installPackagedApp('boilerplate', './application.zip', function onInstall(err, done) {
  if (err) {
    console.error('Error updating app: ' + err);
  } else {
    console.log('Successfuly installed');
  }
  process.exit(0);
});
```

### Reset B2G process

```javascript
var ffos_cli = require('./index.js');

ffos_cli.resetB2G(function onReset() {
  console.log('B2G process reseted');
  process.exit(0);
});
```

### Logcat

```javascript
var ffos_cli = require('./index.js');

ffos_cli.logcat(); //Output logcat from device continously
```


