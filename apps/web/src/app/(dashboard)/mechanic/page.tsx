'use client';

import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { API_URL } from '@/lib/api';

type JobStatus = 'assigned' | 'in_progress' | 'awaiting_parts' | 'completed';
type JobTab = 'inspection' | 'labour' | 'parts';

type JobCard = {
  id: string;
  status: JobStatus;
  plate: string;
  vehicle: string;
  customer: string;
  promisedAt: string;
  bay: string;
  concern: string;
  odometer: number;
  findings: string[];
  labour: { task: string; time: string }[];
  parts: { item: string; status: string }[];
};

const jobs: JobCard[] = [
  {
    id: 'WO-1048',
    status: 'in_progress',
    plate: 'UAX 123A',
    vehicle: '2018 Toyota Harrier',
    customer: 'Alice Nakato',
    promisedAt: 'Today 16:00',
    bay: 'Bay 2',
    concern: 'Brake vibration above 80 km/h, inspect front axle and pads.',
    odometer: 54210,
    findings: ['Front pads below 3 mm', 'Right lower arm bushing cracked'],
    labour: [
      { task: 'Road test and lift inspection', time: '0.6h' },
      { task: 'Front brake strip-down', time: '0.9h' },
    ],
    parts: [
      { item: 'Front brake pads', status: 'Approved' },
      { item: 'Lower arm bushing', status: 'Pending' },
    ],
  },
  {
    id: 'WO-1052',
    status: 'awaiting_parts',
    plate: 'UAZ 774Q',
    vehicle: '2014 Mitsubishi Pajero',
    customer: 'Brian Mugisha',
    promisedAt: 'Tomorrow 11:30',
    bay: 'Hold',
    concern: 'Intermittent overheating during traffic stops.',
    odometer: 118430,
    findings: ['Radiator fan relay failing under heat', 'Coolant low on arrival'],
    labour: [{ task: 'Cooling pressure test', time: '0.5h' }],
    parts: [{ item: 'Fan relay', status: 'Requested' }],
  },
  {
    id: 'WO-1055',
    status: 'assigned',
    plate: 'UBK 442M',
    vehicle: '2016 Subaru Forester',
    customer: 'Nadia Achieng',
    promisedAt: 'Today 18:00',
    bay: 'Bay 4',
    concern: 'Oil service, cabin filter, and suspension noise check.',
    odometer: 86100,
    findings: ['Pending initial inspection'],
    labour: [],
    parts: [{ item: 'Cabin filter', status: 'In stock' }],
  },
];

const statusLabels: Record<JobStatus, string> = {
  assigned: 'Assigned',
  in_progress: 'In progress',
  awaiting_parts: 'Awaiting parts',
  completed: 'Completed',
};

const nextStatus: Partial<Record<JobStatus, { label: string; status: JobStatus }>> = {
  assigned: { label: 'Start work', status: 'in_progress' },
  in_progress: { label: 'Mark complete', status: 'completed' },
  awaiting_parts: { label: 'Resume work', status: 'in_progress' },
};

export default function MechanicPage() {
  const [jobItems, setJobItems] = useState(jobs);
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [selectedJobId, setSelectedJobId] = useState(jobs[0].id);
  const [tab, setTab] = useState<JobTab>('inspection');

  useEffect(() => {
    const socket = io(API_URL, { transports: ['websocket'], autoConnect: true });
    socket.on('work-order:status-updated', (event: { workOrderId: string; status: JobStatus }) => {
      if (!Object.hasOwn(statusLabels, event.status)) {
        return;
      }

      setJobItems((items) =>
        items.map((job) => (job.id === event.workOrderId ? { ...job, status: event.status } : job)),
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const filteredJobs = useMemo(
    () => (statusFilter === 'all' ? jobItems : jobItems.filter((job) => job.status === statusFilter)),
    [jobItems, statusFilter],
  );
  const selectedJob = jobItems.find((job) => job.id === selectedJobId) ?? filteredJobs[0] ?? jobItems[0];
  const selectedAction = nextStatus[selectedJob.status];

  function advanceSelectedJob() {
    if (!selectedAction) {
      return;
    }

    setJobItems((items) =>
      items.map((job) => (job.id === selectedJob.id ? { ...job, status: selectedAction.status } : job)),
    );
  }

  return (
    <ProtectedRoute>
      <main className="dashboard job-workspace">
        <section className="workspace-header" aria-labelledby="mechanic-title">
          <div>
            <p className="eyebrow">Mechanic</p>
            <h1 id="mechanic-title">Job cards</h1>
            <p>Review assigned work, record findings, track labour, and request parts.</p>
          </div>
          <div className="workspace-actions" aria-label="Job filters">
            {(['all', 'assigned', 'in_progress', 'awaiting_parts', 'completed'] as const).map((status) => (
              <button
                className={`segment-button ${statusFilter === status ? 'is-active' : ''}`}
                type="button"
                key={status}
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' ? 'All' : statusLabels[status]}
              </button>
            ))}
          </div>
        </section>

        <section className="job-layout" aria-label="Mechanic job cards">
          <div className="job-list">
            {filteredJobs.map((job) => (
              <button
                className={`job-card ${job.id === selectedJob.id ? 'is-selected' : ''}`}
                type="button"
                key={job.id}
                onClick={() => {
                  setSelectedJobId(job.id);
                  setTab('inspection');
                }}
              >
                <span className={`status-badge status-${job.status}`}>{statusLabels[job.status]}</span>
                <span>
                  <strong className="mono-value">{job.plate}</strong>
                  <small>{job.vehicle}</small>
                </span>
                <span>
                  {job.customer}
                  <small>{job.concern}</small>
                </span>
                <span>
                  {job.bay}
                  <small>{job.promisedAt}</small>
                </span>
              </button>
            ))}
          </div>

          <aside className="job-detail" aria-label="Selected job card">
            <div className="detail-heading">
              <div>
                <p className="eyebrow">{selectedJob.id}</p>
                <h2>{selectedJob.plate}</h2>
                <p>{selectedJob.vehicle}</p>
              </div>
              <div className="detail-actions">
                <span className={`status-badge status-${selectedJob.status}`}>{statusLabels[selectedJob.status]}</span>
                {selectedAction ? (
                  <button className="button compact-button" type="button" onClick={advanceSelectedJob}>
                    {selectedAction.label}
                  </button>
                ) : null}
              </div>
            </div>

            <dl className="detail-list compact-detail">
              <div>
                <dt>Customer</dt>
                <dd>{selectedJob.customer}</dd>
              </div>
              <div>
                <dt>Odometer</dt>
                <dd>{selectedJob.odometer.toLocaleString()} km</dd>
              </div>
              <div>
                <dt>Promise</dt>
                <dd>{selectedJob.promisedAt}</dd>
              </div>
            </dl>

            <p className="job-note">{selectedJob.concern}</p>

            <div className="tab-list" role="tablist" aria-label="Job card detail">
              {(['inspection', 'labour', 'parts'] as const).map((item) => (
                <button
                  className={`tab-button ${tab === item ? 'is-active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === item}
                  key={item}
                  onClick={() => setTab(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="tab-panel">
              {tab === 'inspection' ? (
                <div className="stack-list">
                  {selectedJob.findings.map((finding) => (
                    <div className="stack-row" key={finding}>
                      <span>{finding}</span>
                    </div>
                  ))}
                  <button className="button" type="button">Record finding</button>
                </div>
              ) : null}

              {tab === 'labour' ? (
                <div className="stack-list">
                  {selectedJob.labour.length ? (
                    selectedJob.labour.map((entry) => (
                      <div className="stack-row split-row" key={entry.task}>
                        <span>{entry.task}</span>
                        <strong>{entry.time}</strong>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">No labour logged yet.</div>
                  )}
                  <button className="button" type="button">Start labour timer</button>
                </div>
              ) : null}

              {tab === 'parts' ? (
                <div className="stack-list">
                  {selectedJob.parts.map((part) => (
                    <div className="stack-row split-row" key={part.item}>
                      <span>{part.item}</span>
                      <strong>{part.status}</strong>
                    </div>
                  ))}
                  <button className="button" type="button">Request part</button>
                </div>
              ) : null}
            </div>
          </aside>
        </section>
      </main>
    </ProtectedRoute>
  );
}
