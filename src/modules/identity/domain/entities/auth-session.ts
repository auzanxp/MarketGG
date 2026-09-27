import { type User } from './user';

export interface AuthSessionProps {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export class AuthSession {
  private readonly props: AuthSessionProps;

  private constructor(props: AuthSessionProps) {
    this.props = props;
  }

  public static create(props: AuthSessionProps): AuthSession {
    if (props.accessToken.trim().length === 0) {
      throw new Error('AuthSession requires a non-empty access token');
    }
    if (Number.isNaN(props.expiresAt.getTime())) {
      throw new Error('AuthSession requires a valid expiry date');
    }
    return new AuthSession(props);
  }

  public get user(): User {
    return this.props.user;
  }

  public get accessToken(): string {
    return this.props.accessToken;
  }

  public get refreshToken(): string {
    return this.props.refreshToken;
  }

  public get expiresAt(): Date {
    return this.props.expiresAt;
  }

  public isExpired(now: Date = new Date()): boolean {
    return this.props.expiresAt.getTime() <= now.getTime();
  }

  public secondsUntilExpiry(now: Date = new Date()): number {
    return Math.max(0, Math.floor((this.props.expiresAt.getTime() - now.getTime()) / 1000));
  }

  public needsRefresh(thresholdSeconds = 60, now: Date = new Date()): boolean {
    return this.secondsUntilExpiry(now) <= thresholdSeconds;
  }
}
