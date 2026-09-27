import { type DomainError } from '@/shared/domain/errors';
import { type Result } from '@/shared/domain/result';
import { type IAuthRepository } from '../../domain/repositories/auth-repository.interface';
import { type User } from '../../domain/entities/user';

export class GetCurrentUserUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  public async execute(): Promise<Result<User, DomainError>> {
    return this.authRepo.getCurrentUser();
  }
}
