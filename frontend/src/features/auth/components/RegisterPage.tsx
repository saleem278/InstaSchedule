import { AuthLayout } from './AuthLayout';
import { GoogleButton } from './GoogleButton';
import { AuthDivider } from './AuthDivider';
import { RegisterForm } from './RegisterForm';
import { useAuthConfig } from '../hooks/useAuthConfig';

export function RegisterPage(): React.JSX.Element {
  const { data: authConfig } = useAuthConfig();

  return (
    <AuthLayout title="Create your account" subtitle="Start generating on-brand Instagram content.">
      {authConfig?.googleEnabled ? (
        <>
          <GoogleButton />
          <AuthDivider label="or continue with email" />
        </>
      ) : null}
      <RegisterForm />
    </AuthLayout>
  );
}
