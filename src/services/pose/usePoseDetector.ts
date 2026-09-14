import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrameProcessor, useCameraDevice, useCameraFormat, Camera } from 'react-native-vision-camera';
import { useTensorflowModel, type TensorflowModelDelegate } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { Worklets } from 'react-native-worklets-core';
import { Pose } from '@/domain/pose/types';
import { PoseSmoother } from '@/domain/pose/geometry';
import { decodeMoveNet, MOVENET_INPUT_SIZE } from './movenet';

const MODEL_DELEGATES: TensorflowModelDelegate[] = [];

export interface PoseDetectorOptions {
  cameraPosition: 'front' | 'back';
  /** Target inference rate. The camera keeps streaming at its native fps; inference is throttled. */
  targetFps?: number;
  enabled: boolean;
}

export interface PoseDetectorState {
  device: ReturnType<typeof useCameraDevice>;
  format: ReturnType<typeof useCameraFormat>;
  frameProcessor: ReturnType<typeof useFrameProcessor> | undefined;
  modelState: 'loading' | 'loaded' | 'error';
  modelError?: Error;
  /** Latest smoothed pose in normalised model coordinates (upright orientation). */
  pose: Pose | null;
  /** Measured inference FPS. */
  fps: number;
  /** Size of the upright image the pose coordinates refer to. */
  imageSize: { width: number; height: number };
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

/**
 * Runs MoveNet Lightning on-device inside a VisionCamera frame processor.
 *
 * Privacy: frames live only in native memory for the duration of the worklet.
 * Only the 17 (x, y, score) triples cross to JS — never pixels.
 */
export function usePoseDetector(options: PoseDetectorOptions): PoseDetectorState {
  const targetFps = options.targetFps ?? 24;
  const device = useCameraDevice(options.cameraPosition);
  const format = useCameraFormat(device, [
    { videoResolution: { width: 640, height: 480 } },
    { fps: 30 },
  ]);
  // MoveNet Lightning int8 runs in ~10–15 ms on the CPU (XNNPACK); quantized ops are not fully
  // supported by the CoreML/GPU delegates, so the CPU path is the safe, fast default.
  const model = useTensorflowModel(require('../../../assets/models/movenet_singlepose_lightning_int8.tflite'), MODEL_DELEGATES);
  const { resize } = useResizePlugin();
  const [pose, setPose] = useState<Pose | null>(null);
  const [fps, setFps] = useState(0);
  const [hasPermission, setHasPermission] = useState(Camera.getCameraPermissionStatus() === 'granted');
  const smoother = useMemo(() => new PoseSmoother(0.6), []);
  const fpsWindow = useRef<number[]>([]);
  const imageSize = useRef({ width: 480, height: 640 });

  const requestPermission = useCallback(async () => {
    const status = await Camera.requestCameraPermission();
    const ok = status === 'granted';
    setHasPermission(ok);
    return ok;
  }, []);

  useEffect(() => {
    if (!hasPermission) void requestPermission();
  }, [hasPermission, requestPermission]);

  // Called from the worklet with the decoded keypoints.
  const onResult = useMemo(
    () =>
      Worklets.createRunOnJS((flat: number[], ts: number, width: number, height: number) => {
        imageSize.current = { width, height };
        const raw = decodeMoveNet(flat, ts);
        setPose(smoother.smooth(raw));
        const win = fpsWindow.current;
        win.push(ts);
        while (win.length > 0 && ts - win[0]! > 1000) win.shift();
        setFps(win.length);
      }),
    [smoother],
  );

  const tflite = model.state === 'loaded' ? model.model : undefined;
  const enabled = options.enabled;

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      if (!enabled || tflite == null) return;
      // Throttle inference to targetFps to keep the device cool while the preview stays smooth.
      const now = Date.now();
      // @ts-expect-error – ad-hoc global on the worklet runtime
      const last: number = globalThis.__dasgalLastInference ?? 0;
      if (now - last < 1000 / targetFps) return;
      // @ts-expect-error – ad-hoc global on the worklet runtime
      globalThis.__dasgalLastInference = now;

      // Rotate to upright and stretch to the square model input.
      const isPortraitSensor = frame.orientation === 'portrait' || frame.orientation === 'portrait-upside-down';
      const rotation = isPortraitSensor ? '0deg' : '90deg';
      const resized = resize(frame, {
        scale: { width: MOVENET_INPUT_SIZE, height: MOVENET_INPUT_SIZE },
        pixelFormat: 'rgb',
        dataType: 'uint8',
        rotation,
      });
      // Pass exactly the resized bytes (the plugin may reuse a larger backing buffer).
      const inputBuffer = resized.buffer.slice(resized.byteOffset, resized.byteOffset + resized.byteLength) as ArrayBuffer;
      const outputs = tflite.runSync([inputBuffer]);
      const raw = outputs[0];
      if (raw == null) return;
      const out = new Float32Array(raw);
      const flat: number[] = new Array(51);
      for (let i = 0; i < 51; i++) flat[i] = out[i] ?? 0;
      const uprightWidth = rotation === '90deg' ? frame.height : frame.width;
      const uprightHeight = rotation === '90deg' ? frame.width : frame.height;
      onResult(flat, now, uprightWidth, uprightHeight);
    },
    [tflite, enabled, targetFps, resize, onResult],
  );

  useEffect(() => {
    if (!enabled) {
      smoother.reset();
      setPose(null);
    }
  }, [enabled, smoother]);

  return {
    device,
    format,
    frameProcessor: enabled ? frameProcessor : undefined,
    modelState: model.state,
    modelError: model.state === 'error' ? model.error : undefined,
    pose,
    fps,
    imageSize: imageSize.current,
    hasPermission,
    requestPermission,
  };
}
