import * as React from 'react';
import { Coins, Gamepad2, Gem, ShieldCheck, Zap } from 'lucide-react';

const TRUST_SIGNALS = [
  { Icon: Zap, label: 'Instant delivery' },
  { Icon: ShieldCheck, label: 'Secure payment' },
  { Icon: Coins, label: 'Best rates' },
] as const;

function FloatingTile({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`absolute flex items-center justify-center rounded-2xl bg-card shadow-lg ring-1 ring-foreground/5 ${className ?? ''}`}
    >
      {children}
    </div>
  );
}

export function AuthBrandPanel() {
  return (
    <div className="flex max-w-sm flex-col items-center gap-10 text-center">
      <div className="relative flex h-64 w-64 items-center justify-center">
        <div className="absolute inset-4 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative size-40 -rotate-[10deg] rounded-3xl bg-primary shadow-2xl shadow-primary/40">
          <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-white/25 to-transparent" />
          <div className="absolute top-6 left-6 h-7 w-9 rounded-md bg-white/30" />
          <div className="absolute bottom-6 left-6 h-2 w-20 rounded-full bg-white/40" />
          <div className="absolute bottom-6 right-6 h-2 w-6 rounded-full bg-white/25" />
        </div>

        <FloatingTile className="-bottom-1 -left-3 size-20 rotate-6">
          <Gamepad2 className="size-9 text-primary" aria-hidden="true" />
        </FloatingTile>

        <FloatingTile className="-top-2 -right-1 size-16 -rotate-6">
          <Gem className="size-7 text-info" aria-hidden="true" />
        </FloatingTile>

        <FloatingTile className="-right-3 bottom-10 size-14 rotate-12">
          <Coins className="size-6 text-warning" aria-hidden="true" />
        </FloatingTile>
      </div>

      <div className="space-y-2">
        <p className="font-heading text-2xl font-bold tracking-tight text-primary">
          Fast. Secure. Reliable.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Top up your favorite games and digital products in seconds.
        </p>
      </div>

      <ul className="flex items-center gap-5 text-xs font-medium text-muted-foreground">
        {TRUST_SIGNALS.map(({ Icon, label }) => (
          <li key={label} className="flex items-center gap-1.5">
            <Icon className="size-3.5 text-primary" aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
