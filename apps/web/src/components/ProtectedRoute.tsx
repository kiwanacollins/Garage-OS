'use client';

import Link from 'next/link';
import { Button, Center, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { useAuth } from './AuthProvider';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { accessToken, loading } = useAuth();

  if (loading) {
    return (
      <Center component="main" mih="100vh">
        <Loader aria-label="Loading GarageOS" />
      </Center>
    );
  }

  if (!accessToken) {
    return (
      <Center component="main" mih="100vh" p="md">
        <Paper w="min(440px, 100%)" p="xl" shadow="sm">
          <Stack>
            <Text className="eyebrow">GarageOS</Text>
            <Title order={1}>Sign in required</Title>
            <Text c="dimmed">Use your GarageOS account to continue.</Text>
          <Button component={Link} href="/login">
            Sign in
          </Button>
          </Stack>
        </Paper>
      </Center>
    );
  }

  return <>{children}</>;
}
