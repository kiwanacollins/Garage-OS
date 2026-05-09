'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { accessToken, loading } = useAuth();

  if (loading) {
    return <main className="dashboard">Loading...</main>;
  }

  if (!accessToken) {
    return (
      <main className="shell">
        <section className="auth-panel">
          <p className="eyebrow">GarageOS</p>
          <h1>Sign in required</h1>
          <p>Use your GarageOS account to continue.</p>
          <Link className="button link-button" href="/login">
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
