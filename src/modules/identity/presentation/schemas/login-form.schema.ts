import { z } from 'zod';
import { Email } from '@/shared/domain/email';

export const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required.')
    .refine((value) => Email.create(value).isSuccess, {
      message: 'Enter a valid email address.',
    }),
  password: z.string().min(1, 'Password is required.'),
});

export type LoginFormValues = z.input<typeof loginFormSchema>;

export const LOGIN_FORM_INITIAL_VALUES: LoginFormValues = {
  email: '',
  password: '',
};
