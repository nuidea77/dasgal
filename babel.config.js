module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Frame-processor worklets for react-native-vision-camera (must run before any other worklet plugin).
      //
      // When this plugin compiles a worklet it runs its own nested Babel pass
      // over the function body, loading @babel/plugin-transform-{template-
      // literals,shorthand-properties,arrow-functions} and
      // @babel/plugin-proposal-{optional-chaining,nullish-coalescing-operator}
      // by name — none of which it declares as dependencies. They are pinned in
      // our devDependencies for that reason: nothing imports them, so they look
      // unused, but dropping any one breaks the bundle with "Cannot find module"
      // on src/services/pose/usePoseDetector.ts. Keep them on the 7.x line —
      // 8.x wants @babel/core@8 and will not resolve.
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
