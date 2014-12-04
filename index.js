var remote = require('./remote_debugger'),
    ADB = require('adb').DebugBridge;

var FFOS_Cli = function FFOS_Cli() {

  var config;
  var adb = new ADB();

  var configure = function configure(json) {
    config = json;
  };

  // Start displaying the logcat for the first device we find
  var logcat = function logcat() {
    adb.traceDevice(function onDevices(devices) {
      if (!devices || devices.length == 0) {
        return;
      }
      devices[0].logcat();
    });
  };

  // Takes a screenshot from device if any, pass a file name
  // and a callback to know when we finished.
  // The callback expected 1 parameter, in case an error
  // happened
  var screenshot = function screenshot(fileName, callback) {
    adb.traceDevice(function onDevices(devices) {
      if (!devices || devices.length == 0) {
        callback('No devices');
      }
      var device = devices[0];
      try {
        device.takeSnapshot(function onSnapshot(frame) {
          frame.writeImageFile(fileName);
          if (callback) {
            callback(null);
          }
        });
      } catch (e) {
        callback(e);
      }
    });
  };

  /*
    For installing an app just follow the steps:
    1.- Forward the remote debugger port (use config if present)
    2.- Upload the selected zip file to the app id
    3.- Use the remote client to tell the system to install the app
  */
  var installApp = function installApp(appId, localZip, appType, callback) {
    var localPort = 'tcp:6000';
    var remotePort = 'localfilesystem:/data/local/debugger-socket';
    if (config && config.localPort && config.remotePort) {
      localPort = config.localPort;
      remotePort = config.remotePort;
    }

    adb.forward(localPort, remotePort, function onForward() {
      //Build the remote url with the appId
      var remoteFile = '/data/local/tmp/b2g/' + appId + '/application.zip';
      console.log('Doing push for file ' + remoteFile);
      pushFile(localZip, remoteFile, function onPushed(err, success) {
        // Know bug in adb library it returns error 15 despite of uploading the file
        if (err && err != 15) {
          callback(err);
          return;
        }

        installRemote(localPort, appId, appType, callback);
      });
    });

  };

  
  /*
    For closing an app just follow the steps:
    1.- Forward the remote debugger port (use config if present)
    2.- Use the remote client to tell the system to stop the app
  */
  var closeApp = function closeApp(appId, callback) {
    var localPort = 'tcp:6000';
    var remotePort = 'localfilesystem:/data/local/debugger-socket';
    if (config && config.localPort && config.remotePort) {
      localPort = config.localPort;
      remotePort = config.remotePort;
    }

    adb.forward(localPort, remotePort, function onForward() {
      closeRemote(localPort, appId, callback);
    });
  };

  /*
    For launching an app just follow the steps:
    1.- Forward the remote debugger port (use config if present)
    2.- Use the remote client to tell the system to launch the app
  */
  var launchApp = function launchApp(appId, callback) {
    var localPort = 'tcp:6000';
    var remotePort = 'localfilesystem:/data/local/debugger-socket';
    if (config && config.localPort && config.remotePort) {
      localPort = config.localPort;
      remotePort = config.remotePort;
    }

    adb.forward(localPort, remotePort, function onForward() {
      launchRemote(localPort, appId, callback);
    });
  };

  /*
    Shortcut of the previous function to install packaged apps
  */
  var installHostedApp = function installHostedApp(appId,
    manifestFile, callback) {
    installApp(appId, manifestFile, '1', callback);
  };

  var installPackagedApp = function installPackagedApp(appId,
    localZip, callback) {
    installApp(appId, localZip, '2', callback);
  };

  // Uses the remote protocol to tell the system to install an app
  // previously uploaded
  var installRemote = function installRemote(remotePort, appId, appType, cb) {
    remote.init(remotePort.split(':')[1]);
    remote.installApp(appId, appType, function onInstall(err, data) {
      if (err) {
        cb(err);
        return;
      }
      cb(null, data);
    });
  };

  // Uses the remote protocol to tell the system to stop an app
  var closeRemote = function closeRemote(remotePort, appId, cb) {
    remote.init(remotePort.split(':')[1]);
    remote.closeApp(appId, function onClose(err, data) {
      if (err) {
        cb(err);
        return;
      }
      cb(null, data);
    });
  };

  // Uses the remote protocol to tell the system to launch an app
  var launchRemote = function launchRemote(remotePort, appId, cb) {
    remote.init(remotePort.split(':')[1]);
    remote.launchApp(appId, function onLaunch(err, data) {
      if (err) {
        cb(err);
        return;
      }
      cb(null, data);
    });
  };

  // Push a local file to a remote location on the phone
  var pushFile = function pushFile(local, remote, callback) {
    adb.traceDevice(function onDevices(devices) {
      // Work with the first device we found, if any
      if (!devices || devices.length == 0) {
        callback('No devices found');
        return;
      }
      var device = devices[0];

      device.getSyncService(function onSyncService(sync) {
        sync.pushFile(local, remote, callback);
      });
    });
  };

  // Resets the B2G process as the name says
  var resetB2G = function resetB2G(callback) {
    adb.traceDevice(function onDevices(devices) {
      for (var i = 0; i < devices.length; i++) {
        var device = devices[i];
        device.shellCmd('stop', ['b2g'], function onCmd(data) {
            device.shellCmd('start', ['b2g'], function onCmd(data) {
              if (callback) {
                callback();
              }
            });
        });
      }
    });
  };

  return {
    'config': config,
    'logcat': logcat,
    'screenshot': screenshot,
    'installHostedApp': installHostedApp,
    'installPackagedApp': installPackagedApp,
    'closeApp': closeApp,
    'launchApp': launchApp,
    'resetB2G': resetB2G
  };

}();

module.exports = FFOS_Cli;
