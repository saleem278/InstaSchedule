import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  FolderKanban,
  Image as ImageIcon,
  CalendarClock,
  History,
  Palette,
  Settings as SettingsIcon,
  LogOut,
} from 'lucide-react';
import { cn } from '@/core/utils/cn';
import { BrandSwitcher } from '@/features/brands/components/BrandSwitcher';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useActiveBrandStore } from '@/features/brands/store/activeBrandStore';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Authenticated app layout: left sidebar (Brand Switcher + primary nav) on
 * lg+ screens, collapsing to a fixed bottom tab bar below the lg breakpoint.
 * Mounted as the element for the ProtectedRoute layout route so every
 * authenticated page renders inside it via <Outlet />.
 */
export function AppShell(): React.JSX.Element {
  const { logout, isLoggingOut } = useAuth();
  const activeBrandId = useActiveBrandStore((state) => state.activeBrandId);

  const navItems: NavItem[] = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Create', to: '/projects/new', icon: Sparkles },
    { label: 'Projects', to: '/dashboard', icon: FolderKanban },
    { label: 'Media Library', to: '/media', icon: ImageIcon },
    { label: 'Scheduler', to: '/scheduler', icon: CalendarClock },
    { label: 'Prompt History', to: '/history', icon: History },
    {
      label: 'Brand Settings',
      to: activeBrandId ? `/brands/${activeBrandId}/settings` : '/brands',
      icon: Palette,
    },
  ];

  return (
    <div className="flex min-h-screen bg-background text-textPrimary">
      {/* Sidebar (lg and up) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-backgroundMuted/40 p-4 lg:flex">
        <div className="mb-4">
          <BrandSwitcher />
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accentSubtle text-accent'
                    : 'text-textSecondary hover:bg-backgroundMuted hover:text-textPrimary'
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accentSubtle text-accent'
                  : 'text-textSecondary hover:bg-backgroundMuted hover:text-textPrimary'
              )
            }
          >
            <SettingsIcon className="h-4 w-4 shrink-0" />
            Settings
          </NavLink>
          <button
            type="button"
            onClick={() => logout()}
            disabled={isLoggingOut}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-textSecondary transition-colors hover:bg-backgroundMuted hover:text-textPrimary disabled:opacity-60"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <main className="min-w-0 flex-1 overflow-x-hidden px-4 pb-16 sm:px-6 lg:px-10 lg:pb-0">
          <Outlet />
        </main>

        {/* Bottom tab bar (below lg) */}
        <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-background/95 backdrop-blur lg:hidden">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium',
                  isActive ? 'text-accent' : 'text-textSecondary'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
