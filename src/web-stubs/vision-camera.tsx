// Web-only stub so the app can be rendered in a browser for previews/screenshots.
import React from 'react';
import { View } from 'react-native';

export const Camera = Object.assign(
  (props: { style?: object }) => <View style={[{ backgroundColor: '#101625' }, props.style]} />,
  {
    getCameraPermissionStatus: () => 'granted',
    requestCameraPermission: async () => 'granted',
  },
);
export function useCameraDevice() {
  return { id: 'web-stub' };
}
export function useCameraFormat() {
  return undefined;
}
export function useFrameProcessor() {
  return undefined;
}
