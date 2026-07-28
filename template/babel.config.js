module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: [
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    "@babel/plugin-transform-export-namespace-from",
    "babel-plugin-transform-typescript-metadata",
    "babel-plugin-parameter-decorator",
    "react-native-reanimated/plugin",
    [
      "module-resolver",
      {
        alias: {
          "@app": "./src/app",
          "@app/*": "./src/app/*",
          "@pages": "./src/pages",
          "@pages/*": "./src/pages/*",
          "@widgets": "./src/widgets",
          "@widgets/*": "./src/widgets/*",
          "@features": "./src/features",
          "@features/*": "./src/features/*",
          "@entities": "./src/entities",
          "@entities/*": "./src/entities/*",
          "@shared": "./src/shared",
          "@shared/*": "./src/shared/*",
        },
      },
    ],
  ],
};
