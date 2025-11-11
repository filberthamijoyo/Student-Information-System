/**
 * Custom Error Types for Enrollment System
 * Distinguishes between validation errors (no retry) and transient errors (retry)
 */

/**
 * Validation Error - User/Business logic error that should not be retried
 * Examples: Missing prerequisites, time conflicts, already enrolled, credit limit exceeded
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Transient Error - Temporary system error that can be retried
 * Examples: Database connection issues, network timeouts, deadlocks
 */
export class TransientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransientError';
    Object.setPrototypeOf(this, TransientError.prototype);
  }
}
