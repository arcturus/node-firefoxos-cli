var remote = require('./remote_debugger')
    , ADB = require('adb').DebugBridge
    , Promise = require('promise');

var FFOS_Cli = function FFOS_Cli() {

  var config;
  var adb = new ADB();
  var remoteInitialized = false;
  var portForwarded = false;
  var localPort = 'tcp:6000';
  var remotePort = 'localfilesystem:/data/local/debugger-socket';

  var configure = function configure(json) {
    config = json;

    if (config) {
      localPort = config.localPort || localPort;
      remotePort = config.remotePort || remotePort;
    }
  };

  function ensureRemoteInit() {
    if (!remoteInitialized) {
      remote.init(localPort.split(':')[1]);
      remoteInitialized = true;
    }
  }

  function ensurePortForwarded() {
    if (!portForwarded) {
      portForwarded = true;

      return new Promise(function(resolve) {
        adb.forward(localPort, remotePort, resolve);
      });
    } else {
      return Promise.resolve();
    }
  }

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
  var screenshot = function screenshot(fileName) {
    return new Promise(function(resolve, reject) {
      adb.traceDevice(function onDevices(devices) {
        if (!devices || devices.length == 0) {
          reject('No devices');
        }
        var device = devices[0];
        try {
          device.takeSnapshot(function onSnapshot(frame) {
            frame.writeImageFile(fileName);
            resolve();
          });
        } catch (e) {
          reject(e);
        }
      });
    });
  };

  /*
    For installing an app just follow the steps:
    1.- Forward the remote debugger port (use config if present)
    2.- Upload the selected zip file to the app id
    3.- Use the remote client to tell the system to install the app
  */
  var installApp = function installApp(appId, localZip, appType) {
    return ensurePortForwarded().then(function onForward() {
      //Build the remote url with the appId
      var remoteFile = '/data/local/tmp/b2g/' + appId + '/application.zip';
      return pushFile(localZip, remoteFile).then(function onPushed(err, success) {
        // Know bug in adb library it returns error 15 despite of uploading the file
        if (err && err != 15) {
          return Promise.reject(err);
        }
        return installRemote(appId, appType);
      });
    });
  };

  /*
    For closing an app just follow the steps:
    1.- Forward the remote debugger port (use config if present)
    2.- Use the remote client to tell the system to stop the app
  */
  var closeApp = function closeApp(appId) {
    return appCommandRemote("close", appId, null);
  };

  /*
    For launching an app just follow the steps:
    1.- Forward the remote debugger port (use config if present)
    2.- Use the remote client to tell the system to launch the app
  */
  var launchApp = function launchApp(appId) {
    return appCommandRemote("launch", appId, null);
  };

  /*
    For launching any generic command just follow the steps:
    1.- Forward the remote debugger port (use config if present)
    2.- Use the remote client to tell the system to execute the command
  */
  var appCommand = function appCommand(command, appId, actor) {
    return appCommandRemote(command, appId, actor);
  };

  /*
    Shortcut of the previous function to install packaged apps
  */
  var installHostedApp = function installHostedApp(appId, manifestFile) {
    return installApp(appId, manifestFile, '1');
  };

  var installPackagedApp = function installPackagedApp(appId, localZip) {
    return installApp(appId, localZip, '2');
  };

  // Uses the remote protocol to tell the system to install an app
  // previously uploaded
  var installRemote = function installRemote(appId, appType) {
    ensureRemoteInit();
    return new Promise(function (resolve, reject) {
      remote.installApp(appId, appType, function onInstall(err, data) {
        if (err) {
          return reject(err);
        }
        resolve(data);
      });
    });
  };

  var appCommandRemote = function appCommandRemote(command, appId, actor) {
    ensureRemoteInit();
    return new Promise(function(resolve, reject) {
      remote.appCommand(command, appId, actor, function onLaunch(err, data) {
        if (err) {
          return reject(err);
        }
        resolve(data);
      });
    });
  };

  // Push a local file to a remote location on the phone
  var pushFile = function pushFile(local, remote) {
    return new Promise(function(resolve, reject) {
      adb.traceDevice(function onDevices(devices) {
        // Work with the first device we found, if any
        if (!devices || devices.length == 0) {
          return reject('No devices found');
        }
        var device = devices[0];

        device.getSyncService(function onSyncService(sync) {
          sync.pushFile(local, remote, resolve);
        });
      });
    });
  };

  // Resets the B2G process as the name says
  var resetB2G = function resetB2G() {
    return new Promise(function(resolve) {
      adb.traceDevice(function onDevices(devices) {
        for (var i = 0; i < devices.length; i++) {
          var device = devices[i];
          device.shellCmd('stop', ['b2g'], function onCmd(data) {
            device.shellCmd('start', ['b2g'], function onCmd(data) {
              resolve();
            });
          });
        }
      });
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
    'appCommand': appCommand,
    'resetB2G': resetB2G
  };

}();

module.exports = FFOS_Cli;
