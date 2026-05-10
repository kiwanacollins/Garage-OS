import Link from 'next/link';
import { Anchor, Center, Paper, Stack, Text, Title } from '@mantine/core';
import { AuthForm } from '@/components/AuthForm';

export default function RegisterPage() {
  return (
    <Center component="main" mih="100vh" p="md">
      <Paper w="min(440px, 100%)" p="xl" shadow="sm">
        <Stack>
        <Text className="eyebrow">Customer portal</Text>
        <Title order={1}>Create account</Title>
        <Text c="dimmed">Register to manage vehicles, book appointments, and track repair progress.</Text>
        <AuthForm mode="register" />
        <Text c="dimmed">
          Already registered?{' '}
          <Anchor component={Link} href="/login">
            Sign in
          </Anchor>
        </Text>
        </Stack>
      </Paper>
    </Center>
  );
}
