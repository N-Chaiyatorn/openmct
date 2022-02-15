/**
 * Basic historical telemetry plugin.
 */

define([

], function (

) {

    function HistoricalTelemetryPlugin(desired_domain_object_type, IP, port) {
    //function HistoricalTelemetryPlugin() {

        return function install(openmct) {
            //var desired_domain_object_type = 'TFLEX.telemetry';
            var provider = {
                supportsRequest: function (domainObject) {
                    return domainObject.type === desired_domain_object_type;
                },
                request: function (domainObject, options) {
                    var url = 'http://' + IP + ':' + port + '/history/'
                        + domainObject.identifier.key
                        + '?start=' + options.start
                        + '&end=' + options.end;

                    return fetch(url).then(function (resp) {
                        const data = resp.json()
                        return data;
                    });
                }
            };

            openmct.telemetry.addProvider(provider);
        };
    }

    return HistoricalTelemetryPlugin;
});
