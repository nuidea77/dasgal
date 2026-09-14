import { FitnessLevel, Goal, Pace, UserProfile } from '../profile/types';
import { PACE_CONFIG } from '../profile/timeline';
import { bmiCategory, calculateBmi } from '../profile/bmi';
import { CIRCUIT_FACTOR, EXERCISES, Exercise, getExercise, REST_MET, SECONDS_PER_REP } from './exercises';

export interface PlannedExercise {
  /** Unique within the day so users can swap/edit individual entries. */
  key: string;
  exerciseId: string;
  sets: number;
  /** Reps per set (reps_ai) or seconds per set (hold_ai/timed). */
  target: number;
  restSeconds: number;
}

export interface PlanDay {
  dayIndex: number; // 0-based
  /** Local ISO date (YYYY-MM-DD) the day is scheduled for. */
  date: string;
  kind: 'workout' | 'rest';
  focus: 'full_body' | 'lower' | 'upper_core' | 'cardio' | 'rest';
  intensity: 'easy' | 'moderate' | 'hard';
  exercises: PlannedExercise[];
  estimatedMinutes: number;
}

export interface WorkoutPlan {
  id: string;
  createdAt: string;
  goal: Goal;
  level: FitnessLevel;
  days: PlanDay[];
}

/** Small deterministic PRNG so the same profile + seed produce the same plan (testable). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rnd: () => number, list: T[], n: number, exclude: Set<string> = new Set(), keyOf: (t: T) => string = (t) => String(t)): T[] {
  const pool = list.filter((x) => !exclude.has(keyOf(x)));
  const out: T[] = [];
  while (out.length < n && pool.length > 0) {
    const i = Math.floor(rnd() * pool.length);
    const [item] = pool.splice(i, 1);
    if (item !== undefined) out.push(item);
  }
  return out;
}

const FOCUS_POOLS: Record<Exclude<PlanDay['focus'], 'rest'>, string[]> = {
  full_body: ['squat', 'pushup', 'knee_pushup', 'lunge', 'plank', 'glute_bridge', 'jumping_jack', 'situp', 'burpee', 'good_morning', 'squat_thrust', 'inchworm', 'superman', 'bird_dog'],
  lower: ['squat', 'sumo_squat', 'jump_squat', 'lunge', 'reverse_lunge', 'side_lunge', 'glute_bridge', 'single_leg_bridge', 'wall_sit', 'calf_raise', 'donkey_kick', 'fire_hydrant', 'high_knees'],
  upper_core: ['pushup', 'knee_pushup', 'wide_pushup', 'diamond_pushup', 'wall_pushup', 'pike_pushup', 'floor_tricep_dip', 'plank', 'side_plank', 'situp', 'crunch', 'leg_raise', 'dead_bug', 'bicycle_crunch', 'russian_twist', 'superman', 'swimmer', 'plank_up_down'],
  cardio: ['jumping_jack', 'high_knees', 'butt_kicks', 'mountain_climber', 'burpee', 'squat_thrust', 'plank_jack', 'skater_jump', 'jump_squat', 'bear_crawl'],
};

function maxDifficulty(level: FitnessLevel): number {
  return level === 'beginner' ? 1 : level === 'intermediate' ? 2 : 3;
}

function baseReps(level: FitnessLevel, ex: Exercise): number {
  const byLevel = { beginner: 8, intermediate: 12, advanced: 16 }[level];
  if (ex.countingMode === 'reps_ai') {
    if (ex.muscles.includes('cardio')) return byLevel + 8;
    return byLevel - (ex.difficulty - 1) * 2;
  }
  // hold/timed → seconds
  return { beginner: 20, intermediate: 35, advanced: 50 }[level];
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface GenerateOptions {
  startDate?: string;
  seed?: number;
}

/** Number of exercises per session by level. */
function sessionSize(level: FitnessLevel): number {
  return level === 'beginner' ? 4 : level === 'intermediate' ? 5 : 6;
}

/**
 * Builds the program from the profile.
 *
 * - Length = profile.programDays (derived from the chosen pace's timeline; no 30-day cap, up to a year).
 * - Training days per week come from the pace (easy 3 / moderate 4 / hard 5).
 * - Only the user's preferred exercises are used; the library fills in when a focus has too few.
 * - Volume rises with every completed workout index (pace-specific %), with a lighter deload every 4th week.
 * - Harder exercise tiers unlock as the weeks go by (one tier every 3 weeks, capped at 3).
 * - Sets rise from 3 to 4 (week 5+) to 5 (week 9+, moderate/hard).
 */
export function generatePlan(profile: UserProfile, options: GenerateOptions = {}): WorkoutPlan {
  const pace = PACE_CONFIG[profile.pace ?? 'moderate'];
  const days = Math.min(365, Math.max(7, Math.round(profile.programDays || 28)));
  const perWeek = Math.min(6, Math.max(2, Math.round(profile.daysPerWeek || pace.daysPerWeek)));
  const seed = options.seed ?? 42;
  const rnd = mulberry32(seed);
  const start = options.startDate ?? todayIso();
  const bmi = calculateBmi(profile.weightKg, profile.heightCm);
  const lowImpact = bmiCategory(bmi) === 'obese' || profile.age >= 55;
  const baseMaxDiff = Math.max(1, maxDifficulty(profile.level) - (lowImpact ? 1 : 0));
  const preferred = new Set(profile.preferredExercises ?? []);

  const rotation: Array<Exclude<PlanDay['focus'], 'rest'>> =
    profile.goal === 'lose_weight'
      ? ['cardio', 'full_body', 'lower', 'cardio', 'upper_core', 'full_body']
      : profile.goal === 'gain_muscle'
        ? ['upper_core', 'lower', 'full_body', 'upper_core', 'lower', 'full_body']
        : ['full_body', 'cardio', 'lower', 'upper_core', 'full_body', 'cardio'];

  // Workout-day pattern inside a week, e.g. 4/wk → [1,0,1,0,1,0,1].
  const pattern: boolean[] = Array.from({ length: 7 }, () => false);
  for (let i = 0; i < perWeek; i++) {
    pattern[Math.floor((i * 7) / perWeek)] = true;
  }

  const planDays: PlanDay[] = [];
  let workoutCounter = 0;
  for (let i = 0; i < days; i++) {
    const date = addDays(start, i);
    const week = Math.floor(i / 7);
    const isWorkout = pattern[i % 7] === true;
    if (!isWorkout) {
      planDays.push({ dayIndex: i, date, kind: 'rest', focus: 'rest', intensity: 'easy', exercises: [], estimatedMinutes: 0 });
      continue;
    }
    const focus = rotation[workoutCounter % rotation.length]!;
    const deload = (week + 1) % 4 === 0;
    // Progressive overload: every workout adds a pace-specific percentage; deload weeks back off.
    const progression = (deload ? 0.8 : 1) * Math.min(2.4, 1 + workoutCounter * pace.progressionPerWorkout);
    const intensity: PlanDay['intensity'] = deload ? 'easy' : workoutCounter % 3 === 2 ? 'hard' : 'moderate';
    const maxDiff = Math.min(3, baseMaxDiff + Math.floor(week / 3));
    const exerciseCount = sessionSize(profile.level) + (week >= 6 ? 1 : 0);

    const allowed = (ex: Exercise) => ex.difficulty <= maxDiff && !(lowImpact && (ex.id === 'burpee' || ex.id === 'high_knees' || ex.id === 'jump_squat'));
    const focusPool = FOCUS_POOLS[focus].map((id) => getExercise(id)).filter(allowed);
    const preferredPool = focusPool.filter((ex) => preferred.has(ex.id));
    // Preferred exercises first; top up from the rest of the focus pool only when needed.
    let chosen = pick(rnd, preferredPool, exerciseCount + 2, new Set(), (e) => e.id);
    if (chosen.length < exerciseCount) {
      const used = new Set(chosen.map((e) => e.id));
      chosen = chosen.concat(pick(rnd, focusPool, exerciseCount + 2 - chosen.length, used, (e) => e.id));
    }
    const seenPushup = { value: false };
    const filtered = chosen
      .filter((e) => {
        const isPushup = e.id.endsWith('pushup');
        if (isPushup && seenPushup.value) return false;
        if (isPushup) seenPushup.value = true;
        return true;
      })
      .slice(0, exerciseCount);

    const baseSets = week >= 8 && profile.pace !== 'easy' ? 5 : week >= 4 ? 4 : 3;
    const exercises: PlannedExercise[] = filtered.map((ex, idx) => {
      const sets = deload ? Math.max(2, baseSets - 1) : intensity === 'hard' ? baseSets + 1 : baseSets;
      const target = Math.max(5, Math.round(baseReps(profile.level, ex) * progression * (intensity === 'hard' ? 1.1 : 1)));
      return {
        key: `${i}-${idx}-${ex.id}`,
        exerciseId: ex.id,
        sets,
        target,
        restSeconds: intensity === 'hard' ? 45 : profile.level === 'beginner' ? 60 : 40,
      };
    });
    // Size the session to the day's calorie target; when reps/sets are capped, add more exercises.
    const kcalTarget = dailyBurnTarget(profile.pace ?? 'moderate', workoutCounter, intensity);
    let fitted = fitToCalories(exercises, profile.weightKg, kcalTarget);
    // Extra exercises, in order of preference: the user's picks for this focus, the rest of the
    // focus pool, the user's other picks, any exercise of the same tier, then one tier harder.
    const used = new Set(fitted.map((e) => e.exerciseId));
    const library = Object.values(EXERCISES);
    const oneTierUp = (ex: Exercise) => ex.difficulty <= maxDiff + 1 && !(lowImpact && (ex.id === 'burpee' || ex.id === 'high_knees' || ex.id === 'jump_squat'));
    const extras = [
      ...pick(rnd, preferredPool, MAX_EXERCISES, used, (e) => e.id),
      ...pick(rnd, focusPool.filter((e) => !preferred.has(e.id)), MAX_EXERCISES, used, (e) => e.id),
      ...pick(rnd, library.filter((e) => preferred.has(e.id) && allowed(e)), MAX_EXERCISES, used, (e) => e.id),
      ...pick(rnd, library.filter(allowed), MAX_EXERCISES, used, (e) => e.id),
      ...pick(rnd, library.filter(oneTierUp), MAX_EXERCISES, used, (e) => e.id),
    ].filter((e, idx, arr) => arr.findIndex((o) => o.id === e.id) === idx);
    while (
      fitted.length < MAX_EXERCISES &&
      estimateMinutes(fitted) < MAX_SESSION_MINUTES &&
      estimateDayCalories({ exercises: fitted } as PlanDay, profile.weightKg) < kcalTarget * 0.92
    ) {
      const ex = extras.shift();
      if (!ex) break;
      const template = fitted[0]!;
      fitted = fitToCalories(
        [...fitted, { key: `${i}-${fitted.length}-${ex.id}`, exerciseId: ex.id, sets: template.sets, target: Math.max(5, Math.round(baseReps(profile.level, ex) * progression)), restSeconds: template.restSeconds }],
        profile.weightKg,
        kcalTarget,
      );
    }
    planDays.push({
      dayIndex: i,
      date,
      kind: 'workout',
      focus,
      intensity,
      exercises: fitted,
      estimatedMinutes: estimateMinutes(fitted),
    });
    workoutCounter += 1;
  }

  return {
    id: `plan-${start}-${seed}`,
    createdAt: new Date().toISOString(),
    goal: profile.goal,
    level: profile.level,
    days: planDays,
  };
}

export function estimateMinutes(exercises: PlannedExercise[]): number {
  let seconds = 0;
  for (const pe of exercises) {
    const ex = getExercise(pe.exerciseId);
    const secondsPerRep = ex.muscles.includes('cardio') ? SECONDS_PER_REP.cardio : SECONDS_PER_REP.strength;
    const work = ex.countingMode === 'reps_ai' ? pe.target * secondsPerRep : pe.target;
    seconds += pe.sets * work + Math.max(0, pe.sets - 1) * pe.restSeconds + TRANSITION_SECONDS;
  }
  return Math.max(5, Math.round(seconds / 60));
}

/** Resting between sets in a circuit keeps the heart rate up; kcal per second for this user. */
function restKcalPerSecond(weightKg: number): number {
  return ((REST_MET * weightKg) / 3600) * CIRCUIT_FACTOR;
}

/** Seconds of transition/setup per exercise. */
const TRANSITION_SECONDS = 30;
/** Longest session the generator will build. */
export const MAX_SESSION_MINUTES = 70;

/** Calories a planned exercise burns for this user (all sets, including the rest between sets). */
export function estimateExerciseCalories(pe: PlannedExercise, weightKg: number): number {
  const work = estimateCalories([{ exerciseId: pe.exerciseId, count: pe.sets * pe.target }], weightKg);
  const rest = Math.round(pe.restSeconds * Math.max(0, pe.sets - 1) * restKcalPerSecond(weightKg));
  return work + rest;
}

/** Daily calorie-burn goal for a workout day. Sessions are sized to hit it (300–600 kcal). */
export const DAILY_BURN_RANGE = { min: 300, max: 600 } as const;

export function dailyBurnTarget(pace: Pace, workoutIndex: number, intensity: PlanDay['intensity']): number {
  const base = { easy: 300, moderate: 400, hard: 500 }[pace];
  let target = base + workoutIndex * 3; // grows ~+3 kcal per workout
  if (intensity === 'hard') target *= 1.1;
  if (intensity === 'easy') target *= 0.85; // deload
  return Math.round(Math.min(DAILY_BURN_RANGE.max, Math.max(DAILY_BURN_RANGE.min, target)));
}

const REP_LIMITS = { min: 8, max: 25 } as const;
const SECOND_LIMITS = { min: 20, max: 60 } as const;
const MAX_SETS = 5;
const MAX_EXERCISES = 8;

/**
 * Scales sets/reps (or seconds) so the session burns roughly `targetKcal` for this user:
 * first the per-set target, then the number of sets. Returns a new list.
 */
export function fitToCalories(exercises: PlannedExercise[], weightKg: number, targetKcal: number): PlannedExercise[] {
  if (exercises.length === 0) return exercises;
  let list = exercises.map((pe) => ({ ...pe }));
  const total = () => list.reduce((s, pe) => s + estimateExerciseCalories(pe, weightKg), 0);
  for (let iter = 0; iter < 6; iter++) {
    const current = total();
    if (current <= 0) break;
    const ratio = targetKcal / current;
    if (Math.abs(ratio - 1) < 0.05) break;
    list = list.map((pe) => {
      const ex = getExercise(pe.exerciseId);
      const lim = ex.countingMode === 'reps_ai' ? REP_LIMITS : SECOND_LIMITS;
      return { ...pe, target: Math.round(Math.min(lim.max, Math.max(lim.min, pe.target * ratio))) };
    });
    const after = total();
    if (estimateMinutes(list) >= MAX_SESSION_MINUTES) break;
    if (after < targetKcal * 0.95) {
      // Reps are capped → add sets.
      const canGrow = list.some((pe) => pe.sets < MAX_SETS);
      if (!canGrow) break;
      list = list.map((pe) => ({ ...pe, sets: Math.min(MAX_SETS, pe.sets + 1) }));
    } else if (after > targetKcal * 1.05 && list.every((pe) => pe.sets > 2)) {
      list = list.map((pe) => ({ ...pe, sets: pe.sets - 1 }));
    } else {
      break;
    }
  }
  return list;
}

/** Calories a whole plan day burns for this user. */
export function estimateDayCalories(day: PlanDay, weightKg: number): number {
  return day.exercises.reduce((sum, pe) => sum + estimateExerciseCalories(pe, weightKg), 0);
}

/** Average calories burned per week over the plan. */
export function estimateWeeklyCalories(plan: WorkoutPlan, weightKg: number): number {
  const total = plan.days.reduce((sum, d) => sum + estimateDayCalories(d, weightKg), 0);
  return Math.round((total / plan.days.length) * 7);
}

export function estimateCalories(exercises: Array<{ exerciseId: string; count: number }>, weightKg: number): number {
  const factor = weightKg / 70;
  let kcal = 0;
  for (const e of exercises) {
    const ex = EXERCISES[e.exerciseId];
    if (!ex) continue;
    kcal += ex.kcalPerUnit * e.count * factor;
  }
  return Math.round(kcal);
}

/** Replace one exercise in a plan day with an alternative, keeping volume proportional. */
export function swapExercise(plan: WorkoutPlan, dayIndex: number, key: string, newExerciseId: string): WorkoutPlan {
  const newEx = getExercise(newExerciseId);
  const days = plan.days.map((day) => {
    if (day.dayIndex !== dayIndex) return day;
    const exercises = day.exercises.map((pe) => {
      if (pe.key !== key) return pe;
      const oldEx = getExercise(pe.exerciseId);
      let target = pe.target;
      if (oldEx.countingMode !== newEx.countingMode) {
        target = newEx.countingMode === 'reps_ai' ? Math.max(8, Math.round(pe.target / 3)) : Math.max(20, pe.target * 3);
      }
      return { ...pe, exerciseId: newExerciseId, target };
    });
    return { ...day, exercises, estimatedMinutes: estimateMinutes(exercises) };
  });
  return { ...plan, days };
}

export function updateExerciseVolume(plan: WorkoutPlan, dayIndex: number, key: string, sets: number, target: number): WorkoutPlan {
  const days = plan.days.map((day) => {
    if (day.dayIndex !== dayIndex) return day;
    const exercises = day.exercises.map((pe) => (pe.key === key ? { ...pe, sets: Math.max(1, sets), target: Math.max(1, target) } : pe));
    return { ...day, exercises, estimatedMinutes: estimateMinutes(exercises) };
  });
  return { ...plan, days };
}
