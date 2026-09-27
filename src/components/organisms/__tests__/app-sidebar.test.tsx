import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { AppSidebar, type SidebarNavItem } from '../app-sidebar';

const ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <svg data-testid="icon-dashboard" /> },
  { label: 'Marketplace', href: '/marketplace', icon: <svg data-testid="icon-marketplace" /> },
  { label: 'Orders', href: '/orders', icon: <svg data-testid="icon-orders" />, isAvailable: false },
];

describe('AppSidebar', () => {
  describe('structure', () => {
    it('exposes a named navigation landmark containing a list', () => {
      render(<AppSidebar items={ITEMS} activePath="/dashboard" />);

      const nav = screen.getByRole('navigation', { name: 'Main' });
      expect(within(nav).getAllByRole('listitem')).toHaveLength(3);
    });

    it('renders brand and footer slots', () => {
      render(
        <AppSidebar
          items={ITEMS}
          activePath="/dashboard"
          brand={<span>VocaMarket</span>}
          footer={<button type="button">Logout</button>}
        />
      );

      expect(screen.getByText('VocaMarket')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('marks the current page with aria-current, not just colour', () => {
      render(<AppSidebar items={ITEMS} activePath="/dashboard" />);

      expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
        'aria-current',
        'page'
      );
      expect(screen.getByRole('link', { name: 'Marketplace' })).not.toHaveAttribute(
        'aria-current'
      );
    });

    it('keeps a section active on its child routes', () => {
      render(<AppSidebar items={ITEMS} activePath="/marketplace/prod-1" />);

      expect(screen.getByRole('link', { name: 'Marketplace' })).toHaveAttribute(
        'aria-current',
        'page'
      );
    });

    it('does not let a similar prefix steal the active state', () => {
      render(
        <AppSidebar
          items={[{ label: 'Orders', href: '/orders', icon: <svg /> }]}
          activePath="/orders-archive"
        />
      );

      expect(screen.getByRole('link', { name: 'Orders' })).not.toHaveAttribute('aria-current');
    });
  });

  describe('unavailable destinations', () => {
    it('renders them as focusable aria-disabled buttons, not links', () => {
      render(<AppSidebar items={ITEMS} activePath="/dashboard" />);

      const orders = screen.getByRole('button', { name: /Orders/ });

      expect(orders).toHaveAttribute('aria-disabled', 'true');
      expect(orders).not.toBeDisabled();
      expect(screen.queryByRole('link', { name: /Orders/ })).not.toBeInTheDocument();
    });

    it('says "coming soon" to assistive tech', () => {
      render(<AppSidebar items={ITEMS} activePath="/dashboard" />);

      expect(screen.getByRole('button', { name: /coming soon/i })).toBeInTheDocument();
    });

    it('reports the selection so the caller can explain itself', () => {
      const onUnavailableSelect = vi.fn();
      render(
        <AppSidebar
          items={ITEMS}
          activePath="/dashboard"
          onUnavailableSelect={onUnavailableSelect}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Orders/ }));

      expect(onUnavailableSelect).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Orders', href: '/orders' })
      );
    });
  });
});
