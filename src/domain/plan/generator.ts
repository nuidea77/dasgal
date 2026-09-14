import { FitnessLevel, Goal, UserProfile } from '../profile/types';
import { bmiCategory, calculateBmi } from '../profile/bmi';
import { EXERCISES, Exercise, getExercise } from './exercises';

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
  full_body: ['squat', 'pushup', 'knee_pushup', 'lunge', 'plank', 'glute_bridge', 'jumping_jack', 'situp', 'burpee'],
  lower: ['squat', 'lunge', 'glute_bridge', 'wall_sit', 'high_knees', 'jumping_jack'],
  upper_core: ['pushup', 'knee_pushup', 'plank', 'situp', 'mountain_climber', 'glute_bridge'],
  cardio: ['jumping_jack', 'high_knees', 'mountain_climber', 'burpee', 'squat', 'lunge'],
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

/**
 * Builds a 7–30 day home workout program from the profile.
 *
 * Rules:
 * - Workout days spread according to `daysPerWeek`; the rest are rest days.
 * - Focus rotates with the goal (weight loss → more cardio, muscle → more strength/full-body).
 * - Volume progresses ~+10% every week; a lighter "deload" is scheduled every 4th week.
 * - Exercise difficulty is capped by fitness level and by BMI (obese → low-impact substitutes).
 */
export function generatePlan(profile: UserProfile, options: GenerateOptions = {}): WorkoutPlan {
  const days = Math.min(30, Math.max(7, Math.round(profile.programDays || 14)));
  const perWeek = Math.min(6, Math.max(3, Math.round(profile.daysPerWeek || 4)));
  const seed = options.seed ?? 42;
  const rnd = mulberry32(seed);
  const start = options.startDate ?? todayIso();
  const bmi = calculateBmi(profile.weightKg, profile.heightCm);
  const lowImpact = bmiCategory(bmi) === 'obese' || profile.age >= 55;
  const maxDiff = Math.max(1, maxDifficulty(profile.level) - (lowImpact ? 1 : 0));

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
    const progression = deload ? 0.8 : 1 + week * 0.1;
    const intensity: PlanDay['intensity'] = deload ? 'easy' : workoutCounter % 3 === 2 ? 'hard' : 'moderate';
    const exerciseCount = profile.level === 'beginner' ? 4 : profile.level === 'intermediate' ? 5 : 6;

    const pool = FOCUS_POOLS[focus]
      .map((id) => getExercise(id))
      .filter((ex) => ex.difficulty <= maxDiff)
      .filter((ex) => !(lowImpact && (ex.id === 'burpee' || ex.id === 'high_knees')));
    // Avoid both pushup variants in the same session.
    const chosen = pick(rnd, pool, exerciseCount, new Set(), (e) => e.id);
    const filtered = chosen.filter((e, idx, arr) => !(e.id === 'knee_pushup' && arr.some((o) => o.id === 'pushup')));

    const exercises: PlannedExercise[] = filtered.map((ex, idx) => {
      const sets = intensity === 'hard' ? 4 : 3;
      const target = Math.max(5, Math.round(baseReps(profile.level, ex) * progression * (intensity === 'hard' ? 1.1 : 1)));
      return {
        key: `${i}-${idx}-${ex.id}`,
        exerciseId: ex.id,
        sets,
        target,
        restSeconds: intensity === 'hard' ? 45 : profile.level === 'beginner' ? 60 : 40,
      };
    });
    planDays.push({
      dayIndex: i,
      date,
      kind: 'workout',
      focus,
      intensity,
      exercises,
      estimatedMinutes: estimateMinutes(exercises),
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
    const work = ex.countingMode === 'reps_ai' ? pe.target * 3 : pe.target;
    seconds += pe.sets * (work + pe.restSeconds);
  }
  return Math.max(5, Math.round(seconds / 60));
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
