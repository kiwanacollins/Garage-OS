'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Center, Loader } from '@mantine/core';
import { useAuth } from './AuthProvider';

type RoleGuardProps = {
  allowedRoles: string[];
  children: React.ReactNode;
};

/**
 * RoleGuard — enforces role-based access at the layout level.
 *
 * - While auth is loading → show a centred spinner.
 * - Not authenticated → redirect to /login.
 * - Authenticated but wrong role → redirect to /unauthorized.
 * - Role matches → render children.
 */
export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!accessToken || !user) {
      router.replace('/login');
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      router.replace('/unauthorized');
    }
  }, [loading, accessToken, user, allowedRoles, router]);

  if (loading) {
    return (
      <Center mih="100vh">
        <Loader aria-label="Loading GarageOS" />
      </Center>
    );
  }

  if (!accessToken || !user || !allowedRoles.includes(user.role)) {
    // Render nothing while the redirect is in-flight
    return null;
  }

  return <>{children}</>;
}
