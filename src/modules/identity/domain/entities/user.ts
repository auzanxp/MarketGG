import { BaseEntity } from '@/shared/domain/base-entity';
import { type Email } from '@/shared/domain/email';

export type MembershipPlan = 'FREE' | 'PREMIUM';

export interface UserProps {
  id: string;
  email: Email;
  name: string;
  plan: MembershipPlan;
  avatarUrl?: string;
}

export class User extends BaseEntity<string> {
  private readonly props: UserProps;

  private constructor(props: UserProps) {
    super(props.id);
    this.props = props;
  }

  public static create(props: UserProps): User {
    if (props.id.trim().length === 0) {
      throw new Error('User id cannot be empty');
    }
    if (props.name.trim().length === 0) {
      throw new Error('User name cannot be empty');
    }
    return new User({ ...props, name: props.name.trim() });
  }

  public get email(): Email {
    return this.props.email;
  }

  public get name(): string {
    return this.props.name;
  }

  public get plan(): MembershipPlan {
    return this.props.plan;
  }

  public get avatarUrl(): string | undefined {
    return this.props.avatarUrl;
  }

  public get isPremium(): boolean {
    return this.props.plan === 'PREMIUM';
  }

  public get firstName(): string {
    return this.props.name.split(/\s+/)[0] ?? this.props.name;
  }

  public get initials(): string {
    const parts = this.props.name.split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '?';
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
}
