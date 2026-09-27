'use client';

import * as React from 'react';
import { Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { ButtonLink, IconTile, StatusPill, SuccessMark } from '@/components/atoms';
import { CopyField } from '@/components/molecules';
import { CenteredPanelTemplate } from '@/components/templates';
import { ROUTES } from '@/shared/routes';
import {
  formatOrderStatus,
  type OrderStatus,
} from '../../domain/value-objects/order-status';
import { orderStatusDescription, orderStatusTone } from '../lib/order-format';

const DEFAULT_DELIVERY_ESTIMATE = '< 30 seconds';

export interface OrderSuccessPanelProps {
  orderNumber: string;
  status: OrderStatus;
  estimatedDelivery?: string;
}

interface Presentation {
  heading: string;
  body: string;
}

const PRESENTATION: Record<OrderStatus, Presentation> = {
  COMPLETED: {
    heading: 'Payment Successful!',
    body: 'Thank you for your purchase. Your order is being processed.',
  },
  PENDING: {
    heading: 'Order received',
    body: 'Thank you for your purchase. Your order is being processed.',
  },
  FAILED: {
    heading: 'Payment did not go through',
    body: 'Your payment could not be completed. You can try again, or use a different payment method.',
  },
};

export function OrderSuccessPanel({
  orderNumber,
  status,
  estimatedDelivery = DEFAULT_DELIVERY_ESTIMATE,
}: OrderSuccessPanelProps) {
  const { heading, body } = PRESENTATION[status];
  const hasFailed = status === 'FAILED';

  return (
    <CenteredPanelTemplate maxWidth="md">
      <div className="flex flex-col items-center gap-8 sm:flex-row sm:text-left">
        <div className="flex items-center justify-center md:pr-10">
          {hasFailed ? (
            <IconTile tone="destructive" size="lg" className="size-20 [&_svg]:size-9">
              <XCircle />
            </IconTile>
          ) : status === 'PENDING' ? (
            <IconTile tone="primary" size="lg" className="size-20 [&_svg]:size-9">
              <Clock />
            </IconTile>
          ) : (
            <SuccessMark />
          )}
        </div>

        <div className="flex w-full min-w-0 flex-1 flex-col gap-6">
          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              {heading}
            </h1>
            <p className="text-sm text-muted-foreground">{body}</p>
          </div>

          <div className="w-full space-y-4 rounded-2xl border border-border bg-card p-5 text-left">
            <CopyField
              label="Order ID"
              value={orderNumber}
              onCopied={() => toast.success('Order ID copied')}
              onCopyFailed={() =>
                toast.error('Could not copy automatically', {
                  description: 'Select the order ID and copy it manually.',
                })
              }
            />

            {!hasFailed && (
              <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">Estimated Delivery</p>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Clock className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  {estimatedDelivery}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">Status</p>
              <StatusPill tone={orderStatusTone(status)}>
                {formatOrderStatus(status)}
              </StatusPill>
            </div>

            <p className="text-xs text-muted-foreground">{orderStatusDescription(status)}</p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row">
            {hasFailed ? (
              <ButtonLink href={ROUTES.checkout} size="xl" className="font-semibold">
                Try again
              </ButtonLink>
            ) : (
              <ButtonLink href={ROUTES.marketplace} size="xl" className="font-semibold">
                Back to Marketplace
              </ButtonLink>
            )}

            <ButtonLink href={ROUTES.orders} variant="outline" size="xl">
              View Order History
            </ButtonLink>
          </div>
        </div>
      </div>
    </CenteredPanelTemplate>
  );
}
