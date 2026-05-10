'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Tabs,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { io } from 'socket.io-client';
import { JobCardIcon, WorkOrderIcon } from '@/components/icons';
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

const statusColors: Record<JobStatus, string> = {
  assigned: 'garageBlue',
  in_progress: 'garageBlue',
  awaiting_parts: 'orange',
  completed: 'green',
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
        <Group className="workspace-header" align="flex-end" justify="space-between" aria-labelledby="mechanic-title">
          <Stack gap={4}>
            <Text className="eyebrow">Mechanic</Text>
            <Group gap="xs">
              <JobCardIcon size={30} />
              <Title id="mechanic-title" order={1}>Job cards</Title>
            </Group>
            <Text c="dimmed">Review assigned work, record findings, track labour, and request parts.</Text>
          </Stack>
          <SegmentedControl
            aria-label="Job filters"
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as JobStatus | 'all')}
            data={[
              { value: 'all', label: 'All' },
              { value: 'assigned', label: 'Assigned' },
              { value: 'in_progress', label: 'In progress' },
              { value: 'awaiting_parts', label: 'Awaiting parts' },
              { value: 'completed', label: 'Completed' },
            ]}
          />
        </Group>

        <section className="job-layout" aria-label="Mechanic job cards">
          <Paper className="job-list">
            {filteredJobs.map((job) => (
              <UnstyledButton
                className={`job-card ${job.id === selectedJob.id ? 'is-selected' : ''}`}
                key={job.id}
                onClick={() => {
                  setSelectedJobId(job.id);
                  setTab('inspection');
                }}
              >
                <Badge color={statusColors[job.status]}>{statusLabels[job.status]}</Badge>
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
              </UnstyledButton>
            ))}
          </Paper>

          <Paper component="aside" className="job-detail" aria-label="Selected job card">
            <Group className="detail-heading" align="flex-start" justify="space-between">
              <Stack gap={2}>
                <Text className="eyebrow">{selectedJob.id}</Text>
                <Title order={2}>{selectedJob.plate}</Title>
                <Text c="dimmed">{selectedJob.vehicle}</Text>
              </Stack>
              <Stack className="detail-actions" gap="xs" align="flex-end">
                <Badge color={statusColors[selectedJob.status]}>{statusLabels[selectedJob.status]}</Badge>
                {selectedAction ? (
                  <Button size="xs" type="button" leftSection={<WorkOrderIcon size={16} />} onClick={advanceSelectedJob}>
                    {selectedAction.label}
                  </Button>
                ) : null}
              </Stack>
            </Group>

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

            <Text className="job-note">{selectedJob.concern}</Text>

            <Tabs value={tab} onChange={(value) => setTab((value ?? 'inspection') as JobTab)}>
              <Tabs.List aria-label="Job card detail">
                <Tabs.Tab value="inspection">inspection</Tabs.Tab>
                <Tabs.Tab value="labour">labour</Tabs.Tab>
                <Tabs.Tab value="parts">parts</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="inspection" pt="sm">
                <div className="stack-list">
                  {selectedJob.findings.map((finding) => (
                    <div className="stack-row" key={finding}>
                      <span>{finding}</span>
                    </div>
                  ))}
                  <Button type="button" leftSection={<JobCardIcon size={18} />}>Record finding</Button>
                </div>
              </Tabs.Panel>

              <Tabs.Panel value="labour" pt="sm">
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
                  <Button type="button" leftSection={<WorkOrderIcon size={18} />}>Start labour timer</Button>
                </div>
              </Tabs.Panel>

              <Tabs.Panel value="parts" pt="sm">
                <div className="stack-list">
                  {selectedJob.parts.map((part) => (
                    <div className="stack-row split-row" key={part.item}>
                      <span>{part.item}</span>
                      <strong>{part.status}</strong>
                    </div>
                  ))}
                  <Button type="button" leftSection={<WorkOrderIcon size={18} />}>Request part</Button>
                </div>
              </Tabs.Panel>
            </Tabs>
          </Paper>
        </section>
      </main>
    </ProtectedRoute>
  );
}
