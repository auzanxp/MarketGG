export interface MockUser {
  id: string;
  email: string;
  // Fixture credentials only; never use these accounts for a real service.
  password: string;
  name: string;
  plan: 'FREE' | 'PREMIUM';
  avatarUrl: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  plan: 'FREE' | 'PREMIUM';
  avatarUrl: string;
}

// Serialize public fields explicitly to keep fixture credentials out of API responses.
export function toPublicUser(user: MockUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    avatarUrl: user.avatarUrl,
  };
}

export const INITIAL_USERS: MockUser[] = [
  {
    id: 'usr-101',
    email: 'john.doe@example.com',
    password: 'password123',
    name: 'John Doe',
    plan: 'PREMIUM',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-102',
    email: 'jane.smith@example.com',
    password: 'password123',
    name: 'Jane Smith',
    plan: 'FREE',
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
];
