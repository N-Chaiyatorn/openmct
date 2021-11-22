/**
 * Basic historical telemetry plugin.
 */

define([

], function (

) {

    function HistoricalTelemetryPlugin(desired_domain_object_type, target, IP, port) {
    //function HistoricalTelemetryPlugin() {

        return function install(openmct) {
            //var desired_domain_object_type = 'TFLEX.telemetry';
            var provider = {
                supportsRequest: function (domainObject) {
                    return domainObject.type === desired_domain_object_type;
                },
                request: function (domainObject, options) {
                    var url = 'http://' + IP + ':' + port + '/history/' + target + '/'
                        + domainObject.identifier.key
                        + '?start=' + options.start
                        + '&end=' + options.end;
                    console.log('historical-telemetry-plugin.js: send request = ' + url);

                    return fetch(url).then(function (resp) {
                        console.log(resp);
                        return resp.json();
                    });
                    
                }
            };

            openmct.telemetry.addProvider(provider);
        };
    }

    return HistoricalTelemetryPlugin;
});
