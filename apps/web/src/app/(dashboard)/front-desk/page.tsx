import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function FrontDeskPage() {
  return (
    <ProtectedRoute>
      <main className="dashboard">
        <p className="eyebrow">Front desk</p>
        <h1>Customer intake</h1>
        <p>Look up customers, register vehicles, check in appointments, and prepare invoices.</p>
      </main>
    </ProtectedRoute>
  );
}
