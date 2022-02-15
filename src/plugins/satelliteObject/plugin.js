define([], function () {
  function satelliteObjectPlugin(options) {
    async function getMetadata(namespace) {
      return fetch(
        `/src/plugins/satelliteObject/metadata/${namespace}Satellite.json`
      ).then((response) => {
        return response.json();
      });
    }

    // An object provider builds Domain Objects
    const objectProvider = {
      get: async function (identifier) {
        const identifierKeyArray = identifier.key.split(".");
        const objectLevel = identifierKeyArray.length;
        const satelliteDict = await getMetadata(options.namespace);

        if (identifier.key === `${options.namespace}.root`) {
          return {
            identifier: identifier,
            name: options.namespace,
            type: "folder",
            location: "ROOT",
          };
        }
        if (objectLevel === 2) {
          return {
            identifier: identifier,
            name: `${identifierKeyArray[1]}`,
            type: "folder",
            location: `${options.namespace}:${options.namespace}.root`,
          };
        }
        if (objectLevel === 3) {
          return {
            identifier: identifier,
            name: `${
              satelliteDict.subsystems[identifierKeyArray[1]].hardwares[
                identifierKeyArray[2]
              ].name
            }`,
            type: "folder",
            location: `${options.namespace}:${options.namespace}.${identifierKeyArray[1]}`,
          };
        } else {
          const telemetry = satelliteDict.subsystems[
            identifierKeyArray[1]
          ].hardwares[identifierKeyArray[2]].points.filter(function (
            telemetryMetadata
          ) {
            return (
              telemetryMetadata.key.split(".")[(2, 3)] ===
              identifierKeyArray[(2, 3)]
            );
          })[0];
          return {
            identifier: identifier,
            name: telemetry.name,
            type: `${options.namespace}.telemetry`,
            telemetry: {
              values: telemetry.values,
            },
            location: `${options.namespace}:${options.namespace}.${identifierKeyArray[1]}.${identifierKeyArray[2]}`,
          };
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
        const satelliteDict = await getMetadata(options.namespace);

        const subsystemsMap = Object.keys(satelliteDict.subsystems);
        const hardwaresMap = {};
        const telemetryMap = {};

        Object.entries(satelliteDict.subsystems).forEach((subsystem) => {
          const subsystemName = subsystem[0];
          const subsystemMetadata = subsystem[1];
          const hardwaresNameArray = Object.keys(subsystemMetadata.hardwares);
          hardwaresMap[subsystemName] = hardwaresNameArray;
        });

        Object.values(satelliteDict.subsystems).forEach((subsystemMetadata) => {
          Object.entries(subsystemMetadata.hardwares).forEach((hardware) => {
            const hardwareMetadata = hardware[1];
            const telemetryNameArray = hardwareMetadata.points.map((point) => {
              return point.key.split(".")[3];
            });
            telemetryMap[hardwareMetadata.key] = telemetryNameArray;
          });
        });

        const objectKeyArray = domainObject.identifier.key.split(".");
        const objectLevel = objectKeyArray.length;

        if (
          domainObject.type === "folder" &&
          domainObject.identifier.key.includes("root")
        ) {
          const satelliteSubsystem = subsystemsMap.map((subsystemKey) => {
            return {
              namespace: options.namespace,
              key: `${options.namespace}.${subsystemKey}`,
            };
          });
          return satelliteSubsystem;
        } else if (domainObject.type === "folder" && objectLevel === 2) {
          const subsystemName = objectKeyArray[1];
          const subsystemHardwares = hardwaresMap[subsystemName].map(
            (hardware) => {
              return {
                namespace: options.namespace,
                key: `${domainObject.identifier.key}.${hardware}`,
              };
            }
          );
          return subsystemHardwares;
        } else if (domainObject.type === "folder" && objectLevel === 3) {
          const hardwareTelemetry = telemetryMap[
            domainObject.identifier.key
          ].map((telemetry) => {
            return {
              namespace: options.namespace,
              key: `${domainObject.identifier.key}.${telemetry}`,
            };
          });
          return hardwareTelemetry;
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

  return satelliteObjectPlugin;
});
