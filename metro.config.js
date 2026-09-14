const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Bundle TensorFlow Lite models as static assets so `require('./assets/models/x.tflite')` works.
config.resolver.assetExts = Array.from(new Set([...config.resolver.assetExts, 'tflite', 'task']));

// Native-only modules are replaced with lightweight stubs on web so the UI can be previewed in a browser.
const WEB_STUBS = {
  'react-native-vision-camera': path.resolve(__dirname, 'src/web-stubs/vision-camera.tsx'),
  'react-native-fast-tflite': path.resolve(__dirname, 'src/web-stubs/fast-tflite.ts'),
  'vision-camera-resize-plugin': path.resolve(__dirname, 'src/web-stubs/resize-plugin.ts'),
  'react-native-worklets-core': path.resolve(__dirname, 'src/web-stubs/worklets-core.ts'),
  'expo-notifications': path.resolve(__dirname, 'src/web-stubs/expo-notifications.ts'),
  '@kingstinct/react-native-healthkit': path.resolve(__dirname, 'src/web-stubs/healthkit.ts'),
  'react-native-health-connect': path.resolve(__dirname, 'src/web-stubs/health-connect.ts'),
};
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && WEB_STUBS[moduleName]) {
    return { type: 'sourceFile', filePath: WEB_STUBS[moduleName] };
  }
  return defaultResolveRequest ? defaultResolveRequest(context, moduleName, platform) : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
