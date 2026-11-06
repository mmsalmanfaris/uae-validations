export type ValidationErrorCode =
  | 'INVALID_TYPE'
  | 'INVALID_FORMAT'
  | 'INVALID_LENGTH'
  | 'INVALID_PREFIX'
  | 'INVALID_CHECKSUM';

export interface ValidationError {
  readonly code: ValidationErrorCode;
  readonly message: string;
}

export type ValidationResult =
  | { readonly valid: true; readonly normalized: string }
  | { readonly valid: false; readonly errors: readonly ValidationError[] };
