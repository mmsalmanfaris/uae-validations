/**
 * Universal validation result contract across all uae-validations modules.
 * Identical in shape to the `lanka-validations` contract.
 */
export interface ValidationSuccess<T> {
  isValid: true;
  data: T;
  error?: never;
  errors?: never;
  code?: never;
}

/** A failed validation. `code` is stable across releases and safe to branch on; `error` is an English message for display. */
export interface ValidationFailure {
  isValid: false;
  data?: never;
  error: string;
  errors: string[];
  code: string;
}

/** Checking `isValid` narrows this result to success data or failure details. */
export type ValidationResult<T = unknown> = ValidationSuccess<T> | ValidationFailure;

/** A single validation problem, optionally tied to a form field. */
export interface ValidationError {
  field?: string;
  code: string;
  message: string;
}

/** An official publication a validation rule or reference table is based on. */
export interface ReferenceSource {
  /** Issuing authority, for example `'Federal Authority for Identity, Citizenship, Customs and Port Security (ICP)'`. */
  authority: string;
  /** Title of the document or page. */
  title: string;
  /** Where the document can be read. */
  url: string;
  /** Date (`YYYY-MM-DD`) the rule was last checked against this source. */
  lastReviewed: string;
}
