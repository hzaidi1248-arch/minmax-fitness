/**
 * @module core/math/strengthCalculations
 * @description Pure, strictly typed mathematical utility functions for
 * core fitness calculations. These functions are stateless, side-effect-free,
 * and isolated from all UI and database concerns.
 *
 * All functions use the Epley formula variant as specified in the
 * Min-Max Program analytics workbook.
 *
 * These MUST remain pure functions — no imports from React, database,
 * or any module with side effects. This ensures they can safely execute
 * on background threads via Hermes without blocking the UI.
 */

// ─── Input Types ────────────────────────────────────────────────────

/**
 * Input parameters for Estimated 1-Rep Maximum calculation.
 * @property weightKg - The weight lifted in kilograms. Must be > 0.
 * @property reps - The number of repetitions completed. Must be >= 1.
 */
interface E1rmInput {
  readonly weightKg: number;
  readonly reps: number;
}

/**
 * Input parameters for Total Tonnage calculation.
 * @property sets - Number of sets performed. Must be >= 1.
 * @property weightKg - Weight per rep in kilograms. Must be > 0.
 * @property reps - Reps per set. Must be >= 1.
 */
interface TonnageInput {
  readonly sets: number;
  readonly weightKg: number;
  readonly reps: number;
}

/**
 * Input parameters for Intensity Percentage calculation.
 * @property workingWeightKg - The weight used for working sets in kg. Must be > 0.
 * @property estimated1rmKg - The estimated 1RM for the exercise in kg. Must be > 0.
 */
interface IntensityInput {
  readonly workingWeightKg: number;
  readonly estimated1rmKg: number;
}

/**
 * Input parameters for Strength-to-Bodyweight Ratio.
 * @property estimated1rmKg - The estimated 1RM in kilograms. Must be > 0.
 * @property bodyweightKg - The user's bodyweight in kilograms. Must be > 0.
 */
interface StrengthToBwInput {
  readonly estimated1rmKg: number;
  readonly bodyweightKg: number;
}

// ─── Validation ─────────────────────────────────────────────────────

/**
 * Validates that a numeric value is a finite positive number.
 * @param value - The number to validate.
 * @param label - Human-readable label for error messages.
 * @throws RangeError if the value is not a positive finite number.
 */
function assertPositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(
      `${label} must be a positive finite number. Received: ${String(value)}`
    );
  }
}

/**
 * Validates that a numeric value is a non-negative finite integer.
 * @param value - The number to validate.
 * @param label - Human-readable label for error messages.
 * @throws RangeError if the value is not a non-negative finite integer.
 */
function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
    throw new RangeError(
      `${label} must be a non-negative integer. Received: ${String(value)}`
    );
  }
}

// ─── Core Calculations ──────────────────────────────────────────────

/**
 * Calculates the Estimated 1-Rep Maximum using the Epley formula.
 *
 * Formula: `Weight × (1 + Reps / 30)`
 *
 * @param input - Weight and reps performed.
 * @returns The estimated 1RM in kilograms, rounded to 1 decimal place.
 * @throws RangeError if inputs are invalid.
 *
 * @example
 * ```ts
 * calculateE1rm({ weightKg: 31.5, reps: 8 });
 * // Returns 39.9
 * ```
 */
export function calculateE1rm(input: E1rmInput): number {
  assertPositive(input.weightKg, 'weightKg');
  assertPositive(input.reps, 'reps');

  const result: number = input.weightKg * (1 + input.reps / 30);
  return Math.round(result * 10) / 10;
}

/**
 * Calculates the Total Tonnage (volume load) for an exercise.
 *
 * Formula: `Sets × Weight × Reps`
 *
 * @param input - Sets, weight per rep, and reps per set.
 * @returns The total tonnage in kilograms.
 * @throws RangeError if inputs are invalid.
 *
 * @example
 * ```ts
 * calculateTonnage({ sets: 2, weightKg: 31.5, reps: 8 });
 * // Returns 504
 * ```
 */
export function calculateTonnage(input: TonnageInput): number {
  assertPositive(input.sets, 'sets');
  assertNonNegativeInteger(input.sets, 'sets');
  assertPositive(input.weightKg, 'weightKg');
  assertPositive(input.reps, 'reps');
  assertNonNegativeInteger(input.reps, 'reps');

  return input.sets * input.weightKg * input.reps;
}

/**
 * Calculates the Training Intensity as a percentage of Estimated 1RM.
 *
 * Formula: `(Working Weight / Estimated 1RM) × 100`
 *
 * @param input - Working weight and the estimated 1RM.
 * @returns Intensity as a percentage (0–100+), rounded to 1 decimal.
 * @throws RangeError if inputs are invalid.
 *
 * @example
 * ```ts
 * calculateIntensityPercentage({ workingWeightKg: 31.5, estimated1rmKg: 39.9 });
 * // Returns 78.9
 * ```
 */
export function calculateIntensityPercentage(input: IntensityInput): number {
  assertPositive(input.workingWeightKg, 'workingWeightKg');
  assertPositive(input.estimated1rmKg, 'estimated1rmKg');

  const result: number = (input.workingWeightKg / input.estimated1rmKg) * 100;
  return Math.round(result * 10) / 10;
}

/**
 * Calculates the Strength-to-Bodyweight Ratio.
 *
 * Formula: `Estimated 1RM / Bodyweight`
 *
 * A ratio of 1.5 means the lift is 1.5× bodyweight.
 *
 * @param input - Estimated 1RM and bodyweight, both in kilograms.
 * @returns The ratio as a decimal, rounded to 2 decimal places.
 * @throws RangeError if inputs are invalid.
 *
 * @example
 * ```ts
 * calculateStrengthToBwRatio({ estimated1rmKg: 100, bodyweightKg: 80 });
 * // Returns 1.25
 * ```
 */
export function calculateStrengthToBwRatio(input: StrengthToBwInput): number {
  assertPositive(input.estimated1rmKg, 'estimated1rmKg');
  assertPositive(input.bodyweightKg, 'bodyweightKg');

  const result: number = input.estimated1rmKg / input.bodyweightKg;
  return Math.round(result * 100) / 100;
}
