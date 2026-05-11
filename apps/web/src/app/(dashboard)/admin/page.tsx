'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Group,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { io } from 'socket.io-client';
import {
  ChartIcon,
  CheckIcon,
  ExportIcon,
  JobCardIcon,
  MoneyIcon,
  PartsIcon,
  StaffIcon,
  WarningIcon,
  WorkOrderIcon,
} from '@/components/icons';
import { DashboardShell } from '@/components/DashboardShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { API_URL } from '@/lib/api';

type AssignmentStatus = 'created' | 'assigned' | 'quality_check';
type AdminTab = 'overview' | 'reports' | 'staff' | 'services' | 'operations';

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

type PartsApproval = {
  id: string;
  workOrderId: string;
  plate: string;
  part: string;
  quantity: number;
  requestedBy: string;
  note: string;
  status: 'pending' | 'approved' | 'rejected';
};

type ServiceItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  isActive: boolean;
};

type ExpenseItem = {
  id: string;
  category: string;
  description: string;
  amount: number;
};

const mechanics = [
  { id: 'mechanic-1', name: 'Moses Kato', load: 4, shift: '08:00-17:00', attendance: 'present', jobs: 18, hours: 37.5, utilisation: 94 },
  { id: 'mechanic-2', name: 'Sarah Auma', load: 2, shift: '09:00-18:00', attendance: 'present', jobs: 14, hours: 31, utilisation: 78 },
  { id: 'mechanic-3', name: 'Daniel Okello', load: 3, shift: '08:00-16:00', attendance: 'late', jobs: 11, hours: 25, utilisation: 63 },
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

const initialPartsApprovals: PartsApproval[] = [
  {
    id: 'PR-301',
    workOrderId: 'WO-1048',
    plate: 'UAX 123A',
    part: 'Lower arm bushing',
    quantity: 1,
    requestedBy: 'Moses Kato',
    note: 'Bushing has visible cracks; customer approval required before release.',
    status: 'pending',
  },
  {
    id: 'PR-302',
    workOrderId: 'WO-1052',
    plate: 'UAZ 774Q',
    part: 'Fan relay',
    quantity: 1,
    requestedBy: 'Sarah Auma',
    note: 'Vehicle held in bay until relay is available.',
    status: 'pending',
  },
];

const initialServices: ServiceItem[] = [
  { id: 'SVC-01', name: 'Oil service', category: 'Mechanical', price: 90000, isActive: true },
  { id: 'SVC-02', name: 'Brake inspection', category: 'Mechanical', price: 65000, isActive: true },
  { id: 'SVC-03', name: 'Computer diagnosis', category: 'Electrical', price: 80000, isActive: true },
];

const initialExpenses: ExpenseItem[] = [
  { id: 'EXP-01', category: 'Utilities', description: 'Workshop power', amount: 240000 },
  { id: 'EXP-02', category: 'Supplies', description: 'Cleaning consumables', amount: 95000 },
];

const revenueTrend = [
  { label: 'Mon', revenue: 1.8, expenses: 0.4 },
  { label: 'Tue', revenue: 2.4, expenses: 0.6 },
  { label: 'Wed', revenue: 2.1, expenses: 0.5 },
  { label: 'Thu', revenue: 3.2, expenses: 0.7 },
  { label: 'Fri', revenue: 2.8, expenses: 0.8 },
  { label: 'Sat', revenue: 1.6, expenses: 0.3 },
];

const statusLabels: Record<AssignmentStatus, string> = {
  created: 'Unassigned',
  assigned: 'Assigned',
  quality_check: 'Quality check',
};

const statusColors: Record<AssignmentStatus, string> = {
  created: 'orange',
  assigned: 'garageBlue',
  quality_check: 'green',
};

function money(value: number) {
  return `UGX ${value.toLocaleString()}`;
}

export default function AdminDashboardPage() {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [partsApprovals, setPartsApprovals] = useState(initialPartsApprovals);
  const [services, setServices] = useState(initialServices);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [approvalNote, setApprovalNote] = useState('');
  const [selectedId, setSelectedId] = useState(initialAssignments[0].id);
  const [selectedMechanic, setSelectedMechanic] = useState(mechanics[0].id);
  const [tab, setTab] = useState<AdminTab>('overview');
  const [dateFrom, setDateFrom] = useState('2026-05-01');
  const [dateTo, setDateTo] = useState('2026-05-10');
  const [exportStatus, setExportStatus] = useState('No export queued');
  const [serviceName, setServiceName] = useState('');
  const [serviceCategory, setServiceCategory] = useState('Mechanical');
  const [servicePrice, setServicePrice] = useState<number | string>(75000);
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

  const metrics = useMemo(() => {
    const revenueMonth = 12640000;
    const expenseTotal = expenses.reduce((total, expense) => total + expense.amount, 0);
    return {
      open: assignments.filter((assignment) => assignment.status !== 'quality_check').length,
      unassigned: assignments.filter((assignment) => assignment.status === 'created').length,
      quality: assignments.filter((assignment) => assignment.status === 'quality_check').length,
      revenueToday: 1840000,
      revenueMonth,
      outstandingInvoices: 6,
      averageTurnaround: '18.4h',
      utilisation: 78,
      appointmentsToday: 9,
      collectionReady: 4,
      partsPending: partsApprovals.filter((request) => request.status === 'pending').length,
      expenses: expenseTotal,
      taxCollected: 1886000,
      netRevenue: revenueMonth - expenseTotal,
    };
  }, [assignments, expenses, partsApprovals]);

  function assignMechanic() {
    setAssignments((items) =>
      items.map((assignment) =>
        assignment.id === selected.id
          ? { ...assignment, mechanicId: selectedMechanic, status: 'assigned' }
          : assignment,
      ),
    );
  }

  function resolvePartRequest(id: string, status: PartsApproval['status']) {
    setPartsApprovals((items) =>
      items.map((request) =>
        request.id === id
          ? {
              ...request,
              status,
              note: approvalNote.trim() ? `${request.note} Admin: ${approvalNote.trim()}` : request.note,
            }
          : request,
      ),
    );
    setApprovalNote('');
  }

  function queueExport(type: string) {
    setExportStatus(`${type} export queued for ${dateFrom} to ${dateTo}`);
  }

  function addService() {
    const price = Number(servicePrice);
    if (!serviceName.trim() || Number.isNaN(price)) {
      return;
    }

    setServices((items) => [
      ...items,
      {
        id: `SVC-${String(items.length + 1).padStart(2, '0')}`,
        name: serviceName.trim(),
        category: serviceCategory,
        price,
        isActive: true,
      },
    ]);
    setServiceName('');
    setServicePrice(75000);
  }

  return (
    <ProtectedRoute>
      <DashboardShell
        role="Admin"
        active="admin"
        dateLabel="Monday, 11 May 2026"
        title="Good evening, Operations,"
        subtitle="Revenue, assignments, staff load, and approvals for the garage floor."
        stats={[
          { value: String(metrics.open), label: 'open work orders' },
          { value: String(metrics.unassigned), label: 'unassigned jobs' },
          { value: String(metrics.quality), label: 'in quality check' },
        ]}
        secondaryAction={
          <Button variant="default" leftSection={<ExportIcon size={18} />} onClick={() => queueExport('Operations')}>
            Share report
          </Button>
        }
        primaryAction={
          <Button leftSection={<ChartIcon size={18} />} onClick={() => setTab('operations')}>
            Assign work
          </Button>
        }
      >

        <Tabs value={tab} onChange={(value) => setTab((value ?? 'overview') as AdminTab)} className="admin-tabs">
          <Tabs.List aria-label="Admin dashboard sections">
            <Tabs.Tab value="overview">overview</Tabs.Tab>
            <Tabs.Tab value="reports">reports</Tabs.Tab>
            <Tabs.Tab value="staff">staff</Tabs.Tab>
            <Tabs.Tab value="services">services</Tabs.Tab>
            <Tabs.Tab value="operations">operations</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt="md">
            <section className="admin-grid" aria-label="Dashboard KPIs">
              {[
                ['Revenue today', money(metrics.revenueToday), 'Paid invoices received today'],
                ['Revenue month', money(metrics.revenueMonth), 'Issued and paid service revenue'],
                ['Outstanding invoices', String(metrics.outstandingInvoices), 'Invoices not paid or cancelled'],
                ['Jobs by status', `${metrics.open} open`, 'Created, assigned, active, and QC jobs'],
                ['Average turnaround', metrics.averageTurnaround, 'Completed job cycle time'],
                ['Mechanic utilisation', `${metrics.utilisation}%`, 'Booked labour against capacity'],
                ['Parts awaiting approval', String(metrics.partsPending), 'Pending mechanic requests'],
                ['Appointments today', String(metrics.appointmentsToday), 'Scheduled workshop visits'],
                ['Collection-ready vehicles', String(metrics.collectionReady), 'Paid jobs ready for pickup'],
              ].map(([label, value, scope]) => (
                <Paper className="kpi-tile" key={label}>
                  <Text size="xs" c="dimmed" fw={800}>{label}</Text>
                  <Text className="metric-number">{value}</Text>
                  <Text size="xs" c="dimmed">{scope}</Text>
                </Paper>
              ))}
            </section>

            <section className="analytics-layout" aria-label="Revenue and workload analytics">
              <Paper className="analytics-panel">
                <Group justify="space-between">
                  <Stack gap={2}>
                    <Group gap="xs">
                      <MoneyIcon size={22} />
                      <Title order={2}>Revenue and expenses</Title>
                    </Group>
                    <Text c="dimmed">Net revenue includes operating expenses recorded for the selected period.</Text>
                  </Stack>
                  <Badge color="green">Net {money(metrics.netRevenue)}</Badge>
                </Group>
                <div className="bar-chart" aria-label="Revenue trend chart">
                  {revenueTrend.map((point) => (
                    <div className="bar-day" key={point.label}>
                      <span className="bar-stack">
                        <i style={{ height: `${point.revenue * 24}px` }} />
                        <b style={{ height: `${point.expenses * 24}px` }} />
                      </span>
                      <small>{point.label}</small>
                    </div>
                  ))}
                </div>
              </Paper>

              <Paper className="analytics-panel">
                <Group gap="xs">
                  <WorkOrderIcon size={22} />
                  <Title order={2}>Workload status</Title>
                </Group>
                <div className="status-bars">
                  {[
                    ['Assigned', 34, 'garageBlue'],
                    ['In progress', 28, 'garageBlue'],
                    ['Awaiting parts', 18, 'orange'],
                    ['Quality check', 20, 'green'],
                  ].map(([label, width, color]) => (
                    <div className="status-bar-row" key={label}>
                      <span>{label}</span>
                      <strong>{width}%</strong>
                      <i style={{ width: `${width}%` }} data-color={color} />
                    </div>
                  ))}
                </div>
              </Paper>
            </section>
          </Tabs.Panel>

          <Tabs.Panel value="reports" pt="md">
            <Paper className="analytics-panel" aria-label="Reports workspace">
              <Group align="flex-end" justify="space-between">
                <Stack gap={2}>
                  <Group gap="xs">
                    <ExportIcon size={22} />
                    <Title order={2}>Reports</Title>
                  </Group>
                  <Text c="dimmed">Generate revenue, job, staff, and tax summaries for the selected period.</Text>
                </Stack>
                <Group align="flex-end">
                  <TextInput label="From" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.currentTarget.value)} />
                  <TextInput label="To" type="date" value={dateTo} onChange={(event) => setDateTo(event.currentTarget.value)} />
                </Group>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                {['Revenue', 'Jobs', 'Staff performance', 'Tax summary'].map((type) => (
                  <Button key={type} type="button" variant="light" leftSection={<ExportIcon size={18} />} onClick={() => queueExport(type)}>
                    Export {type}
                  </Button>
                ))}
              </SimpleGrid>
              <div className="report-summary">
                <span>
                  <strong>{money(metrics.revenueMonth)}</strong>
                  <small>Revenue</small>
                </span>
                <span>
                  <strong>{money(metrics.expenses)}</strong>
                  <small>Expenses</small>
                </span>
                <span>
                  <strong>{money(metrics.taxCollected)}</strong>
                  <small>Tax summary</small>
                </span>
              </div>
              <Text aria-live="polite">{exportStatus}</Text>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="staff" pt="md">
            <Paper className="analytics-panel" aria-label="Staff management">
              <Group gap="xs">
                <StaffIcon size={22} />
                <Title order={2}>Staff management</Title>
              </Group>
              <Table.ScrollContainer minWidth={720}>
                <Table verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Staff</Table.Th>
                      <Table.Th>Shift</Table.Th>
                      <Table.Th>Attendance</Table.Th>
                      <Table.Th>Jobs</Table.Th>
                      <Table.Th>Hours</Table.Th>
                      <Table.Th>Utilisation</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {mechanics.map((mechanic) => (
                      <Table.Tr key={mechanic.id}>
                        <Table.Td>{mechanic.name}</Table.Td>
                        <Table.Td>{mechanic.shift}</Table.Td>
                        <Table.Td>
                          <Badge color={mechanic.attendance === 'late' ? 'orange' : 'green'}>{mechanic.attendance}</Badge>
                        </Table.Td>
                        <Table.Td>{mechanic.jobs}</Table.Td>
                        <Table.Td>{mechanic.hours}</Table.Td>
                        <Table.Td>{mechanic.utilisation}%</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="services" pt="md">
            <Paper className="analytics-panel" aria-label="Service catalogue">
              <Group align="flex-end" justify="space-between">
                <Stack gap={2}>
                  <Group gap="xs">
                    <JobCardIcon size={22} />
                    <Title order={2}>Service catalogue</Title>
                  </Group>
                  <Text c="dimmed">Standard service prices used by front desk and reports.</Text>
                </Stack>
                <Group align="flex-end">
                  <TextInput label="Service" value={serviceName} onChange={(event) => setServiceName(event.currentTarget.value)} />
                  <Select
                    label="Category"
                    value={serviceCategory}
                    onChange={(value) => setServiceCategory(value ?? 'Mechanical')}
                    data={['Mechanical', 'Electrical', 'Body work']}
                  />
                  <NumberInput label="Price" min={0} value={servicePrice} onChange={setServicePrice} />
                  <Button type="button" onClick={addService}>Add service</Button>
                </Group>
              </Group>
              <Table.ScrollContainer minWidth={640}>
                <Table verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Service</Table.Th>
                      <Table.Th>Category</Table.Th>
                      <Table.Th>Price</Table.Th>
                      <Table.Th>Status</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {services.map((service) => (
                      <Table.Tr key={service.id}>
                        <Table.Td>{service.name}</Table.Td>
                        <Table.Td>{service.category}</Table.Td>
                        <Table.Td>{money(service.price)}</Table.Td>
                        <Table.Td><Badge color={service.isActive ? 'green' : 'gray'}>{service.isActive ? 'active' : 'inactive'}</Badge></Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="operations" pt="md">
            <section className="job-layout" aria-label="Work order assignments">
              <Paper className="job-list">
                {assignments.map((assignment) => {
                  const mechanic = mechanics.find((item) => item.id === assignment.mechanicId);
                  return (
                    <UnstyledButton
                      className={`job-card ${assignment.id === selected.id ? 'is-selected' : ''}`}
                      key={assignment.id}
                      onClick={() => {
                        setSelectedId(assignment.id);
                        setSelectedMechanic(assignment.mechanicId ?? mechanics[0].id);
                      }}
                    >
                      <Badge color={statusColors[assignment.status]}>{statusLabels[assignment.status]}</Badge>
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
                    </UnstyledButton>
                  );
                })}
              </Paper>

              <Paper component="aside" className="job-detail" aria-label="Assignment detail">
                <Group className="detail-heading" align="flex-start" justify="space-between">
                  <Stack gap={2}>
                    <Text className="eyebrow">{selected.id}</Text>
                    <Title order={2}>{selected.plate}</Title>
                    <Text c="dimmed">{selected.vehicle}</Text>
                  </Stack>
                  <Badge color={statusColors[selected.status]}>{statusLabels[selected.status]}</Badge>
                </Group>

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

                <Text className="job-note">{selected.concern}</Text>

                <Select
                  label="Assign mechanic"
                  value={selectedMechanic}
                  onChange={(value) => setSelectedMechanic(value ?? mechanics[0].id)}
                  data={mechanics.map((mechanic) => ({
                    value: mechanic.id,
                    label: `${mechanic.name} (${mechanic.load} active)`,
                  }))}
                />

                <Button type="button" leftSection={<JobCardIcon size={18} />} onClick={assignMechanic}>
                  Assign job card
                </Button>
              </Paper>
            </section>

            <Paper className="approval-board" component="section" aria-label="Parts approval queue">
              <Group align="center" justify="space-between">
                <Stack gap={2}>
                  <Group gap="xs">
                    <PartsIcon size={24} />
                    <Title order={2}>Parts approval</Title>
                  </Group>
                  <Text c="dimmed">Approve, reject, or hold requested parts before purchasing.</Text>
                </Stack>
                <Badge color="orange">{partsApprovals.filter((request) => request.status === 'pending').length} pending</Badge>
              </Group>

              <Textarea
                label="Approval note"
                placeholder="Supplier, budget, customer approval, or reason for rejection"
                minRows={2}
                value={approvalNote}
                onChange={(event) => setApprovalNote(event.currentTarget.value)}
              />

              <div className="approval-list">
                {partsApprovals.map((request) => (
                  <div className="approval-row" key={request.id}>
                    <Badge color={request.status === 'approved' ? 'green' : request.status === 'rejected' ? 'red' : 'orange'}>
                      {request.status}
                    </Badge>
                    <span>
                      <strong>{request.part} x{request.quantity}</strong>
                      <small>{request.workOrderId} · {request.plate} · {request.requestedBy}</small>
                    </span>
                    <Text c="dimmed">{request.note}</Text>
                    <Group gap="xs" justify="flex-end">
                      <Button
                        type="button"
                        size="xs"
                        variant="light"
                        color="green"
                        leftSection={<CheckIcon size={16} />}
                        disabled={request.status !== 'pending'}
                        onClick={() => resolvePartRequest(request.id, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        variant="light"
                        color="red"
                        leftSection={<WarningIcon size={16} />}
                        disabled={request.status !== 'pending'}
                        onClick={() => resolvePartRequest(request.id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </Group>
                  </div>
                ))}
              </div>
            </Paper>
          </Tabs.Panel>
        </Tabs>
      </DashboardShell>
    </ProtectedRoute>
  );
}
