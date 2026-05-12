import Link from 'next/link';
import Image from 'next/image';
import { Anchor, Center, Paper, Stack, Text, Title } from '@mantine/core';
import { AuthForm } from '@/components/AuthForm';
import { BRAND_ALT_TEXT, LOGO_PATHS, LOGO_DIMENSIONS } from '@/lib/branding';

export default function LoginPage() {
  return (
    <Center component="main" mih="100vh" p="md">
      <Paper w="min(440px, 100%)" p="xl" shadow="sm">
        <Stack>
        <Center mb="md">
          <Image
            src={LOGO_PATHS.medium}
            alt={BRAND_ALT_TEXT}
            width={LOGO_DIMENSIONS.medium.width}
            height={LOGO_DIMENSIONS.medium.height}
            priority
          />
        </Center>
        <Title order={1} ta="center">Sign in</Title>
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
