'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Divider,
  FileButton,
  Group,
  NumberInput,
  Paper,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { io } from 'socket.io-client';
import { CameraIcon, JobCardIcon, PartsIcon, TimerIcon, WorkOrderIcon } from '@/components/icons';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { API_URL } from '@/lib/api';

type JobStatus = 'assigned' | 'in_progress' | 'awaiting_parts' | 'completed';
type JobTab = 'inspection' | 'labour' | 'parts' | 'complete';

type LabourEntry = {
  task: string;
  hours: number;
  startedAt?: string;
  endedAt?: string;
};

type PartRequest = {
  item: string;
  quantity: number;
  urgency: 'routine' | 'urgent' | 'vehicle_down';
  note: string;
  status: string;
};

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
  recommendations: string[];
  photos: string[];
  labour: LabourEntry[];
  parts: PartRequest[];
  finalNotes: string;
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
    recommendations: ['Replace front pads before release', 'Quote lower arm bushing for approval'],
    photos: [],
    labour: [
      { task: 'Road test and lift inspection', hours: 0.6, startedAt: '09:10', endedAt: '09:46' },
      { task: 'Front brake strip-down', hours: 0.9, startedAt: '09:50', endedAt: '10:44' },
    ],
    parts: [
      { item: 'Front brake pads', quantity: 1, urgency: 'urgent', note: 'Low pad depth', status: 'Approved' },
      { item: 'Lower arm bushing', quantity: 1, urgency: 'routine', note: 'Visible cracking', status: 'Pending' },
    ],
    finalNotes: '',
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
    recommendations: ['Replace relay and retest fan cycle'],
    photos: [],
    labour: [{ task: 'Cooling pressure test', hours: 0.5, startedAt: '11:00', endedAt: '11:30' }],
    parts: [{ item: 'Fan relay', quantity: 1, urgency: 'vehicle_down', note: 'Vehicle held until relay arrives', status: 'Requested' }],
    finalNotes: '',
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
    recommendations: [],
    photos: [],
    labour: [],
    parts: [{ item: 'Cabin filter', quantity: 1, urgency: 'routine', note: 'Service item', status: 'In stock' }],
    finalNotes: '',
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

const urgencyOptions = [
  { value: 'routine', label: 'Routine' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'vehicle_down', label: 'Vehicle down' },
];

function formatHours(hours: number) {
  return `${hours.toFixed(1)}h`;
}

export default function MechanicPage() {
  const [jobItems, setJobItems] = useState(jobs);
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [selectedJobId, setSelectedJobId] = useState(jobs[0].id);
  const [tab, setTab] = useState<JobTab>('inspection');
  const [finding, setFinding] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [runningTask, setRunningTask] = useState('Diagnosis and repair');
  const [timerStartedAt, setTimerStartedAt] = useState<string | null>(null);
  const [manualTask, setManualTask] = useState('');
  const [manualHours, setManualHours] = useState<number | string>(0.5);
  const [partName, setPartName] = useState('');
  const [partQty, setPartQty] = useState<number | string>(1);
  const [partUrgency, setPartUrgency] = useState<PartRequest['urgency']>('routine');
  const [partNote, setPartNote] = useState('');
  const [finalNotes, setFinalNotes] = useState('');

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
  const labourTotal = selectedJob.labour.reduce((total, entry) => total + entry.hours, 0);

  function updateSelectedJob(update: (job: JobCard) => JobCard) {
    setJobItems((items) => items.map((job) => (job.id === selectedJob.id ? update(job) : job)));
  }

  function advanceSelectedJob() {
    if (!selectedAction) {
      return;
    }

    updateSelectedJob((job) => ({ ...job, status: selectedAction.status }));
  }

  function recordInspection() {
    if (!finding.trim() && !recommendation.trim()) {
      return;
    }

    updateSelectedJob((job) => ({
      ...job,
      status: job.status === 'assigned' ? 'in_progress' : job.status,
      findings: finding.trim() ? [...job.findings.filter((item) => item !== 'Pending initial inspection'), finding.trim()] : job.findings,
      recommendations: recommendation.trim() ? [...job.recommendations, recommendation.trim()] : job.recommendations,
    }));
    setFinding('');
    setRecommendation('');
  }

  function addPhotos(files: File[]) {
    if (!files.length) {
      return;
    }

    const urls = files.map((file) => URL.createObjectURL(file));
    updateSelectedJob((job) => ({ ...job, photos: [...job.photos, ...urls] }));
  }

  function toggleTimer() {
    if (!timerStartedAt) {
      setTimerStartedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      return;
    }

    updateSelectedJob((job) => ({
      ...job,
      status: job.status === 'assigned' ? 'in_progress' : job.status,
      labour: [
        ...job.labour,
        {
          task: runningTask.trim() || 'Labour timer',
          hours: 0.5,
          startedAt: timerStartedAt,
          endedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    }));
    setTimerStartedAt(null);
  }

  function addManualLabour() {
    const hours = Number(manualHours);
    if (!manualTask.trim() || Number.isNaN(hours) || hours <= 0) {
      return;
    }

    updateSelectedJob((job) => ({
      ...job,
      status: job.status === 'assigned' ? 'in_progress' : job.status,
      labour: [...job.labour, { task: manualTask.trim(), hours }],
    }));
    setManualTask('');
    setManualHours(0.5);
  }

  function requestPart() {
    const quantity = Number(partQty);
    if (!partName.trim() || Number.isNaN(quantity) || quantity < 1) {
      return;
    }

    updateSelectedJob((job) => ({
      ...job,
      status: 'awaiting_parts',
      parts: [
        ...job.parts,
        {
          item: partName.trim(),
          quantity,
          urgency: partUrgency,
          note: partNote.trim(),
          status: 'Requested',
        },
      ],
    }));
    setPartName('');
    setPartQty(1);
    setPartUrgency('routine');
    setPartNote('');
  }

  function submitCompletion() {
    updateSelectedJob((job) => ({
      ...job,
      status: 'completed',
      finalNotes: finalNotes.trim() || job.finalNotes || 'Ready for quality check.',
    }));
    setFinalNotes('');
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
                  setTimerStartedAt(null);
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
                <dt>Labour</dt>
                <dd>{formatHours(labourTotal)}</dd>
              </div>
            </dl>

            <Text className="job-note">{selectedJob.concern}</Text>

            <Tabs value={tab} onChange={(value) => setTab((value ?? 'inspection') as JobTab)}>
              <Tabs.List aria-label="Job card detail">
                <Tabs.Tab value="inspection">inspection</Tabs.Tab>
                <Tabs.Tab value="labour">labour</Tabs.Tab>
                <Tabs.Tab value="parts">parts</Tabs.Tab>
                <Tabs.Tab value="complete">complete</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="inspection" pt="sm">
                <div className="stack-list">
                  {selectedJob.findings.map((item) => (
                    <div className="stack-row" key={item}>
                      <span>{item}</span>
                    </div>
                  ))}
                  {selectedJob.recommendations.map((item) => (
                    <div className="stack-row muted-row" key={item}>
                      <span>{item}</span>
                    </div>
                  ))}
                  {selectedJob.photos.length ? (
                    <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="xs" aria-label="Inspection photo previews">
                      {selectedJob.photos.map((photo) => (
                        <img className="inspection-photo" key={photo} src={photo} alt="Inspection preview" />
                      ))}
                    </SimpleGrid>
                  ) : null}
                  <Textarea
                    label="Finding"
                    placeholder="Record measured fault, damage, or diagnostic result"
                    minRows={3}
                    value={finding}
                    onChange={(event) => setFinding(event.currentTarget.value)}
                  />
                  <Textarea
                    label="Recommendation"
                    placeholder="Recommended repair, customer approval note, or watch item"
                    minRows={2}
                    value={recommendation}
                    onChange={(event) => setRecommendation(event.currentTarget.value)}
                  />
                  <Group align="center" justify="space-between">
                    <FileButton onChange={addPhotos} accept="image/png,image/jpeg" multiple>
                      {(props) => (
                        <Button type="button" variant="light" leftSection={<CameraIcon size={18} />} {...props}>
                          Add photos
                        </Button>
                      )}
                    </FileButton>
                    <Button type="button" leftSection={<JobCardIcon size={18} />} onClick={recordInspection}>
                      Record finding
                    </Button>
                  </Group>
                </div>
              </Tabs.Panel>

              <Tabs.Panel value="labour" pt="sm">
                <div className="stack-list">
                  {selectedJob.labour.length ? (
                    selectedJob.labour.map((entry) => (
                      <div className="stack-row split-row" key={`${entry.task}-${entry.startedAt ?? entry.hours}`}>
                        <span>
                          {entry.task}
                          {entry.startedAt ? <small>{entry.startedAt} - {entry.endedAt}</small> : null}
                        </span>
                        <strong>{formatHours(entry.hours)}</strong>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">No labour logged yet.</div>
                  )}
                  <TextInput
                    label="Timer task"
                    value={runningTask}
                    onChange={(event) => setRunningTask(event.currentTarget.value)}
                  />
                  <Button type="button" leftSection={<TimerIcon size={18} />} onClick={toggleTimer}>
                    {timerStartedAt ? `Stop timer started ${timerStartedAt}` : 'Start labour timer'}
                  </Button>
                  <Divider label="Manual entry" labelPosition="center" />
                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <TextInput
                      label="Labour task"
                      placeholder="Replace front pads"
                      value={manualTask}
                      onChange={(event) => setManualTask(event.currentTarget.value)}
                    />
                    <NumberInput
                      label="Hours"
                      min={0.1}
                      step={0.1}
                      decimalScale={1}
                      value={manualHours}
                      onChange={setManualHours}
                    />
                  </SimpleGrid>
                  <Button type="button" variant="light" leftSection={<WorkOrderIcon size={18} />} onClick={addManualLabour}>
                    Add labour entry
                  </Button>
                </div>
              </Tabs.Panel>

              <Tabs.Panel value="parts" pt="sm">
                <div className="stack-list">
                  {selectedJob.parts.map((part) => (
                    <div className="stack-row split-row" key={`${part.item}-${part.status}`}>
                      <span>
                        {part.item} x{part.quantity}
                        <small>{part.note || urgencyOptions.find((item) => item.value === part.urgency)?.label}</small>
                      </span>
                      <strong>{part.status}</strong>
                    </div>
                  ))}
                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <TextInput
                      label="Part name"
                      placeholder="Fan relay"
                      value={partName}
                      onChange={(event) => setPartName(event.currentTarget.value)}
                    />
                    <NumberInput label="Quantity" min={1} value={partQty} onChange={setPartQty} />
                  </SimpleGrid>
                  <Select
                    label="Urgency"
                    value={partUrgency}
                    onChange={(value) => setPartUrgency((value ?? 'routine') as PartRequest['urgency'])}
                    data={urgencyOptions}
                  />
                  <Textarea
                    label="Urgency note"
                    placeholder="Why this part is needed"
                    minRows={2}
                    value={partNote}
                    onChange={(event) => setPartNote(event.currentTarget.value)}
                  />
                  <Button type="button" leftSection={<PartsIcon size={18} />} onClick={requestPart}>
                    Request part
                  </Button>
                </div>
              </Tabs.Panel>

              <Tabs.Panel value="complete" pt="sm">
                <div className="stack-list">
                  <SimpleGrid cols={3} spacing="xs">
                    <Paper className="mini-metric">
                      <Text size="xs" c="dimmed" fw={800}>Findings</Text>
                      <Text fw={800}>{selectedJob.findings.length}</Text>
                    </Paper>
                    <Paper className="mini-metric">
                      <Text size="xs" c="dimmed" fw={800}>Labour</Text>
                      <Text fw={800}>{formatHours(labourTotal)}</Text>
                    </Paper>
                    <Paper className="mini-metric">
                      <Text size="xs" c="dimmed" fw={800}>Parts</Text>
                      <Text fw={800}>{selectedJob.parts.length}</Text>
                    </Paper>
                  </SimpleGrid>
                  {selectedJob.finalNotes ? (
                    <div className="stack-row">
                      <span>{selectedJob.finalNotes}</span>
                    </div>
                  ) : null}
                  <Textarea
                    label="Final notes"
                    placeholder="Work completed, road test result, handover notes"
                    minRows={4}
                    value={finalNotes}
                    onChange={(event) => setFinalNotes(event.currentTarget.value)}
                  />
                  <Button type="button" leftSection={<WorkOrderIcon size={18} />} onClick={submitCompletion}>
                    Submit for quality check
                  </Button>
                </div>
              </Tabs.Panel>
            </Tabs>
          </Paper>
        </section>
      </main>
    </ProtectedRoute>
  );
}
