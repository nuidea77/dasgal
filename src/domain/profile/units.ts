export type HeightUnit = 'cm' | 'ft';
export type WeightUnit = 'kg' | 'lb';

const CM_PER_INCH = 2.54;
const KG_PER_LB = 0.45359237;

/** Centimetres → feet and remaining inches (rounded to the nearest inch). */
export function cmToFtIn(cm: number): { ft: number; inch: number } {
  const totalInches = Math.round(cm / CM_PER_INCH);
  return { ft: Math.floor(totalInches / 12), inch: totalInches % 12 };
}

export function ftInToCm(ft: number, inch: number): number {
  return Math.round((ft * 12 + inch) * CM_PER_INCH);
}

/** Total inches, the unit the height picker scrolls through in imperial mode. */
export function cmToInches(cm: number): number {
  return Math.round(cm / CM_PER_INCH);
}

export function inchesToCm(inches: number): number {
  return Math.round(inches * CM_PER_INCH);
}

export function kgToLb(kg: number): number {
  return Math.round(kg / KG_PER_LB);
}

export function lbToKg(lb: number): number {
  return Math.round((lb * KG_PER_LB) * 10) / 10;
}

/** Label shown next to the value, e.g. 5'9" or 175 cm. */
export function formatHeight(cm: number, unit: HeightUnit): string {
  if (unit === 'cm') return `${Math.round(cm)}`;
  const { ft, inch } = cmToFtIn(cm);
  return `${ft}'${inch}"`;
}

export function formatWeight(kg: number, unit: WeightUnit): string {
  return unit === 'kg' ? `${Math.round(kg * 10) / 10}` : `${kgToLb(kg)}`;
}
