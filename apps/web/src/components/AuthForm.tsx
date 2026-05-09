'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';

type AuthFormProps = {
  mode: 'login' | 'register';
};

export function AuthForm({ mode }: AuthFormProps) {
  const [status, setStatus] = useState<string>('');
  const { login, register } = useAuth();

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
