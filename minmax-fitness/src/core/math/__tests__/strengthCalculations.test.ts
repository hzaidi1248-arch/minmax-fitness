/**
 * @module core/math/__tests__/strengthCalculations.test
 * @description Unit tests for core mathematical utilities.
 * Test values are derived from the analyzed Min-Max Excel workbook
 * to ensure calculation parity with the spreadsheet formulas.
 */

import {
  calculateE1rm,
  calculateTonnage,
  calculateIntensityPercentage,
  calculateStrengthToBwRatio,
} from '../strengthCalculations';

// ─── calculateE1rm ──────────────────────────────────────────────────

describe('calculateE1rm', () => {
  it('matches the Excel Epley formula: 31.5 × (1 + 8/30) = 39.9', () => {
    const result = calculateE1rm({ weightKg: 31.5, reps: 8 });
    expect(result).toBe(39.9);
  });

  it('matches Excel for Y-Raise: 3.5 × (1 + 8/30) = 4.4', () => {
    const result = calculateE1rm({ weightKg: 3.5, reps: 8 });
    expect(result).toBe(4.4);
  });

  it('handles 10-rep sets: 31.5 × (1 + 10/30) = 42', () => {
    const result = calculateE1rm({ weightKg: 31.5, reps: 10 });
    expect(result).toBe(42);
  });

  it('handles single-rep max (1RM = weight × 1.033)', () => {
    const result = calculateE1rm({ weightKg: 100, reps: 1 });
    expect(result).toBe(103.3);
  });

  it('throws RangeError for zero weight', () => {
    expect(() => calculateE1rm({ weightKg: 0, reps: 8 })).toThrow(RangeError);
  });

  it('throws RangeError for negative reps', () => {
    expect(() => calculateE1rm({ weightKg: 31.5, reps: -1 })).toThrow(
      RangeError
    );
  });

  it('throws RangeError for NaN', () => {
    expect(() => calculateE1rm({ weightKg: NaN, reps: 8 })).toThrow(
      RangeError
    );
  });

  it('throws RangeError for Infinity', () => {
    expect(() =>
      calculateE1rm({ weightKg: Infinity, reps: 8 })
    ).toThrow(RangeError);
  });
});

// ─── calculateTonnage ───────────────────────────────────────────────

describe('calculateTonnage', () => {
  it('computes tonnage: 2 × 31.5 × 8 = 504', () => {
    const result = calculateTonnage({ sets: 2, weightKg: 31.5, reps: 8 });
    expect(result).toBe(504);
  });

  it('computes tonnage for higher sets: 3 × 60 × 8 = 1440', () => {
    const result = calculateTonnage({ sets: 3, weightKg: 60, reps: 8 });
    expect(result).toBe(1440);
  });

  it('throws RangeError for zero sets', () => {
    expect(() =>
      calculateTonnage({ sets: 0, weightKg: 31.5, reps: 8 })
    ).toThrow(RangeError);
  });

  it('throws RangeError for fractional sets', () => {
    expect(() =>
      calculateTonnage({ sets: 1.5, weightKg: 31.5, reps: 8 })
    ).toThrow(RangeError);
  });
});

// ─── calculateIntensityPercentage ───────────────────────────────────

describe('calculateIntensityPercentage', () => {
  it('computes intensity: (31.5 / 39.9) × 100 ≈ 78.9%', () => {
    const result = calculateIntensityPercentage({
      workingWeightKg: 31.5,
      estimated1rmKg: 39.9,
    });
    expect(result).toBe(78.9);
  });

  it('returns 100% when working at E1RM', () => {
    const result = calculateIntensityPercentage({
      workingWeightKg: 39.9,
      estimated1rmKg: 39.9,
    });
    expect(result).toBe(100);
  });

  it('throws RangeError for zero E1RM (division by zero)', () => {
    expect(() =>
      calculateIntensityPercentage({ workingWeightKg: 31.5, estimated1rmKg: 0 })
    ).toThrow(RangeError);
  });
});

// ─── calculateStrengthToBwRatio ─────────────────────────────────────

describe('calculateStrengthToBwRatio', () => {
  it('computes ratio: 39.9 / 71.5 ≈ 0.56', () => {
    const result = calculateStrengthToBwRatio({
      estimated1rmKg: 39.9,
      bodyweightKg: 71.5,
    });
    expect(result).toBe(0.56);
  });

  it('returns 1.0 when E1RM equals bodyweight', () => {
    const result = calculateStrengthToBwRatio({
      estimated1rmKg: 100,
      bodyweightKg: 100,
    });
    expect(result).toBe(1);
  });

  it('handles strong squat ratio: 140 / 90 = 1.56', () => {
    const result = calculateStrengthToBwRatio({
      estimated1rmKg: 140,
      bodyweightKg: 90,
    });
    expect(result).toBe(1.56);
  });

  it('throws RangeError for zero bodyweight', () => {
    expect(() =>
      calculateStrengthToBwRatio({ estimated1rmKg: 39.9, bodyweightKg: 0 })
    ).toThrow(RangeError);
  });
});
