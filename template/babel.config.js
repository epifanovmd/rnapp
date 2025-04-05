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
          "@api": "./src/api",
          "@api/*": "./src/api/*",
          "@common": "./src/common",
          "@common/*": "./src/common/*",
          "@components": "./src/components",
          "@components/*": "./src/components/*",
          "@models": "./src/models",
          "@models/*": "./src/models/*",
          "@service": "./src/service",
          "@service/*": "./src/service/*",
          "@store": "./src/store",
          "@store/*": "./src/store/*",
          "@theme": "./src/theme",
          "@theme/*": "./src/theme/*",
        },
      },
    ],
  ],
};
