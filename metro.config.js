const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Bundle TensorFlow Lite models as static assets so `require('./assets/models/x.tflite')` works.
config.resolver.assetExts = Array.from(new Set([...config.resolver.assetExts, 'tflite', 'task']));

module.exports = config;
