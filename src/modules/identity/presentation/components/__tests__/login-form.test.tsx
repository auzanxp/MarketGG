import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render-with-providers';
import { MAX_LOGIN_ATTEMPTS } from '@/mocks/db/mock-db';
import { LoginForm } from '../login-form';

const { replaceMock, toastInfoMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  toastInfoMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: { info: toastInfoMock, success: vi.fn(), error: vi.fn() },
}));

const VALID = { email: 'john.doe@example.com', password: 'password123' };

function setup(redirectTo = '/marketplace') {
  replaceMock.mockClear();
  toastInfoMock.mockClear();
  return renderWithProviders(<LoginForm redirectTo={redirectTo} />);
}

function getEmailInput() {
  return screen.getByLabelText('Email') as HTMLInputElement;
}

function getPasswordInput() {
  return screen.getByLabelText('Password') as HTMLInputElement;
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: 'Login' }));
}

function fillCredentials(email: string, password: string) {
  fireEvent.change(getEmailInput(), { target: { value: email } });
  fireEvent.change(getPasswordInput(), { target: { value: password } });
}

describe('LoginForm', () => {
  describe('accessibility wiring', () => {
    it('associates every input with its label', () => {
      setup();

      expect(getEmailInput()).toBeInTheDocument();
      expect(getPasswordInput()).toBeInTheDocument();
    });

    it('exposes exactly one top-level heading', () => {
      setup();

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/welcome back/i);
    });

    it('sets the input attributes password managers and mobile keyboards rely on', () => {
      setup();

      expect(getEmailInput()).toHaveAttribute('type', 'email');
      expect(getEmailInput()).toHaveAttribute('autocomplete', 'email');
      expect(getEmailInput()).toHaveAttribute('inputmode', 'email');
      expect(getPasswordInput()).toHaveAttribute('autocomplete', 'current-password');
    });

    it('points each input at its own message node', () => {
      setup();

      const describedBy = getEmailInput().getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(document.getElementById(describedBy as string)).toBeInTheDocument();
    });

    it('marks a field invalid only once the error is visible', () => {
      setup();

      expect(getEmailInput()).not.toHaveAttribute('aria-invalid');

      submit();

      expect(getEmailInput()).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('client-side validation', () => {
    it('reports both empty fields on submit', async () => {
      setup();

      submit();

      expect(await screen.findByText('Email is required.')).toBeInTheDocument();
      expect(screen.getByText('Password is required.')).toBeInTheDocument();
      expect(replaceMock).not.toHaveBeenCalled();
    });

    it('moves focus to the first field that needs fixing', () => {
      setup();

      submit();

      expect(getEmailInput()).toHaveFocus();
    });

    it('rejects a malformed email using the domain rule', async () => {
      setup();
      fillCredentials('not-an-email', 'password123');

      submit();

      expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    });

    it('clears a field error as soon as the user fixes it', async () => {
      setup();
      submit();
      expect(await screen.findByText('Email is required.')).toBeInTheDocument();

      fireEvent.change(getEmailInput(), { target: { value: VALID.email } });

      await waitFor(() => {
        expect(screen.queryByText('Email is required.')).not.toBeInTheDocument();
      });
    });

    it('does not shout at the user while they are still typing', () => {
      setup();

      fireEvent.change(getEmailInput(), { target: { value: 'j' } });

      expect(screen.queryByText('Enter a valid email address.')).not.toBeInTheDocument();
    });

    it('validates on blur once the field has been visited', async () => {
      setup();

      fireEvent.change(getEmailInput(), { target: { value: 'nope' } });
      fireEvent.blur(getEmailInput());

      expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    });
  });

  describe('password reveal', () => {
    it('toggles the input type and reports its state', () => {
      setup();

      const toggle = screen.getByRole('button', { name: 'Show password' });
      expect(getPasswordInput()).toHaveAttribute('type', 'password');
      expect(toggle).toHaveAttribute('aria-pressed', 'false');

      fireEvent.click(toggle);

      expect(getPasswordInput()).toHaveAttribute('type', 'text');
      expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });
  });

  describe('submission', () => {
    it('signs in and navigates to the requested destination', async () => {
      setup('/marketplace?category=Games');
      fillCredentials(VALID.email, VALID.password);

      submit();

      await waitFor(() => {
        expect(replaceMock).toHaveBeenCalledWith('/marketplace?category=Games');
      });
    });

    it('shows a busy state and blocks a second submit', async () => {
      setup();
      fillCredentials(VALID.email, VALID.password);

      submit();

      const busyButton = await screen.findByRole('button', { name: /signing in/i });
      expect(busyButton).toBeDisabled();
      expect(getEmailInput()).toBeDisabled();
    });

    it('surfaces rejected credentials in a banner, not on a field', async () => {
      setup();
      fillCredentials(VALID.email, 'definitely-wrong');

      submit();

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Unable to sign in');
      expect(alert).toHaveTextContent('The email or password you entered is incorrect.');
      expect(replaceMock).not.toHaveBeenCalled();
    });

    it('recovers: a corrected password after a failure signs in', async () => {
      setup();
      fillCredentials(VALID.email, 'wrong');
      submit();
      await screen.findByRole('alert');

      fireEvent.change(getPasswordInput(), { target: { value: VALID.password } });
      submit();

      await waitFor(() => {
        expect(replaceMock).toHaveBeenCalledWith('/marketplace');
      });
    });

    it('reports throttling distinctly from a wrong password', async () => {
      setup();
      fillCredentials(VALID.email, 'wrong');

      for (let attempt = 0; attempt < MAX_LOGIN_ATTEMPTS; attempt += 1) {
        submit();
        await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
      }

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Too many attempts');
      });
    });
  });

  describe('demo affordances', () => {
    it('fills the form with the demo account', async () => {
      setup();

      fireEvent.click(screen.getByRole('button', { name: /fill demo credentials/i }));

      await waitFor(() => {
        expect(getEmailInput().value).toBe(VALID.email);
        expect(getPasswordInput().value).toBe(VALID.password);
      });
    });

    it('says plainly that out-of-scope actions are not implemented', () => {
      setup();

      fireEvent.click(screen.getByRole('button', { name: /forgot password/i }));

      expect(toastInfoMock).toHaveBeenCalledWith(
        expect.stringContaining('not part of this iteration'),
        expect.anything()
      );
    });
  });
});
