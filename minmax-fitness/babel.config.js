module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
    ],
    overrides: [
      {
        // WatermelonDB models use TypeScript `declare` fields with decorators.
        // Apply allowDeclareFields only to these files so the rest of the bundle
        // (including expo-router's pre-compiled JS) is not affected.
        test: /\/src\/core\/database\/models\//,
        exclude: /node_modules/,
        plugins: [
          ['@babel/plugin-transform-typescript', { allowDeclareFields: true }],
        ],
      },
    ],
  };
};
