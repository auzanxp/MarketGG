'use client';

import * as React from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { Avatar } from '@/components/atoms';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useLogout, useSession } from '../hooks/use-session';

export function UserMenu() {
  const { user, isLoading } = useSession();
  const logout = useLogout();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2.5 px-1.5 py-1">
        <Skeleton className="size-9 rounded-full" />
        <div className="hidden space-y-1.5 sm:block">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-2.5 w-12" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Account menu for ${user.name}`}
        className="flex items-center gap-2.5 rounded-xl px-1.5 py-1 transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <Avatar src={user.avatarUrl} name={user.name} initials={user.initials} size="md" />

        <span aria-hidden="true" className="hidden min-w-0 text-left sm:block">
          <span className="block truncate text-sm font-semibold text-foreground">{user.name}</span>
          <span className="block text-xs text-muted-foreground">
            {user.isPremium ? 'Premium' : 'Free'}
          </span>
        </span>

        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">{user.name}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {user.email.value}
            </span>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            disabled={logout.isPending}
            onClick={() => logout.mutate(undefined)}
          >
            <LogOut aria-hidden="true" />
            {logout.isPending ? 'Signing out…' : 'Log out'}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
