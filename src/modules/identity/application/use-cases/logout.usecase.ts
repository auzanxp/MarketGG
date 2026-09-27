import { type DomainError } from '@/shared/domain/errors';
import { type Result } from '@/shared/domain/result';
import { type IAuthRepository } from '../../domain/repositories/auth-repository.interface';

export class LogoutUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  public async execute(): Promise<Result<void, DomainError>> {
    return this.authRepo.logout();
  }
}
