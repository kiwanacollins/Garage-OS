import Link from 'next/link';
import Image from 'next/image';
import { Anchor, Center, Paper, Stack, Text, Title } from '@mantine/core';
import { AuthForm } from '@/components/AuthForm';
import { BRAND_ALT_TEXT, LOGO_PATHS, LOGO_DIMENSIONS } from '@/lib/branding';

export default function RegisterPage() {
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
        <Text className="eyebrow" ta="center">Customer portal</Text>
        <Title order={1} ta="center">Create account</Title>
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
