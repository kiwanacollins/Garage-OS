'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, PasswordInput, Stack, Text, TextInput } from '@mantine/core';
import { useAuth } from './AuthProvider';
import { getRoleRoute } from '@/lib/role-route';

type AuthFormProps = {
  mode: 'login' | 'register';
};

export function AuthForm({ mode }: AuthFormProps) {
  const [status, setStatus] = useState<string>('');
  const router = useRouter();
  const { login, register, user, accessToken } = useAuth();

  useEffect(() => {
    if (!accessToken || !user) {
      return;
    }

    router.replace(getRoleRoute(user.role));
  }, [accessToken, router, user]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries()) as {
      name?: string;
      email: string;
      phone?: string;
      password: string;
    };

    setStatus('Submitting...');
    try {
      if (mode === 'login') {
        await login({ email: payload.email, password: payload.password });
      } else {
        await register({
          name: payload.name ?? '',
          email: payload.email,
          phone: payload.phone,
          password: payload.password,
        });
      }
      setStatus('Signed in');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to continue');
    }
  }

  return (
    <form onSubmit={submit}>
      <Stack gap="sm">
      {mode === 'register' ? (
        <TextInput name="name" label="Name" autoComplete="name" required minLength={2} />
      ) : null}
      <TextInput name="email" label="Email" type="email" autoComplete="email" required />
      {mode === 'register' ? (
        <TextInput name="phone" label="Phone" type="tel" autoComplete="tel" />
      ) : null}
      <PasswordInput
        name="password"
        label="Password"
        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        required
        minLength={8}
      />
      <Button type="submit" fullWidth>
        {mode === 'login' ? 'Sign in' : 'Create account'}
      </Button>
      {status ? <Text c="dimmed" role="status">{status}</Text> : null}
      </Stack>
    </form>
  );
}
