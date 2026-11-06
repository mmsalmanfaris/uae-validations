/**
 * Every validator, parser, and formatter in one import.
 *
 * Each area is also available as a subpath, such as `uae-validations/emirates-id`,
 * which keeps bundles small. This module also exports the shared `ValidationResult`
 * types and string helpers.
 *
 * @example
 * ```ts
 * import { isValidEmiratesId, isValidUaeIban, toAsciiDigits } from 'uae-validations';
 *
 * isValidEmiratesId('784-1990-1234567-6'); // true
 * isValidUaeIban('AE070331234567890123456'); // true
 * toAsciiDigits('٧٨٤'); // '784'
 * ```
 *
 * @module uae-validations
 */

// Core types & utilities
export * from './core/types';
export * from './core/normalize';
export { createFailure, createSuccess, luhnCheck, luhnCheckDigit } from './core/utils';

// Identity
export * from './emirates-id';
export * from './mrz';

// Contact
export * from './phone';
export * from './administrative';

// Banking & tax
export * from './iban';
export * from './swift';
export * from './tax';
export * from './currency';
export * from './vat';

// Text
export * from './arabic';
