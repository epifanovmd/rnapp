const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    resolveRequest: function packageExportsResolver(
      context,
      moduleImport,
      platform,
    ) {
      // Use the browser version of the package for React Native
      if (moduleImport === "axios" || moduleImport.startsWith("axios/")) {
        return context.resolveRequest(
          {
            ...context,
            unstable_conditionNames: ["browser"],
          },
          moduleImport,
          platform,
        );
      }

      // Fall back to normal resolution
      return context.resolveRequest(context, moduleImport, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
