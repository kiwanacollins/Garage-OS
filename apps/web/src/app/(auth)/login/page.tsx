import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';

export default function LoginPage() {
  return (
    <main className="shell">
      <section className="auth-panel">
        <p className="eyebrow">GarageOS</p>
        <h1>Sign in</h1>
        <p>Access work orders, vehicles, invoices, and service updates from one workspace.</p>
        <AuthForm mode="login" />
        <p>
          New customer?{' '}
          <Link className="inline-link" href="/register">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
