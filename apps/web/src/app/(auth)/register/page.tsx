import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';

export default function RegisterPage() {
  return (
    <main className="shell">
      <section className="auth-panel">
        <p className="eyebrow">Customer portal</p>
        <h1>Create account</h1>
        <p>Register to manage vehicles, book appointments, and track repair progress.</p>
        <AuthForm mode="register" />
        <p>
          Already registered?{' '}
          <Link className="inline-link" href="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
