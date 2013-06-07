var net = require('net');

var RemoteDebugger = function RemoteDebugger() {

  var port = -1;

  var RemoteOperation = function RemoteOperation(actorName, message,
    onResponse, onError) {
    if (port == -1) {
      throw new Exception('No port setup');
    }
    var client = net.connect({'port': port}, (function connected() {
      // When connected ask for the list tab
      var msg = '{"to": "root", "type": "listTabs"}';
      client.write(msg.length + ':' + msg);
    }).bind(this));
    client.on('data', (function onData(data) {
      // Get the json object out of the protocol data
      data = data.toString();

      var currentObject;
      try {
        currentObject = JSON.parse(
        data.substr(data.indexOf(':') + 1));
      } catch (e) {
        onError(e + ' ::: ' + data);
      }

      //console.log(JSON.stringify(currentObject));

      if (!this.tabList && 'tabs' in currentObject) {
        // Wait till one data object contains the
        // tabs information, and extract the selected
        // actor from it
        var tabList = currentObject;
        if (!actorName in tabList) {
          onError('Could not find actor ' + actorName);
          client.end();
          return;
        }

        // Flag to know if we have tab list and
        // send the message to the proper actor
        this.tabList = tabList;
        this.actor = tabList[actorName];

        message.to = tabList[actorName];
        var msg = JSON.stringify(message);
        client.write(msg.length + ':' + msg);
      } else if (!('error' in currentObject) &&
        this.actor == currentObject.from) {
        // If this response is coming from the actor that
        // we were invoquin previously
        onResponse(currentObject);
        client.end();
      } else if ('error' in currentObject) {
        onError(currentObject);
      }
    }).bind(client));
    client.on('error', function(err) {
      onError();}
      );

    return client;
  };

  var init = function init(p) {
    port = p;
  };

  var installApp = function installApp(name, appType, callback) {
    var message = {
      type: 'install',
      appId: name,
      appType: appType
    };
    var op = RemoteOperation('webappsActor', message, function onResponse(data) {
      callback(null, data);
    }, function onError(e) {
      callback(e);
    });
  };

  return {
    'init': init,
    'installApp': installApp
  };
}();

module.exports = RemoteDebugger;
