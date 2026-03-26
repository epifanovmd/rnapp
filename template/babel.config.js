module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: [
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    "babel-plugin-transform-typescript-metadata",
    "babel-plugin-parameter-decorator",
    "react-native-reanimated/plugin",
    [
      "module-resolver",
      {
        alias: {
          "@core/": "./src/core",
          "@core/*": "./src/core/*",
          "@api": "./src/api",
          "@api/*": "./src/api/*",
          "@common": "./src/common",
          "@common/*": "./src/common/*",
          "@components": "./src/components",
          "@components/*": "./src/components/*",
          "@models": "./src/models",
          "@models/*": "./src/models/*",
          "@socket": "./src/socket",
          "@socket/*": "./src/socket/*",
          "@store": "./src/store",
          "@store/*": "./src/store/*",
          "@navigation": "./src/navigation",
          "@navigation/*": "./src/navigation/*",
        },
      },
    ],
  ],
};
