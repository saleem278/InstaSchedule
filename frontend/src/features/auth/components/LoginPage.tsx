import { AuthLayout } from './AuthLayout';
import { GoogleButton } from './GoogleButton';
import { AuthDivider } from './AuthDivider';
import { LoginForm } from './LoginForm';
import { useAuthConfig } from '../hooks/useAuthConfig';

export function LoginPage(): React.JSX.Element {
  const { data: authConfig } = useAuthConfig();

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to keep creating with your brands.">
      {authConfig?.googleEnabled ? (
        <>
          <GoogleButton />
          <AuthDivider label="or continue with email" />
        </>
      ) : null}
      <LoginForm />
    </AuthLayout>
  );
}
