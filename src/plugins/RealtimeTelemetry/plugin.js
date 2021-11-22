/**
 * Basic Realtime telemetry plugin using websockets.
 */

define([

], function (

) {

  function RealtimeTelemetryPlugin(desired_domain_object_type, target, IP, port) {
    return function (openmct) {
      const wsport = port;
      const socket = new WebSocket('ws://' + IP + ':' + wsport + '/realtime/' + target);
      let listeners = {};

      // This is the WebSockets function that gets called to push data updates from the real-time server to the real-time client
      // (see realtime-server.js/notifySubscribers())
      socket.onmessage = function (event) {
        point = JSON.parse(event.data);
        console.log(point)
        if (listeners[point.id]) {
          listeners[point.id].forEach(function (l) {
            l(point);
          });
        }
      };

      const provider = {
        supportsSubscribe: function (domainObject) {
          return domainObject.type === desired_domain_object_type;
        },
        subscribe: function (domainObject, callback, options) {
          if (!listeners[domainObject.identifier.key]) {
            listeners[domainObject.identifier.key] = [];
          }

          if (!listeners[domainObject.identifier.key].length) {
            socket.send('subscribe ' + domainObject.identifier.key);
          }

          listeners[domainObject.identifier.key].push(callback);

          return function () {
            listeners[domainObject.identifier.key] =
              listeners[domainObject.identifier.key].filter(function (c) {
                return c !== callback;
              });

            if (!listeners[domainObject.identifier.key].length) {
              socket.send('unsubscribe ' + domainObject.identifier.key);
            }
          };
        }
      };
      openmct.telemetry.addProvider(provider);
    };
  }
  return RealtimeTelemetryPlugin;
});
