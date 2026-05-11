'use client';

import Link from 'next/link';
import { Button, Center, Paper, Stack, Text, Title } from '@mantine/core';
import { PiLockKey } from 'react-icons/pi';
import { useAuth } from '@/components/AuthProvider';
import { getRoleRoute } from '@/lib/role-route';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  const dashboardHref = getRoleRoute(user?.role);

  return (
    <Center component="main" mih="100vh" p="md">
      <Paper w="min(480px, 100%)" p="xl" shadow="sm">
        <Stack align="center" gap="md">
          <PiLockKey size={48} aria-hidden />
          <Title order={2} ta="center">
            Access denied
          </Title>
          <Text c="dimmed" ta="center">
            You don&apos;t have permission to view this page. Please use the
            link below to return to your workspace.
          </Text>
          <Button component={Link} href={dashboardHref} fullWidth>
            Go to my dashboard
          </Button>
          {!user && (
            <Button component={Link} href="/login" variant="subtle" fullWidth>
              Sign in
            </Button>
          )}
        </Stack>
      </Paper>
    </Center>
  );
}
