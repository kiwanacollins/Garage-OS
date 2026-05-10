import Link from 'next/link';
import { Anchor, Center, Paper, Stack, Text, Title } from '@mantine/core';
import { AuthForm } from '@/components/AuthForm';

export default function LoginPage() {
  return (
    <Center component="main" mih="100vh" p="md">
      <Paper w="min(440px, 100%)" p="xl" shadow="sm">
        <Stack>
        <Text className="eyebrow">GarageOS</Text>
        <Title order={1}>Sign in</Title>
        <Text c="dimmed">Access work orders, vehicles, invoices, and service updates from one workspace.</Text>
        <AuthForm mode="login" />
        <Text c="dimmed">
          New customer?{' '}
          <Anchor component={Link} href="/register">
            Create an account
          </Anchor>
        </Text>
        </Stack>
      </Paper>
    </Center>
  );
}
