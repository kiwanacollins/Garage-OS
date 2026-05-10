'use client';

import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { API_URL } from '@/lib/api';

type AssignmentStatus = 'created' | 'assigned' | 'quality_check';

type Assignment = {
  id: string;
  status: AssignmentStatus;
  plate: string;
  vehicle: string;
  customer: string;
  concern: string;
  mechanicId: string | null;
  createdAt: string;
};

const mechanics = [
  { id: 'mechanic-1', name: 'Moses Kato', load: 4 },
  { id: 'mechanic-2', name: 'Sarah Auma', load: 2 },
  { id: 'mechanic-3', name: 'Daniel Okello', load: 3 },
];

const initialAssignments: Assignment[] = [
  {
    id: 'WO-1058',
    status: 'created',
    plate: 'UCA 990P',
    vehicle: '2020 Mazda CX-5',
    customer: 'Grace Tumusiime',
    concern: 'Check engine light and rough idle at start.',
    mechanicId: null,
    createdAt: '10 May 2026, 10:40',
  },
  {
    id: 'WO-1055',
    status: 'assigned',
    plate: 'UBK 442M',
    vehicle: '2016 Subaru Forester',
    customer: 'Nadia Achieng',
    concern: 'Oil service and suspension noise check.',
    mechanicId: 'mechanic-1',
    createdAt: '10 May 2026, 09:05',
  },
  {
    id: 'WO-1049',
    status: 'quality_check',
    plate: 'UBH 810L',
    vehicle: '2017 Nissan X-Trail',
    customer: 'Oscar Lwanga',
    concern: 'Post-service review before invoice.',
    mechanicId: 'mechanic-2',
    createdAt: '9 May 2026, 16:45',
  },
];

const statusLabels: Record<AssignmentStatus, string> = {
  created: 'Unassigned',
  assigned: 'Assigned',
  quality_check: 'Quality check',
};

export default function AdminDashboardPage() {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [selectedId, setSelectedId] = useState(initialAssignments[0].id);
  const [selectedMechanic, setSelectedMechanic] = useState(mechanics[0].id);
  const selected = assignments.find((assignment) => assignment.id === selectedId) ?? assignments[0];

  useEffect(() => {
    const socket = io(API_URL, { transports: ['websocket'], autoConnect: true });
    socket.on(
      'work-order:status-updated',
      (event: { workOrderId: string; status: AssignmentStatus; assignedMechanicId?: string | null }) => {
        if (!Object.hasOwn(statusLabels, event.status)) {
          return;
        }

        setAssignments((items) =>
          items.map((assignment) =>
            assignment.id === event.workOrderId
              ? {
                  ...assignment,
                  status: event.status,
                  mechanicId: event.assignedMechanicId ?? assignment.mechanicId,
                }
              : assignment,
          ),
        );
      },
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  const metrics = useMemo(
    () => ({
      open: assignments.filter((assignment) => assignment.status !== 'quality_check').length,
      unassigned: assignments.filter((assignment) => assignment.status === 'created').length,
      quality: assignments.filter((assignment) => assignment.status === 'quality_check').length,
    }),
    [assignments],
  );

  function assignMechanic() {
    setAssignments((items) =>
      items.map((assignment) =>
        assignment.id === selected.id
          ? { ...assignment, mechanicId: selectedMechanic, status: 'assigned' }
          : assignment,
      ),
    );
  }

  return (
    <ProtectedRoute>
      <main className="dashboard job-workspace">
        <section className="workspace-header" aria-labelledby="admin-title">
          <div>
            <p className="eyebrow">Admin</p>
            <h1 id="admin-title">Work order assignment</h1>
            <p>Review new work, balance mechanic load, and move job cards into active service.</p>
          </div>
          <section className="assignment-metrics" aria-label="Plan status">
            <div>
              Open<strong>{metrics.open}</strong>
            </div>
            <div>
              Unassigned<strong>{metrics.unassigned}</strong>
            </div>
            <div>
              QC<strong>{metrics.quality}</strong>
            </div>
          </section>
        </section>

        <section className="job-layout" aria-label="Work order assignments">
          <div className="job-list">
            {assignments.map((assignment) => {
              const mechanic = mechanics.find((item) => item.id === assignment.mechanicId);
              return (
                <button
                  className={`job-card ${assignment.id === selected.id ? 'is-selected' : ''}`}
                  type="button"
                  key={assignment.id}
                  onClick={() => {
                    setSelectedId(assignment.id);
                    setSelectedMechanic(assignment.mechanicId ?? mechanics[0].id);
                  }}
                >
                  <span className={`status-badge status-${assignment.status}`}>{statusLabels[assignment.status]}</span>
                  <span>
                    <strong className="mono-value">{assignment.plate}</strong>
                    <small>{assignment.vehicle}</small>
                  </span>
                  <span>
                    {assignment.customer}
                    <small>{assignment.concern}</small>
                  </span>
                  <span>
                    {mechanic?.name ?? 'No mechanic'}
                    <small>{assignment.createdAt}</small>
                  </span>
                </button>
              );
            })}
          </div>

          <aside className="job-detail" aria-label="Assignment detail">
            <div className="detail-heading">
              <div>
                <p className="eyebrow">{selected.id}</p>
                <h2>{selected.plate}</h2>
                <p>{selected.vehicle}</p>
              </div>
              <span className={`status-badge status-${selected.status}`}>{statusLabels[selected.status]}</span>
            </div>

            <dl className="detail-list compact-detail">
              <div>
                <dt>Customer</dt>
                <dd>{selected.customer}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{selected.createdAt}</dd>
              </div>
              <div>
                <dt>Current mechanic</dt>
                <dd>{mechanics.find((item) => item.id === selected.mechanicId)?.name ?? 'Unassigned'}</dd>
              </div>
            </dl>

            <p className="job-note">{selected.concern}</p>

            <label className="field">
              <span>Assign mechanic</span>
              <select value={selectedMechanic} onChange={(event) => setSelectedMechanic(event.target.value)}>
                {mechanics.map((mechanic) => (
                  <option value={mechanic.id} key={mechanic.id}>
                    {mechanic.name} ({mechanic.load} active)
                  </option>
                ))}
              </select>
            </label>

            <button className="button" type="button" onClick={assignMechanic}>
              Assign job card
            </button>
          </aside>
        </section>
      </main>
    </ProtectedRoute>
  );
}
