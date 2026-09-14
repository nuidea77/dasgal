import { Goal, Pace, Sex } from './types';

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export function calculateBmi(weightKg: number, heightCm: number): number {
  if (heightCm <= 0 || weightKg <= 0) return 0;
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

/** Healthy weight window for a height (BMI 18.5 – 24.9). */
export function healthyWeightRange(heightCm: number): { min: number; max: number } {
  const h = heightCm / 100;
  return {
    min: Math.round(18.5 * h * h * 10) / 10,
    max: Math.round(24.9 * h * h * 10) / 10,
  };
}

/**
 * Suggests a realistic target weight for the goal:
 * - lose_weight: move toward BMI 22 but never more than 10% below current in one program.
 * - gain_muscle: modest lean gain, bounded by the healthy range.
 * - tone: hold weight, small adjustment toward the healthy range if outside it.
 */
export function targetWeight(weightKg: number, heightCm: number, goal: Goal): number {
  const h = heightCm / 100;
  const ideal = 22 * h * h;
  const range = healthyWeightRange(heightCm);
  let target = weightKg;
  if (goal === 'lose_weight') {
    target = Math.max(ideal, weightKg * 0.9);
    target = Math.min(target, weightKg);
  } else if (goal === 'gain_muscle') {
    target = Math.min(Math.max(weightKg * 1.04, range.min), range.max);
    target = Math.max(target, weightKg);
  } else {
    if (weightKg > range.max) target = Math.max(range.max, weightKg * 0.95);
    else if (weightKg < range.min) target = Math.min(range.min, weightKg * 1.05);
  }
  return Math.round(target * 10) / 10;
}

/** Mifflin–St Jeor basal metabolic rate. */
export function bmr(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === 'male' ? base + 5 : base - 161);
}

/** Daily calorie delta (kcal) per goal and pace. */
export function calorieDelta(goal: Goal, pace: Pace = 'moderate'): number {
  const table: Record<Goal, Record<Pace, number>> = {
    lose_weight: { easy: -300, moderate: -450, hard: -600 },
    gain_muscle: { easy: 200, moderate: 300, hard: 400 },
    tone: { easy: -100, moderate: -150, hard: -250 },
  };
  return table[goal][pace];
}

/** Daily calorie recommendation for the goal (light–moderate activity, home workouts). */
export function dailyCalories(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex,
  goal: Goal,
  daysPerWeek = 4,
  pace: Pace = 'moderate',
): { maintenance: number; recommended: number; protein: number; carbs: number; fat: number } {
  const activity = daysPerWeek >= 5 ? 1.55 : daysPerWeek >= 3 ? 1.45 : 1.3;
  const maintenance = Math.round(bmr(weightKg, heightCm, age, sex) * activity);
  const delta = calorieDelta(goal, pace);
  // Never go below a safe floor.
  const floor = sex === 'male' ? 1500 : 1200;
  const recommended = Math.max(floor, Math.round((maintenance + delta) / 10) * 10);
  const proteinPerKg = goal === 'gain_muscle' ? 1.8 : goal === 'lose_weight' ? 1.6 : 1.4;
  const protein = Math.round(weightKg * proteinPerKg);
  const fat = Math.round((recommended * 0.27) / 9);
  const carbs = Math.max(0, Math.round((recommended - protein * 4 - fat * 9) / 4));
  return { maintenance, recommended, protein, carbs, fat };
}
