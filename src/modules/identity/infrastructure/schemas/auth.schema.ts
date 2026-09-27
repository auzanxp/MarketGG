import { z } from 'zod';
import { Email } from '@/shared/domain/email';

export const LoginRequestSchema = z.object({
  email: z.string({ error: 'Email is required.' }).trim().min(1, 'Email is required.')
    .refine((value) => !value || Email.create(value).isSuccess, 'Enter a valid email address.'),
  password: z.string({ error: 'Password is required.' }).min(1, 'Password is required.'),
});

export const MembershipPlanSchema = z.enum(['FREE', 'PREMIUM']);

export const UserDtoSchema = z.object({
  id: z.string().min(1),
  email: z.string().min(1),
  name: z.string().min(1),
  plan: MembershipPlanSchema.default('FREE'),
  avatarUrl: z.string().optional(),
});

export const AuthTokensDtoSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string(),
  expiresIn: z.number().int().positive(),
});

export const LoginResponseSchema = z.object({
  user: UserDtoSchema,
  tokens: AuthTokensDtoSchema,
});

export type MembershipPlanDto = z.infer<typeof MembershipPlanSchema>;
export type UserDto = z.infer<typeof UserDtoSchema>;
export type AuthTokensDto = z.infer<typeof AuthTokensDtoSchema>;
export type LoginResponseDto = z.infer<typeof LoginResponseSchema>;
