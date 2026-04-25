/**
 * @module core/math/units
 * @description Universal unit conversion engine.
 * The database strictly uses Kilograms (KG) to prevent rounding errors during sync.
 * This module converts between KG and LBS for UI presentation, ensuring
 * precise rounding to the nearest 0.5 increment.
 */

export const KG_TO_LBS_RATIO = 2.20462;

/**
 * Converts kilograms to pounds, rounded to the nearest 0.5 increment.
 * @param kg Weight in kilograms
 * @returns Weight in pounds
 */
export function kgToLbs(kg: number): number {
  const lbs = kg * KG_TO_LBS_RATIO;
  return Math.round(lbs * 2) / 2;
}

/**
 * Converts pounds to kilograms, without arbitrary rounding, so it
 * can be safely stored as the source of truth.
 * @param lbs Weight in pounds
 * @returns Weight in kilograms
 */
export function lbsToKg(lbs: number): number {
  return lbs / KG_TO_LBS_RATIO;
}

/**
 * Helper to display a weight value dynamically based on user preference.
 * @param kg Weight in kilograms from the DB
 * @param isMetric User's global metric preference
 * @returns Formatted string (e.g., "225 LBS" or "100 KG")
 */
export function formatWeight(kg: number | null | undefined, isMetric: boolean): string {
  if (kg === null || kg === undefined) return '--';
  
  if (isMetric) {
    // Standard rounding for KG display
    const roundedKg = Math.round(kg * 2) / 2;
    return `${roundedKg} KG`;
  } else {
    return `${kgToLbs(kg)} LBS`;
  }
}
