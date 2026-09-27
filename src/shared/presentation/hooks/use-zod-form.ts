'use client';

import * as React from 'react';
import type { z } from 'zod';

type StringKeys<TValues> = {
  [K in keyof TValues]-?: TValues[K] extends string | undefined ? K : never;
}[keyof TValues] &
  string;

export type FormErrors<TValues> = Partial<Record<keyof TValues & string, string>>;
export type FormTouched<TValues> = Partial<Record<keyof TValues & string, boolean>>;

export interface FieldBinding {
  id: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  'aria-invalid'?: true;
  'aria-describedby': string;
  ref: (element: HTMLElement | null) => void;
}

export interface UseZodFormOptions<TSchema extends z.ZodObject> {
  schema: TSchema;
  initialValues: z.input<TSchema>;
  onSubmit: (values: z.output<TSchema>) => void | Promise<void>;
}

export interface UseZodFormReturn<TSchema extends z.ZodObject> {
  values: z.input<TSchema>;
  errors: FormErrors<z.input<TSchema>>;
  touched: FormTouched<z.input<TSchema>>;
  isSubmitting: boolean;
  hasSubmitted: boolean;
  setValue: <K extends keyof z.input<TSchema> & string>(name: K, value: z.input<TSchema>[K]) => void;
  /** Server field names must match the form keys. */
  setFieldErrors: (fieldErrors: Readonly<Record<string, string>>) => void;
  clearErrors: () => void;
  reset: () => void;
  handleSubmit: (event?: React.FormEvent<HTMLFormElement>) => Promise<void>;
  fieldProps: (name: StringKeys<z.input<TSchema>>) => FieldBinding;
  errorId: (name: keyof z.input<TSchema> & string) => string;
}

interface ZodLikeIssue {
  readonly path: readonly PropertyKey[];
  readonly message: string;
}

function collectFieldErrors<TValues>(issues: readonly ZodLikeIssue[]): FormErrors<TValues> {
  const result: Record<string, string> = {};
  for (const issue of issues) {
    const [first] = issue.path;
    if (typeof first !== 'string' || first in result) {
      continue;
    }
    result[first] = issue.message;
  }
  return result as FormErrors<TValues>;
}

export function useZodForm<TSchema extends z.ZodObject>({
  schema,
  initialValues,
  onSubmit,
}: UseZodFormOptions<TSchema>): UseZodFormReturn<TSchema> {
  type TValues = z.input<TSchema>;
  type TKey = keyof TValues & string;

  const idPrefix = React.useId();
  const initialValuesRef = React.useRef(initialValues);

  const [values, setValues] = React.useState<TValues>(initialValues);
  const [errors, setErrors] = React.useState<FormErrors<TValues>>({});
  const [touched, setTouched] = React.useState<FormTouched<TValues>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hasSubmitted, setHasSubmitted] = React.useState(false);

  const controlRefs = React.useRef(new Map<string, HTMLElement>());
  const submittingRef = React.useRef(false);

  const errorId = React.useCallback((name: TKey) => `${idPrefix}-${name}-error`, [idPrefix]);

  const validateField = React.useCallback(
    (name: TKey, nextValues: TValues): string | undefined => {
      const result = schema.safeParse(nextValues);
      if (result.success) {
        return undefined;
      }
      return collectFieldErrors<TValues>(result.error.issues)[name];
    },
    [schema]
  );

  const setValue = React.useCallback(
    <K extends TKey>(name: K, value: TValues[K]) => {
      setValues((current) => {
        const next = { ...current, [name]: value };
        // Clear existing errors while typing; validate new errors on blur or submit.
        setErrors((currentErrors) => {
          if (!currentErrors[name]) {
            return currentErrors;
          }
          return validateField(name, next) ? currentErrors : { ...currentErrors, [name]: undefined };
        });
        return next;
      });
    },
    [validateField]
  );

  const setFieldErrors = React.useCallback((fieldErrors: Readonly<Record<string, string>>) => {
    setErrors((current) => ({ ...current, ...(fieldErrors as FormErrors<TValues>) }));
    setTouched((current) => {
      const next = { ...current };
      for (const key of Object.keys(fieldErrors)) {
        next[key as TKey] = true;
      }
      return next;
    });
  }, []);

  const clearErrors = React.useCallback(() => setErrors({}), []);

  const reset = React.useCallback(() => {
    setValues(initialValuesRef.current);
    setErrors({});
    setTouched({});
    setHasSubmitted(false);
    setIsSubmitting(false);
  }, []);

  const handleSubmit = React.useCallback(
    async (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      if (submittingRef.current) return;
      setHasSubmitted(true);

      const result = schema.safeParse(values);
      if (!result.success) {
        const nextErrors = collectFieldErrors<TValues>(result.error.issues);
        setErrors(nextErrors);
        setTouched(
          Object.keys(nextErrors).reduce<FormTouched<TValues>>((acc, key) => {
            acc[key as TKey] = true;
            return acc;
          }, {})
        );
        const [firstInvalid] = Object.keys(nextErrors);
        if (firstInvalid) {
          controlRefs.current.get(firstInvalid)?.focus();
        }
        return;
      }

      setErrors({});
      submittingRef.current = true;
      setIsSubmitting(true);
      try {
        await onSubmit(result.data as z.output<TSchema>);
      } finally {
        submittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [onSubmit, schema, values]
  );

  const fieldProps = React.useCallback(
    (name: StringKeys<TValues>): FieldBinding => {
      const key = name as TKey;
      const message = errors[key];
      const isVisible = Boolean(message) && (touched[key] === true || hasSubmitted);

      return {
        id: `${idPrefix}-${name}`,
        name,
        value: (values[key] ?? '') as string,
        onChange: (event) => setValue(key, event.target.value as TValues[TKey]),
        onBlur: () => {
          setTouched((current) => ({ ...current, [key]: true }));
          const message = validateField(key, values);
          setErrors((current) => ({ ...current, [key]: message }));
        },
        'aria-describedby': errorId(key),
        ...(isVisible ? { 'aria-invalid': true as const } : {}),
        ref: (element) => {
          if (element) {
            controlRefs.current.set(name, element);
          } else {
            controlRefs.current.delete(name);
          }
        },
      };
    },
    [errorId, errors, hasSubmitted, idPrefix, setValue, touched, validateField, values]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    hasSubmitted,
    setValue,
    setFieldErrors,
    clearErrors,
    reset,
    handleSubmit,
    fieldProps,
    errorId,
  };
}
