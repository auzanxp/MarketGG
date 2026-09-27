import { BaseValueObject } from '@/shared/domain/base-value-object';
import { Email } from '@/shared/domain/email';
import { ValidationError } from '@/shared/domain/errors';
import { Result } from '@/shared/domain/result';

export interface BillingInfoProps {
  fullName: string;
  email: Email;
  phone: string;
}

export interface BillingInfoInput {
  fullName: string;
  email: string;
  phone: string;
}

const MAX_NAME_LENGTH = 120;
const MIN_NAME_LENGTH = 2;

const MIN_PHONE_DIGITS = 7;
const MAX_PHONE_DIGITS = 15;

function countDigits(value: string): number {
  return value.replace(/\D/g, '').length;
}

export class BillingInfo extends BaseValueObject<BillingInfoProps> {
  private constructor(props: BillingInfoProps) {
    super(props);
  }

  public static create(input: BillingInfoInput): Result<BillingInfo, ValidationError> {
    const fieldErrors: Record<string, string> = {};

    const fullName = (input.fullName ?? '').trim();
    if (fullName.length < MIN_NAME_LENGTH) {
      fieldErrors.fullName = 'Enter the name on the account.';
    } else if (fullName.length > MAX_NAME_LENGTH) {
      fieldErrors.fullName = 'That name is too long.';
    }

    const emailResult = Email.create(input.email ?? '');
    if (emailResult.isFailure) {
      fieldErrors.email = emailResult.error.fieldErrors.email ?? emailResult.error.message;
    }

    const phone = (input.phone ?? '').trim();
    const phoneDigits = countDigits(phone);
    if (phoneDigits < MIN_PHONE_DIGITS || phoneDigits > MAX_PHONE_DIGITS) {
      fieldErrors.phone = 'Enter a phone number we can reach you on.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return Result.fail(new ValidationError('Please check your billing details.', fieldErrors));
    }

    return Result.ok(
      new BillingInfo({ fullName, email: emailResult.value, phone })
    );
  }

  public get fullName(): string {
    return this.props.fullName;
  }

  public get email(): Email {
    return this.props.email;
  }

  public get phone(): string {
    return this.props.phone;
  }
}
