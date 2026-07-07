import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

/**
 * Minimal account settings page (distinct from per-brand Brand Settings).
 * Shows the signed-in user's profile info and a sign-out action.
 */
export function SettingsPage(): React.JSX.Element {
  const { user } = useCurrentUser();
  const { logout, isLoggingOut } = useAuth();

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-semibold text-textPrimary">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border border-border">
              <AvatarImage src={user?.avatarUrl} alt={user?.name ?? 'User'} />
              <AvatarFallback>{user ? initials(user.name) : '—'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-textPrimary">{user?.name ?? 'Unknown user'}</p>
              <p className="text-xs text-textSecondary">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => logout()} disabled={isLoggingOut}>
            Log out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
