# Firefox OS Node Command Line Develoment Tools

node library + command line tool to perform basic web app development on Firefox OS phones.


## Currenty supporting

- Installing app
- Taking screenshots
- Logcat
- Reset b2g process
- Close App
- Launch App

## Next to come

- Uninstall

Based on @fabricedesr amazing work on [b2gremote](https://github.com/fabricedesre/b2gremote)
and
digitalrald for his work on [make-fxos-install](https://github.com/digitarald/make-fxos-install)

## Don't forget
Enable remote debugging in the device

```shell
npm install
```

## Examples

In the `examples` folder you could find some code that shows the use of this library, also find below some code examples.

#### Installing

```javascript
var ffos_cli = require('node-firefoxos-cli');

ffos_cli.installPackagedApp('boilerplate', './application.zip').then(
  function() {
    console.log('Successfuly installed');
  },
  function(err) {
    console.error('Error updating app: ' + err);
  }
).then(process.exit, process.exit);
```

#### Launching an app

```javascript
var ffos_cli = require('node-firefoxos-cli');

ffos_cli.launchApp('boilerplate').then(process.exit);

```

#### Stopping an app

```javascript
var ffos_cli = require('node-firefoxos-cli');

ffos_cli.closeApp('boilerplate').then(process.exit);
```

### Reset B2G process

```javascript
var ffos_cli = require('node-firefoxos-cli');

ffos_cli.resetB2G().then(function onReset() {
  console.log('B2G process reseted');
  process.exit(0);
});
```

### Logcat

```javascript
var ffos_cli = require('node-firefoxos-cli');

//Output logcat from device continously
ffos_cli.logcat();
```
