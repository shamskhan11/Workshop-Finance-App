/**
 * Strict Financial Validation Utility for Sattar Auto Mobile & Electrical Services
 * Enforces positive numeric amounts, rejects zero, negative, empty, non-numeric,
 * and invalid decimal precision. Avoids floating point inaccuracy.
 */

import { AmountValidationResult } from '../types/finance';

/**
 * Validate a transaction amount string or number.
 * Rules:
 * 1. Must be provided (not empty or only whitespace).
 * 2. Must not contain non-numeric characters (except single decimal dot).
 * 3. Cannot contain exponential notation (e.g., '1e5', '2E3') or signs ('+', '-').
 * 4. Maximum 2 decimal places allowed (paisa precision).
 * 5. Must parse to a strictly positive number (amount > 0). Zero and negatives are rejected.
 * 6. Avoids floating-point rounding errors by validating representation and converting to paisa if needed.
 */
export function validateTransactionAmount(rawInput: string | number | null | undefined): AmountValidationResult {
  if (rawInput === null || rawInput === undefined) {
    return {
      isValid: false,
      error: 'Please enter a transaction amount.',
    };
  }

  const str = String(rawInput).trim();

  if (str === '') {
    return {
      isValid: false,
      error: 'Amount is required.',
    };
  }

  // Reject negative sign explicitly
  if (str.startsWith('-')) {
    return {
      isValid: false,
      error: 'Amount cannot be negative. Must be greater than zero.',
    };
  }

  // Reject plus sign or scientific notation
  if (/[+eE]/.test(str)) {
    return {
      isValid: false,
      error: 'Invalid format. Scientific notation or signs are not allowed.',
    };
  }

  // Must match standard currency format: digits optionally followed by . and 1-2 digits
  // e.g. "500", "500.5", "500.50"
  const amountRegex = /^\d+(\.\d+)?$/;
  if (!amountRegex.test(str)) {
    return {
      isValid: false,
      error: 'Invalid amount. Enter numbers only (e.g. 1500).',
    };
  }

  // Check decimal places precision (max 2 decimal places)
  if (str.includes('.')) {
    const decimals = str.split('.')[1];
    if (decimals.length > 2) {
      return {
        isValid: false,
        error: 'Invalid precision. Maximum 2 decimal places allowed.',
      };
    }
  }

  const num = parseFloat(str);

  if (isNaN(num)) {
    return {
      isValid: false,
      error: 'Amount must be a valid number.',
    };
  }

  if (num === 0) {
    return {
      isValid: false,
      error: 'Amount must be greater than zero (cannot be 0).',
    };
  }

  if (num < 0) {
    return {
      isValid: false,
      error: 'Amount cannot be negative. Must be greater than zero.',
    };
  }

  if (!isFinite(num)) {
    return {
      isValid: false,
      error: 'Amount is too large or invalid.',
    };
  }

  // Integer paisa representation to guarantee zero floating point rounding errors
  // e.g. 1250.50 PKR -> 125050 paisas
  const paisas = Math.round(num * 100);
  const cleanRupees = paisas / 100;

  return {
    isValid: true,
    cleanAmount: cleanRupees,
  };
}

/**
 * Format paisa integer to standard display
 */
export function paisasToRupees(paisas: number): number {
  return Math.round(paisas) / 100;
}

export function rupeesToPaisas(rupees: number): number {
  return Math.round(rupees * 100);
}
