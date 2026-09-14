import { cmToFtIn, cmToInches, formatHeight, formatWeight, ftInToCm, inchesToCm, kgToLb, lbToKg } from '@/domain/profile/units';

describe('unit conversion', () => {
  it('converts height between cm and ft/in', () => {
    expect(cmToFtIn(175)).toEqual({ ft: 5, inch: 9 });
    expect(cmToFtIn(183)).toEqual({ ft: 6, inch: 0 });
    expect(ftInToCm(5, 9)).toBe(175);
    expect(ftInToCm(6, 0)).toBe(183);
    // Round-trips stay within a centimetre.
    for (const cm of [150, 165, 170, 178, 190]) {
      expect(Math.abs(inchesToCm(cmToInches(cm)) - cm)).toBeLessThanOrEqual(1);
    }
  });
  it('converts weight between kg and lb', () => {
    expect(kgToLb(70)).toBe(154);
    expect(lbToKg(154)).toBeCloseTo(69.9, 1);
    for (const kg of [50, 70, 95, 120]) {
      expect(Math.abs(lbToKg(kgToLb(kg)) - kg)).toBeLessThanOrEqual(0.5);
    }
  });
  it('formats for display', () => {
    expect(formatHeight(175, 'cm')).toBe('175');
    expect(formatHeight(175, 'ft')).toBe("5'9\"");
    expect(formatWeight(70.5, 'kg')).toBe('70.5');
    expect(formatWeight(70, 'lb')).toBe('154');
  });
});
