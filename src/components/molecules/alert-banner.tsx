import * as React from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertBannerVariants = cva(
  'flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm',
  {
    variants: {
      tone: {
        error: 'border-destructive/20 bg-destructive-subtle text-destructive-subtle-foreground',
        warning: 'border-warning/25 bg-warning-subtle text-warning-subtle-foreground',
        success: 'border-success/20 bg-success-subtle text-success-subtle-foreground',
        info: 'border-info/20 bg-info-subtle text-info-subtle-foreground',
      },
    },
    defaultVariants: {
      tone: 'info',
    },
  }
);

const TONE_ICONS = {
  error: CircleAlert,
  warning: TriangleAlert,
  success: CircleCheck,
  info: Info,
} as const;

export interface AlertBannerProps
  extends Omit<React.ComponentProps<'div'>, 'title'>,
    VariantProps<typeof alertBannerVariants> {
  title?: React.ReactNode;
  children?: React.ReactNode;
}

export function AlertBanner({
  tone = 'info',
  title,
  children,
  className,
  ...props
}: AlertBannerProps) {
  const resolvedTone = tone ?? 'info';
  const Icon = TONE_ICONS[resolvedTone];
  const isUrgent = resolvedTone === 'error' || resolvedTone === 'warning';

  return (
    <div
      role={isUrgent ? 'alert' : 'status'}
      className={cn(alertBannerVariants({ tone: resolvedTone }), className)}
      {...props}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-0.5">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-[0.8125rem] leading-relaxed opacity-90">{children}</div>}
      </div>
    </div>
  );
}
