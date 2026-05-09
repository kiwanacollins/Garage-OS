'use client';

import { useState } from 'react';

type AuthFormProps = {
  mode: 'login' | 'register';
};

export function AuthForm({ mode }: AuthFormProps) {
  const [status, setStatus] = useState<string>('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const endpoint = mode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register';

    setStatus('Submitting...');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}${endpoint}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        setStatus(body?.message ?? 'Unable to continue');
        return;
      }

      const body = (await response.json()) as { accessToken: string; refreshToken: string };
      window.localStorage.setItem('garageos.accessToken', body.accessToken);
      window.localStorage.setItem('garageos.refreshToken', body.refreshToken);
      setStatus('Signed in');
    } catch {
      setStatus('API is not reachable');
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      {mode === 'register' ? (
        <label className="field">
          <span>Name</span>
          <input name="name" autoComplete="name" required minLength={2} />
        </label>
      ) : null}
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      {mode === 'register' ? (
        <label className="field">
          <span>Phone</span>
          <input name="phone" type="tel" autoComplete="tel" />
        </label>
      ) : null}
      <label className="field">
        <span>Password</span>
        <input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8} />
      </label>
      <button className="button" type="submit">
        {mode === 'login' ? 'Sign in' : 'Create account'}
      </button>
      {status ? <p role="status">{status}</p> : null}
    </form>
  );
}
