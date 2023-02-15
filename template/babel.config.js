module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    ['@babel/plugin-proposal-decorators', {legacy: true}],
    'babel-plugin-transform-typescript-metadata',
    'babel-plugin-parameter-decorator',
  ],
};
