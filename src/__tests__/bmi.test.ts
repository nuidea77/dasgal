import { bmiCategory, bmr, calculateBmi, dailyCalories, healthyWeightRange, targetWeight } from '@/domain/profile/bmi';

describe('bmi & calories', () => {
  it('computes BMI and category', () => {
    expect(calculateBmi(70, 175)).toBeCloseTo(22.9, 1);
    expect(bmiCategory(17)).toBe('underweight');
    expect(bmiCategory(22)).toBe('normal');
    expect(bmiCategory(27)).toBe('overweight');
    expect(bmiCategory(31)).toBe('obese');
    expect(calculateBmi(70, 0)).toBe(0);
  });

  it('gives a healthy range', () => {
    const r = healthyWeightRange(175);
    expect(r.min).toBeCloseTo(56.7, 1);
    expect(r.max).toBeCloseTo(76.3, 1);
  });

  it('targets weight sensibly per goal', () => {
    // Overweight, losing: no more than 10% below current in one program.
    expect(targetWeight(100, 175, 'lose_weight')).toBe(90);
    // Already lean, losing: does not go below current.
    expect(targetWeight(60, 175, 'lose_weight')).toBe(60);
    // Gaining: slightly above current, within healthy max.
    const gain = targetWeight(65, 175, 'gain_muscle');
    expect(gain).toBeGreaterThan(65);
    expect(gain).toBeLessThanOrEqual(76.3);
    // Toning inside the range keeps weight.
    expect(targetWeight(70, 175, 'tone')).toBe(70);
  });

  it('computes BMR and daily calories with safety floor', () => {
    expect(bmr(70, 175, 30, 'male')).toBe(1649);
    expect(bmr(60, 165, 30, 'female')).toBe(1320);
    const c = dailyCalories(70, 175, 30, 'male', 'lose_weight', 4);
    expect(c.maintenance).toBe(Math.round(1649 * 1.45));
    expect(c.recommended).toBe(Math.round((c.maintenance - 450) / 10) * 10);
    const tiny = dailyCalories(40, 150, 60, 'female', 'lose_weight', 3);
    expect(tiny.recommended).toBeGreaterThanOrEqual(1200);
    expect(c.protein + c.carbs + c.fat).toBeGreaterThan(0);
  });
});
