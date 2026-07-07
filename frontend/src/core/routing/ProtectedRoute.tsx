import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

/**
 * Route guard for authenticated areas of the app.
 *
 * Usage (as a layout route wrapping children via <Outlet />):
 *
 *   {
 *     element: <ProtectedRoute />,
 *     children: [
 *       { path: '/dashboard', element: <DashboardPage /> },
 *       { path: '/brands/:id', element: <BrandDetailPage /> },
 *       // ...other authenticated pages other agents add here
 *     ],
 *   }
 *
 * It renders nothing (a lightweight full-screen loading state) while the
 * `me` query is in flight, redirects to `/login` (preserving the attempted
 * location in router state as `from`) when unauthenticated, and otherwise
 * renders the matched child route via <Outlet />.
 *
 * Alternative usage wrapping a single element directly:
 *
 *   <ProtectedRoute><DashboardPage /></ProtectedRoute>
 */
interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps): React.JSX.Element | null {
  const { isAuthenticated, isLoading } = useCurrentUser();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
