import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Alert, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { RootScreenProps } from '@/app/navigation/types';
import { Body, Button } from '@/components/ui';
import { ExerciseVideo, hasExerciseVideo } from '@/components/ExerciseVideo';
import { FramingGuide } from '@/components/FramingGuide';
import { Icon } from '@/components/Icon';
import { PoseOverlay } from '@/components/PoseOverlay';
import { createAnalyzer } from '@/domain/pose/analyzers';
import { evaluateFraming } from '@/domain/pose/framing';
import { ExerciseAnalyzer } from '@/domain/pose/repEngine';
import { mapPoseToView } from '@/domain/pose/viewMapping';
import { FeedbackKey } from '@/domain/pose/feedback';
import { PlannedExercise, estimateCalories, todayIso } from '@/domain/plan/generator';
import { sessionProgress } from '@/domain/workout/completion';
import { getExercise } from '@/domain/plan/exercises';
import { format, useT } from '@/i18n';
import { usePoseDetector } from '@/services/pose/usePoseDetector';
import { voiceCoach } from '@/services/voice/coach';
import { clearMotivationForToday } from '@/services/notifications/scheduler';
import { syncWorkout } from '@/services/health/sync';
import { usePlanStore } from '@/store/usePlanStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useUserStore } from '@/store/useUserStore';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import { createSession, currentExercise, sessionReducer, summarize } from './sessionReducer';

export function WorkoutSessionScreen({ route, navigation }: RootScreenProps<'WorkoutSession'>) {
  useKeepAwake();
  const t = useT();
  const plan = usePlanStore((s) => s.plan);
  const markCompleted = usePlanStore((s) => s.markCompleted);
  const recordWorkout = useProgressStore((s) => s.recordWorkout);
  const profile = useUserStore((s) => s.profile);
  const settings = useSettingsStore();
  const day = plan?.days.find((d) => d.dayIndex === route.params.dayIndex);

  const [state, dispatch] = useReducer(sessionReducer, day?.exercises ?? [], createSession);
  const [viewSize, setViewSize] = useState({ width: 1, height: 1 });
  const [feedback, setFeedback] = useState<FeedbackKey | null>(null);
  const [cheer, setCheer] = useState<string | null>(null);
  const startedAt = useRef(new Date());
  const finishedRef = useRef(false);

  const pe = currentExercise(state);
  const exercise = pe ? getExercise(pe.exerciseId) : null;
  const detectorEnabled = state.status === 'positioning' || state.status === 'countdown' || state.status === 'exercising';
  const detector = usePoseDetector({ cameraPosition: settings.cameraPosition, enabled: detectorEnabled, targetFps: 24 });

  // One analyzer per exercise/set so state (phase, reps) resets cleanly.
  const analyzerRef = useRef<ExerciseAnalyzer | null>(null);
  useEffect(() => {
    analyzerRef.current = exercise?.analyzer ? createAnalyzer(exercise.analyzer) : null;
  }, [exercise?.analyzer, state.exerciseIndex, state.setIndex]);

  // 1 Hz clock for countdown / rest / timed sets.
  useEffect(() => {
    if (state.status === 'complete' || state.status === 'paused') return;
    const id = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(id);
  }, [state.status]);

  // Framing check + pose analysis on every new pose.
  const framing = useMemo(
    () => evaluateFraming(detector.pose, { required: exercise?.requiredJoints ?? [] }),
    [detector.pose, exercise?.requiredJoints],
  );
  useEffect(() => {
    if (state.status === 'positioning' && framing.status === 'ok') dispatch({ type: 'FRAMING_OK' });
  }, [framing.status, state.status]);

  useEffect(() => {
    if (state.status !== 'exercising' || !detector.pose || !analyzerRef.current) return;
    const result = analyzerRef.current.process(framing.status === 'no_person' ? null : detector.pose);
    dispatch({ type: 'ANALYSIS', result });
    const correction = result.feedback.find((f) => f !== 'good_rep' && f !== 'perfect');
    setFeedback(correction ?? null);
    if (correction) voiceCoach.feedback(correction);
  }, [detector.pose, state.status, framing.status]);

  // Voice / haptics reactions to state changes.
  const lastCountdown = useRef<number | null>(null);
  useEffect(() => {
    if (state.status === 'countdown' && state.countdown !== lastCountdown.current) {
      lastCountdown.current = state.countdown;
      if (state.countdown === 3 || state.countdown === 2 || state.countdown === 1) voiceCoach.countdown(state.countdown);
    }
    if (state.status === 'exercising' && lastCountdown.current !== 0) {
      lastCountdown.current = 0;
      voiceCoach.go();
    }
  }, [state.status, state.countdown]);

  useEffect(() => {
    if (state.event === 'rep') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      voiceCoach.countRep(state.currentReps);
      // Milestone encouragement: halfway, then the last three reps.
      if (pe && pe.target >= 8) {
        const left = pe.target - state.currentReps;
        const key = `${state.exerciseIndex}-${state.setIndex}-${state.currentReps}`;
        if (state.currentReps === Math.ceil(pe.target / 2)) {
          showCheer(t.workout.cheerHalfway, key);
        } else if (left === 1) {
          showCheer(t.workout.cheerLastOne, key);
        } else if (left > 0 && left <= 3) {
          showCheer(format(t.workout.cheerLast, { n: left }), key);
        }
      }
    } else if (state.event === 'set_done' || state.event === 'exercise_done') {
      showCheer(t.workout.cheerSetDone, `done-${state.exerciseIndex}-${state.setIndex}`);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      voiceCoach.setDone();
      setTimeout(() => voiceCoach.restStart(state.restLeft), 1500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.event, state.currentReps]);

  useEffect(() => {
    if (state.status === 'rest' && state.restLeft === 3) voiceCoach.restEnd();
  }, [state.status, state.restLeft]);

  // Show a cheer for a moment and speak it once.
  const cheerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showCheer = useCallback((text: string, key: string) => {
    setCheer(text);
    voiceCoach.cheer(text, key);
    if (cheerTimer.current) clearTimeout(cheerTimer.current);
    cheerTimer.current = setTimeout(() => setCheer(null), 1800);
  }, []);
  useEffect(() => () => { if (cheerTimer.current) clearTimeout(cheerTimer.current); }, []);

  // Persist the result and go to the celebration screen.
  useEffect(() => {
    if (state.status !== 'complete' || finishedRef.current || !day || !profile) return;
    finishedRef.current = true;
    voiceCoach.workoutDone();
    const { totalReps, totalHoldSeconds, avgQuality } = summarize(state);
    const records = state.records.filter(Boolean);
    const calories = estimateCalories(
      records.map((r) => ({ exerciseId: r.exerciseId, count: getExercise(r.exerciseId).countingMode === 'reps_ai' ? r.reps : r.holdSeconds })),
      profile.weightKg,
    );
    const endedAt = new Date();
    const record = {
      id: `${day.date}-${endedAt.getTime()}`,
      date: todayIso(endedAt),
      dayIndex: day.dayIndex,
      startedAt: startedAt.current.toISOString(),
      endedAt: endedAt.toISOString(),
      durationSec: Math.round((endedAt.getTime() - startedAt.current.getTime()) / 1000),
      exercises: records,
      totalReps,
      totalHoldSeconds,
      calories,
      avgQuality,
      intensity: day.intensity,
    };
    // Quitting early still banks the work and its XP, but the day only ticks
    // off once enough of the plan was actually done.
    const progress = sessionProgress(day.exercises, records);
    const scheduled = plan?.days.filter((d) => d.kind === 'workout').map((d) => d.date) ?? [];
    const completedCount = Object.keys(usePlanStore.getState().completedDates).length + (progress.complete ? 1 : 0);
    const programFinished = progress.complete && completedCount >= scheduled.length;
    const outcome = recordWorkout(record, scheduled, programFinished);
    if (outcome.xpGained === 0) {
      // Nothing was done: leave the day open and go back without a celebration.
      navigation.popToTop();
      return;
    }
    if (progress.complete) markCompleted(day.date, record.id);
    void clearMotivationForToday(record.date);
    if (useSettingsStore.getState().healthSyncEnabled) {
      // Fire-and-forget: the health store must never delay the celebration.
      void syncWorkout({ ...record, xp: outcome.xpGained }, t.complete.healthTitle);
    }
    navigation.replace('WorkoutComplete', { record: { ...record, xp: outcome.xpGained }, outcome, progress });
  }, [state, day, profile, plan, recordWorkout, markCompleted, navigation, t]);

  useEffect(() => () => voiceCoach.stop(), []);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setViewSize({ width, height });
  }, []);

  const viewPose = useMemo(
    () =>
      detector.pose
        ? mapPoseToView(detector.pose, {
            viewWidth: viewSize.width,
            viewHeight: viewSize.height,
            imageWidth: detector.imageSize.width,
            imageHeight: detector.imageSize.height,
            mirror: settings.cameraPosition === 'front',
            resizeMode: 'cover',
          })
        : null,
    [detector.pose, viewSize, detector.imageSize, settings.cameraPosition],
  );

  // Leaving early is not all-or-nothing: what was done can be banked, and the
  // dialog says exactly how much that is before anything is thrown away.
  const quit = () => {
    const { totalReps, totalHoldSeconds } = summarize(state);
    const progress = day ? sessionProgress(day.exercises, state.records.filter(Boolean)) : null;
    const percent = Math.round((progress?.ratio ?? 0) * 100);
    const didSomething = totalReps > 0 || totalHoldSeconds > 0;
    const body = didSomething
      ? format(t.workout.quitProgress, { percent, reps: totalReps + Math.round(totalHoldSeconds / 3) }) +
        '\n\n' +
        (progress?.complete ? t.workout.quitCountsDone : t.workout.quitCountsPartial)
      : t.workout.quitNothing;
    dispatch({ type: 'PAUSE' });
    Alert.alert(t.workout.quitTitle, body, [
      { text: t.workout.quitResume, style: 'cancel', onPress: () => dispatch({ type: 'RESUME' }) },
      ...(didSomething ? [{ text: t.workout.quitSave, onPress: () => dispatch({ type: 'FINISH' as const }) }] : []),
      { text: t.workout.quitDiscard, style: 'destructive' as const, onPress: () => navigation.goBack() },
    ]);
  };

  if (!day || !pe || !exercise) return null;
  const name = t.exercises[pe.exerciseId as keyof typeof t.exercises]?.name ?? pe.exerciseId;
  const cameraActive = detectorEnabled && detector.hasPermission && detector.device != null;

  return (
    <View style={styles.root}>
      <View style={styles.cameraBox} onLayout={onLayout}>
        {detector.device && detector.hasPermission ? (
          <Camera
            style={StyleSheet.absoluteFill}
            device={detector.device}
            format={detector.format}
            isActive={cameraActive}
            frameProcessor={detector.frameProcessor}
            pixelFormat="yuv"
            resizeMode="cover"
            enableZoomGesture={false}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            <Body muted>{detector.hasPermission ? t.common.loading : t.workout.cameraDenied}</Body>
            {!detector.hasPermission ? <Button title={t.common.next} onPress={() => void detector.requestPermission()} /> : null}
          </View>
        )}
        {settings.showSkeleton && detectorEnabled ? (
          <PoseOverlay pose={viewPose} width={viewSize.width} height={viewSize.height} bad={Boolean(feedback)} />
        ) : null}
        {state.status === 'positioning' ? <FramingGuide width={viewSize.width} height={viewSize.height} status={framing.status} /> : null}

        {/* How the movement should look, shown while the user gets ready — not
            while they are doing it, when the camera and the counter are the focus. */}
        {state.status === 'positioning' || state.status === 'countdown' || state.status === 'paused' ? (
          <DemoPip exerciseId={pe.exerciseId} label={t.plan.howTo} />
        ) : null}

        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={quit} hitSlop={12} style={styles.iconBtn}>
            <Icon name="close" color={colors.white} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.exerciseName} numberOfLines={1}>{name}</Text>
            <Text style={styles.setLabel}>
              {t.workout.set} {state.setIndex + 1}/{pe.sets} · {state.exerciseIndex + 1}/{state.exercises.length}
            </Text>
          </View>
          <Text style={styles.fps}>
            {detector.fps} {t.workout.fps}
          </Text>
        </View>

        {/* Model status */}
        {detector.modelState !== 'loaded' && detectorEnabled ? (
          <View style={styles.modelBanner}>
            <Body muted>{detector.modelState === 'error' ? t.workout.modelError : t.workout.modelLoading}</Body>
          </View>
        ) : null}

        {/* Centre overlays */}
        {state.status === 'countdown' ? (
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            <Text style={styles.countdown}>{state.countdown}</Text>
            <Text style={styles.countdownLabel}>{t.workout.getReady}</Text>
          </View>
        ) : null}
        {state.status === 'rest' ? (
          <RestOverlay
            seconds={state.restLeft}
            nextName={nextExerciseName(state, t)}
            nextExerciseId={nextExercise(state)?.exerciseId}
            progress={`${state.exerciseIndex + 1}/${state.exercises.length}`}
            cheer={state.setIndex >= pe.sets - 1 ? t.workout.cheerStrong : t.workout.cheerFinalSet}
            onSkip={() => dispatch({ type: 'SKIP_REST' })}
          />
        ) : null}
        {state.status === 'paused' ? (
          <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: colors.overlay }]}>
            <Text style={styles.countdownLabel}>{t.workout.pause}</Text>
            <Button title={t.workout.resume} onPress={() => dispatch({ type: 'RESUME' })} />
          </View>
        ) : null}

        {/* Feedback / encouragement */}
        {state.status === 'exercising' && feedback ? (
          <View style={styles.feedback}>
            <Text style={styles.feedbackText}>{t.feedback[feedback]}</Text>
          </View>
        ) : state.status === 'exercising' && cheer ? (
          <View style={[styles.feedback, styles.cheer]}>
            <Text style={styles.feedbackText}>{cheer}</Text>
          </View>
        ) : null}
      </View>

      {/* Bottom HUD */}
      <View style={styles.hud}>
        <View style={{ flex: 1 }}>
          {exercise.countingMode === 'reps_ai' ? (
            <>
              <Text style={styles.counter}>
                {state.currentReps}
                <Text style={styles.counterTarget}>/{pe.target}</Text>
              </Text>
              <Text style={styles.counterLabel}>{t.common.reps}</Text>
            </>
          ) : exercise.countingMode === 'hold_ai' ? (
            <>
              <Text style={styles.counter}>
                {Math.floor(state.currentHold)}
                <Text style={styles.counterTarget}>/{pe.target}s</Text>
              </Text>
              <Text style={styles.counterLabel}>{t.workout.holdSeconds}</Text>
            </>
          ) : (
            <>
              <Text style={styles.counter}>
                {Math.max(0, pe.target - state.elapsedInSet)}
                <Text style={styles.counterTarget}>s</Text>
              </Text>
              <Text style={styles.counterLabel}>{t.common.seconds}</Text>
            </>
          )}
        </View>
        <View style={styles.hudButtons}>
          {exercise.countingMode === 'reps_ai' && state.status === 'exercising' ? (
            <Button title={t.workout.manualPlus} variant="secondary" onPress={() => dispatch({ type: 'MANUAL_REP' })} />
          ) : null}
          {state.status === 'paused' ? null : <Button title={t.workout.pause} variant="secondary" onPress={() => dispatch({ type: 'PAUSE' })} />}
          <Button title={t.workout.finish} variant="ghost" onPress={() => dispatch({ type: 'FINISH' })} />
        </View>
      </View>
    </View>
  );
}

/** What comes after the current set: the same exercise, or the next one once its sets are done. */
function nextExercise(state: ReturnType<typeof createSession>): PlannedExercise | undefined {
  const pe = currentExercise(state);
  if (!pe) return undefined;
  const lastSet = state.setIndex >= pe.sets - 1;
  return lastSet ? state.exercises[state.exerciseIndex + 1] : pe;
}

function nextExerciseName(state: ReturnType<typeof createSession>, t: ReturnType<typeof useT>): string {
  const next = nextExercise(state);
  if (!next) return '';
  return t.exercises[next.exerciseId as keyof typeof t.exercises]?.name ?? next.exerciseId;
}

/** Small looping clip of the movement, pinned to a corner of the camera view. */
function DemoPip({ exerciseId, label }: { exerciseId: string; label: string }) {
  if (!hasExerciseVideo(exerciseId)) return null;
  return (
    <View style={styles.pip} pointerEvents="none">
      <ExerciseVideo key={exerciseId} exerciseId={exerciseId} style={styles.pipVideo} />
      <Text style={styles.pipLabel}>{label}</Text>
    </View>
  );
}

function RestOverlay({
  seconds,
  nextName,
  nextExerciseId,
  progress,
  cheer,
  onSkip,
}: {
  seconds: number;
  nextName: string;
  nextExerciseId?: string;
  progress: string;
  cheer: string;
  onSkip: () => void;
}) {
  const t = useT();
  return (
    <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: colors.overlay }]}>
      <Text style={styles.restCheer}>{cheer}</Text>
      <Text style={styles.countdownLabel}>{t.workout.restTitle}</Text>
      <Text style={styles.countdown}>{seconds}</Text>
      {/* The rest is the moment to study what comes next, so the clip goes large here. */}
      {nextExerciseId && hasExerciseVideo(nextExerciseId) ? (
        <ExerciseVideo key={nextExerciseId} exerciseId={nextExerciseId} style={styles.restDemo} />
      ) : null}
      <Body muted>
        {t.workout.restHint} {nextName}
      </Body>
      <Text style={styles.restProgress}>{progress}</Text>
      <Button title={t.workout.skipRest} variant="secondary" onPress={onSkip} style={{ marginTop: spacing.md }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  cameraBox: { flex: 1, overflow: 'hidden', backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  topBar: { position: 'absolute', top: 48, left: spacing.md, right: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center' },
  exerciseName: { ...typography.h3, color: colors.white, fontFamily: fonts.bold, fontSize: 18, textShadowColor: '#000', textShadowRadius: 6 },
  setLabel: { ...typography.caption, color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 14, lineHeight: 18 },
  fps: { ...typography.numberSm, color: colors.textDim, fontSize: 11, lineHeight: 14 },
  modelBanner: { position: 'absolute', top: 100, alignSelf: 'center', backgroundColor: colors.overlay, padding: spacing.sm, borderRadius: radius.sm },
  countdown: { ...typography.counter, fontSize: 132, lineHeight: 140, textShadowColor: '#000', textShadowRadius: 12 },
  countdownLabel: { ...typography.h2, color: colors.white },
  cheer: { backgroundColor: 'rgba(46,230,166,0.92)' },
  restCheer: { ...typography.h2, color: colors.accent, fontSize: 20, marginBottom: -4 },
  restProgress: { ...typography.numberMd, fontSize: 15, lineHeight: 20, color: colors.textDim, marginTop: 2 },
  feedback: { position: 'absolute', bottom: spacing.lg, alignSelf: 'center', backgroundColor: 'rgba(255,92,122,0.9)', paddingVertical: 12, paddingHorizontal: 20, borderRadius: radius.pill },
  feedbackText: { ...typography.h3, color: colors.white, fontFamily: fonts.bold, fontSize: 17 },
  hud: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md, backgroundColor: colors.bg },
  counter: { ...typography.counter, fontSize: 80, lineHeight: 84 },
  counterTarget: { ...typography.numberLg, fontSize: 30, lineHeight: 34, color: colors.textDim },
  counterLabel: { ...typography.caption, color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 14, lineHeight: 18, marginTop: -4 },
  hudButtons: { gap: spacing.sm, alignItems: 'stretch', minWidth: 150 },
  pip: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 150,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: colors.overlay,
  },
  pipVideo: { borderRadius: 0 },
  pipLabel: { ...typography.overline, color: colors.white, fontSize: 10, letterSpacing: 1.2, paddingVertical: 5, textAlign: 'center' },
  restDemo: { width: 220, borderRadius: radius.md, marginVertical: spacing.xs },
});
