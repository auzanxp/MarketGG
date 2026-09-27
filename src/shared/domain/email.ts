import { BaseValueObject } from '@/shared/domain/base-value-object';
import { ValidationError } from '@/shared/domain/errors';
import { Result } from '@/shared/domain/result';

interface EmailProps {
  value: string;
}

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const MAX_LENGTH = 254;

export class Email extends BaseValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props);
  }

  public static create(raw: string): Result<Email, ValidationError> {
    const normalised = (raw ?? '').trim().toLowerCase();

    if (normalised.length === 0) {
      return Result.fail(
        new ValidationError('Email is required.', { email: 'Email is required.' })
      );
    }

    if (normalised.length > MAX_LENGTH) {
      return Result.fail(
        new ValidationError('That email address is too long.', {
          email: 'That email address is too long.',
        })
      );
    }

    if (!EMAIL_SHAPE.test(normalised)) {
      return Result.fail(
        new ValidationError('Enter a valid email address.', {
          email: 'Enter a valid email address.',
        })
      );
    }

    return Result.ok(new Email({ value: normalised }));
  }

  public get value(): string {
    return this.props.value;
  }

  public get domain(): string {
    return this.props.value.slice(this.props.value.indexOf('@') + 1);
  }

  public toString(): string {
    return this.props.value;
  }
}
