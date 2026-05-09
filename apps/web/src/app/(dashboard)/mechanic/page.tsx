import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function MechanicPage() {
  return (
    <ProtectedRoute>
      <main className="dashboard">
        <p className="eyebrow">Mechanic</p>
        <h1>Job cards</h1>
        <p>Review assigned work, record inspection findings, log labour, and request parts.</p>
      </main>
    </ProtectedRoute>
  );
}
