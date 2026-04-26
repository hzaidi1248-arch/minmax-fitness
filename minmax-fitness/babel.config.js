module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // TypeScript must run FIRST so `declare` fields are stripped before decorator transforms
      ['@babel/plugin-transform-typescript', { allowDeclareFields: true }],
      // WatermelonDB decorators — must come after TypeScript transform
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      ['@babel/plugin-proposal-class-properties', { loose: true }],
      // Must be last
      'react-native-reanimated/plugin',
    ],
  };
};
