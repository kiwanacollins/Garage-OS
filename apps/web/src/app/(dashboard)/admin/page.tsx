export default function AdminDashboardPage() {
  return (
    <main className="dashboard">
      <p className="eyebrow">Admin</p>
      <h1>Garage dashboard</h1>
      <p>Operational overview for jobs, revenue, staff workload, and service flow.</p>
      <section className="dashboard-grid">
        <div className="metric">Open work orders<strong>18</strong></div>
        <div className="metric">Awaiting parts<strong>4</strong></div>
        <div className="metric">Today&apos;s revenue<strong>UGX 3.2M</strong></div>
      </section>
    </main>
  );
}
