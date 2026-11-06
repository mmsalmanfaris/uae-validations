export interface FieldValidationContext<T extends object> {
  readonly key: keyof T;
  readonly data: T;
}

export type FieldValidator<T extends object> = (value: unknown, context: FieldValidationContext<T>) => boolean | string;

export interface FieldSchema<T extends object> {
  readonly required?: boolean;
  readonly validators?: readonly FieldValidator<T>[];
}

export type ObjectSchema<T extends object> = { readonly [K in keyof T]?: FieldSchema<T> };

export interface SchemaIssue<T extends object = Record<string, unknown>> {
  readonly path: keyof T;
  readonly code: 'REQUIRED' | 'INVALID';
  readonly message: string;
}

export type SchemaValidationResult<T extends object> =
  | { readonly valid: true; readonly data: T }
  | { readonly valid: false; readonly errors: readonly SchemaIssue<T>[] };

const isEmpty = (value: unknown): boolean => value === undefined || value === null || value === '';

export function validateSchema<T extends object>(data: unknown, schema: ObjectSchema<T>): SchemaValidationResult<T> {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { valid: false, errors: [{ path: '$' as keyof T, code: 'INVALID', message: 'Value must be an object.' }] };
  }
  const typedData = data as T;
  const errors: SchemaIssue<T>[] = [];
  for (const key of Object.keys(schema) as (keyof T)[]) {
    const field = schema[key];
    if (!field) continue;
    const value = typedData[key];
    if (isEmpty(value)) {
      if (field.required) errors.push({ path: key, code: 'REQUIRED', message: 'This field is required.' });
      continue;
    }
    for (const validator of field.validators ?? []) {
      const result = validator(value, { key, data: typedData });
      if (result !== true) errors.push({ path: key, code: 'INVALID', message: typeof result === 'string' ? result : 'The value is invalid.' });
    }
  }
  return errors.length ? { valid: false, errors } : { valid: true, data: typedData };
}

export const asFieldValidator = <T extends object>(validator: (value: unknown) => boolean, message = 'The value is invalid.'): FieldValidator<T> =>
  (value) => validator(value) || message;

export const matchesField = <T extends object>(otherKey: keyof T, message = 'The values do not match.'): FieldValidator<T> =>
  (value, context) => value === context.data[otherKey] || message;
