import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function CustomerPortalPage() {
  return (
    <ProtectedRoute>
      <main className="dashboard">
        <p className="eyebrow">Customer portal</p>
        <h1>Service status</h1>
        <p>Track vehicles, appointments, invoices, and completed service history.</p>
      </main>
    </ProtectedRoute>
  );
}
