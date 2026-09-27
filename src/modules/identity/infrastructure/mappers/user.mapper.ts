import { ContractMismatchError } from '@/shared/domain/errors';
import { Result } from '@/shared/domain/result';
import { User } from '../../domain/entities/user';
import { Email } from '@/shared/domain/email';
import { type UserDto } from '../schemas/auth.schema';

export function mapUserDtoToDomain(
  dto: UserDto,
  context = 'user payload'
): Result<User, ContractMismatchError> {
  const emailResult = Email.create(dto.email);
  if (emailResult.isFailure) {
    return Result.fail(
      new ContractMismatchError(
        `${context}: "email" is not a valid address (received ${JSON.stringify(dto.email)})`,
        { cause: emailResult.error }
      )
    );
  }

  try {
    return Result.ok(
      User.create({
        id: dto.id,
        email: emailResult.value,
        name: dto.name,
        plan: dto.plan,
        avatarUrl: dto.avatarUrl,
      })
    );
  } catch (error: unknown) {
    return Result.fail(
      new ContractMismatchError(
        `${context}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      )
    );
  }
}
