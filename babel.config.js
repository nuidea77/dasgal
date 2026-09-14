module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Frame-processor worklets for react-native-vision-camera (must run before any other worklet plugin).
      ['react-native-worklets-core/plugin'],
      [
        'module-resolver',
        {
          root: ['./'],
          alias: { '@': './src' },
        },
      ],
    ],
  };
};
