import { expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render-with-providers';
import { createContainer } from '@/shared/infrastructure/di/composition-root';
import { TOKENS } from '@/shared/infrastructure/di/tokens';
import { type LoginUseCase } from '../../../application/use-cases/login.usecase';
import { UserMenu } from '../user-menu';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

it('opens the labelled account group and lets the user log out', async () => {
  const container = createContainer();
  const login = container.resolve<LoginUseCase>(TOKENS.LoginUseCase);
  expect((await login.execute({ email: 'john.doe@example.com', password: 'password123' })).isSuccess).toBe(true);
  renderWithProviders(<UserMenu />, { diContainer: container });

  fireEvent.click(await screen.findByRole('button', { name: 'Account menu for John Doe' }));
  const menu = await screen.findByRole('menu');
  const group = within(menu).getByRole('group', { name: /John Doe\s*john\.doe@example\.com/ });
  const logout = within(group).getByRole('menuitem', { name: 'Log out' });
  expect(logout).toBeEnabled();
  fireEvent.click(logout);
  await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
});
