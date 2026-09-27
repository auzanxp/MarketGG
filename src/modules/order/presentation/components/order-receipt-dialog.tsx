'use client';

import * as React from 'react';
import { StatusPill } from '@/components/atoms';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { type PriceBreakdown } from '@/shared/domain/price-breakdown';
import { formatOrderStatus, type OrderStatus } from '../../domain/value-objects/order-status';
import {
  formatOrderDateTime,
  orderStatusDescription,
  orderStatusTone,
  toDateTimeAttribute,
} from '../lib/order-format';
import { OrderSummaryCard, type OrderSummaryLine } from './order-summary-card';


export interface OrderReceipt {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  placedAt: Date;
  lines: readonly OrderSummaryLine[];
  breakdown: PriceBreakdown;
}

export interface OrderReceiptDialogProps {
  order: OrderReceipt | null;
  onClose: () => void;
}

export function OrderReceiptDialog({ order, onClose }: OrderReceiptDialogProps) {
  return (
    <Dialog
      open={order !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        {order && (
          <>
            <DialogHeader>
              <DialogTitle>Order {order.orderNumber}</DialogTitle>
              <DialogDescription>
                Placed{' '}
                <time dateTime={toDateTimeAttribute(order.placedAt)}>
                  {formatOrderDateTime(order.placedAt)}
                </time>
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">
                {orderStatusDescription(order.status)}
              </p>
              <StatusPill tone={orderStatusTone(order.status)} >
                {formatOrderStatus(order.status)}
              </StatusPill>
            </div>

            <OrderSummaryCard
              title="Items"
              taxLabel="Tax"
              lines={order.lines}
              breakdown={order.breakdown}
              className="border-0 p-0"
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
