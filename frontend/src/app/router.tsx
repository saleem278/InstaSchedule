import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { LoginPage } from '@/features/auth/components/LoginPage';
import { RegisterPage } from '@/features/auth/components/RegisterPage';
import { ProtectedRoute } from '@/core/routing/ProtectedRoute';
import { AppShell } from '@/app/AppShell';
import { SettingsPage } from '@/app/pages/SettingsPage';
import { BrandsPage } from '@/features/brands/components/BrandsPage';
import { BrandCreationWizard } from '@/features/brands/components/BrandCreationWizard';
import { BrandSettingsPage } from '@/features/brands/components/BrandSettingsPage';
import { MediaLibraryPage } from '@/features/media/components/MediaLibraryPage';
import { Dashboard } from '@/features/projects/components/Dashboard';
import { ProjectDetailPage } from '@/features/projects/components/ProjectDetailPage';
import { CreateWizard } from '@/features/ai-generation/components/CreateWizard';
import { PromptHistoryPage } from '@/features/ai-generation/components/history/PromptHistoryPage';
import { SchedulerPage } from '@/features/scheduler/components/SchedulerPage';

/**
 * Redirects `/` based on auth state: signed-in users go straight to the
 * dashboard, everyone else to login. Uses the same `useCurrentUser` check as
 * ProtectedRoute so both stay consistent while the `me` query resolves.
 */
function HomeRedirect(): React.JSX.Element | null {
  const { isAuthenticated, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

export const router = createBrowserRouter([
  { path: '/', element: <HomeRedirect /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    // Authenticated area layout route. ProtectedRoute guards auth, AppShell
    // renders the sidebar/bottom-tab-bar navigation and an <Outlet /> for
    // the matched child page (see core/routing/ProtectedRoute.tsx and
    // app/AppShell.tsx). Other agents should add their authenticated page
    // routes into this `children` array rather than creating a competing
    // top-level route.
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/projects/:projectId', element: <ProjectDetailPage /> },
          { path: '/brands', element: <BrandsPage /> },
          { path: '/brands/:brandId/settings', element: <BrandSettingsPage /> },
          { path: '/media', element: <MediaLibraryPage /> },
          { path: '/scheduler', element: <SchedulerPage /> },
          { path: '/history', element: <PromptHistoryPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
      // CreateWizard and BrandCreationWizard are full-screen takeovers
      // (fixed inset-0), not regular pages, so they render outside AppShell
      // but still require authentication.
      { path: '/projects/new', element: <CreateWizard /> },
      { path: '/brands/new', element: <BrandCreationWizard /> },
    ],
  },
]);
