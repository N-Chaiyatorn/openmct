define([], function () {
  function fprimeObjectPlugin(options) {
    async function getMetadata(dataType) {
      return fetch(
        `/src/plugins/fprimeObject/metadata/${options.namespace}${dataType}Points.json`
      ).then((response) => {
        return response.json();
      });
    }

    // An object provider builds Domain Objects
    const objectProvider = {
      get: async function (identifier) {
        if (identifier.key === `${options.namespace}.root`) {
          return {
            identifier: identifier,
            name: options.namespace,
            type: "folder",
            location: "ROOT",
          };
        }
        if (identifier.key === `${options.namespace}.channels`) {
          return {
            identifier: identifier,
            name: `${options.namespace} Channels`,
            type: "folder",
            location: `${options.namespace}:${options.namespace}.root`,
          };
        }
        if (identifier.key === `${options.namespace}.events`) {
          return {
            identifier: identifier,
            name: `${options.namespace} Events`,
            type: "folder",
            location: `${options.namespace}:${options.namespace}.root`,
          };
        }
        if (identifier.key === `${options.namespace}.commands`) {
          return {
            identifier: identifier,
            name: `${options.namespace} Commands`,
            type: "folder",
            location: `${options.namespace}:${options.namespace}.root`,
          };
        } else {
          const channelDict = await getMetadata("Channel");
          const eventDict = await getMetadata("Event");
          const commandDict = await getMetadata("Command");
          const packetDict = await getMetadata("Packets");

          if (
            packetDict[`${options.namespace}Channels`].points.indexOf(
              identifier.key
            ) !== -1
          ) {
            const measurement = channelDict.points.filter(function (m) {
              return m.name === identifier.key;
            })[0];
            return {
              identifier: identifier,
              name: measurement.name,
              type: `${options.namespace}.telemetry`,
              telemetry: {
                values: measurement.values,
              },
              location: `${options.namespace}:${options.namespace}.channels`,
            };
          } else if (
            packetDict[`${options.namespace}Events`].points.indexOf(
              identifier.key
            ) !== -1
          ) {
            const measurement = eventDict.points.filter(function (m) {
              return m.name === identifier.key;
            })[0];
            return {
              identifier: identifier,
              name: measurement.name,
              type: `${options.namespace}.telemetry`,
              telemetry: {
                values: measurement.values,
              },
              location: `${options.namespace}:${options.namespace}.events`,
            };
          }
          if (
            packetDict[`${options.namespace}Commands`].points.indexOf(
              identifier.key
            ) !== -1
          ) {
            const measurement = commandDict.points.filter(function (m) {
              return m.name === identifier.key;
            })[0];
            return {
              identifier: identifier,
              name: measurement.name,
              type: `${options.namespace}.telemetry`,
              telemetry: {
                values: measurement.values,
              },
              location: `${options.namespace}:${options.namespace}.commands`,
            };
          }
        }
      },
    };

    // The composition of a domain object is the list of objects it contains, as shown (for example) in the tree for browsing.
    // Can be used to populate a hierarchy under a custom root-level object based on the contents of a telemetry dictionary.
    // "appliesTo"  returns a boolean value indicating whether this composition provider applies to the given object
    // "load" returns an array of Identifier objects (like the channels this telemetry stream offers)
    const compositionProvider = {
      appliesTo: function (domainObject) {
        return (
          domainObject.identifier.namespace === options.namespace &&
          domainObject.type === "folder"
        );
      },
      load: async function (domainObject) {
        if (
          domainObject.type === "folder" &&
          domainObject.identifier.key.includes("root")
        ) {
          return [
            {
              namespace: options.namespace,
              key: `${options.namespace}.channels`,
            },
            {
              namespace: options.namespace,
              key: `${options.namespace}.events`,
            },
            {
              namespace: options.namespace,
              key: `${options.namespace}.commands`,
            },
          ];
        } else if (domainObject.identifier.key.includes("channels")) {
          return getMetadata("Channel").then((channelDict) => {
            return channelDict.points.map((m) => {
              return { namespace: options.namespace, key: m.name };
            });
          });
        } else if (domainObject.identifier.key.includes("events")) {
          return getMetadata("Event").then((eventDict) => {
            return eventDict.points.map((m) => {
              return { namespace: options.namespace, key: m.name };
            });
          });
        } else if (domainObject.identifier.key.includes("commands")) {
          return getMetadata("Command").then((commandDict) => {
            return commandDict.points.map((m) => {
              return { namespace: options.namespace, key: m.name };
            });
          });
        }
      },
    };

    return function install(openmct) {
      openmct.objects.addRoot({
        namespace: options.namespace,
        key: `${options.namespace}.root`,
      });

      openmct.objects.addProvider(options.namespace, objectProvider);

      openmct.composition.addProvider(compositionProvider);

      openmct.types.addType(`${options.namespace}.telemetry`, {
        name: `${options.namespace} Telemetry Point`,
        description: `Telemetry of ${options.namespace}`,
        cssClass: "icon-telemetry",
      });
    };
  }

  return fprimeObjectPlugin;
});
