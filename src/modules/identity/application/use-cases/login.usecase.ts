import { type DomainError, ValidationError } from '@/shared/domain/errors';
import { Result } from '@/shared/domain/result';
import { type AuthSession } from '../../domain/entities/auth-session';
import { type IAuthRepository } from '../../domain/repositories/auth-repository.interface';
import { Email } from '@/shared/domain/email';

export interface LoginInput {
  email: string;
  password: string;
}

export class LoginUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  public async execute(input: LoginInput): Promise<Result<AuthSession, DomainError>> {
    const emailResult = Email.create(input?.email ?? '');
    const password = input?.password ?? '';

    const fieldErrors: Record<string, string> = {};

    if (emailResult.isFailure) {
      fieldErrors.email = emailResult.error.fieldErrors.email ?? emailResult.error.message;
    }

    // Reject only empty passwords at login; account-specific rules belong to the server.
    if (password.length === 0) {
      fieldErrors.password = 'Password is required.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return Result.fail(
        new ValidationError('Please check the highlighted fields and try again.', fieldErrors)
      );
    }

    return this.authRepo.login({ email: emailResult.value, password });
  }
}
