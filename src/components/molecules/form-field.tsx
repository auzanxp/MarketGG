import * as React from 'react';
import { FieldLabel } from '../atoms/field-label';
import { FieldMessage } from '../atoms/field-message';
import { cn } from '@/lib/utils';

export interface FormFieldProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  label: React.ReactNode;
  /** Must equal the control's `id`. */
  htmlFor: string;
  /** Must equal the control's `aria-describedby`. */
  messageId: string;
  children: React.ReactNode;
  error?: string;
  hint?: React.ReactNode;
  required?: boolean;
  labelAction?: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  messageId,
  children,
  error,
  hint,
  required,
  labelAction,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)} {...props}>
      <div className="flex items-baseline justify-between gap-2">
        <FieldLabel htmlFor={htmlFor} required={required}>
          {label}
        </FieldLabel>
        {labelAction}
      </div>

      {children}

      <FieldMessage
        id={messageId}
        tone={error ? 'error' : 'hint'}
        className={cn(!error && !hint && 'sr-only')}
      >
        {error ?? hint}
      </FieldMessage>
    </div>
  );
}
