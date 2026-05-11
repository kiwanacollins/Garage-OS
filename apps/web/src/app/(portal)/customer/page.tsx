import { Badge, Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import {
  PiCalendarCheck,
  PiCarProfile,
  PiCreditCard,
  PiReceipt,
  PiSealCheck,
  PiTimer,
  PiWrench,
} from 'react-icons/pi';
import type { IconType } from 'react-icons';
import { DashboardShell } from '@/components/DashboardShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const serviceTimeline = [
  { label: 'Checked in', time: '09:20', status: 'done' },
  { label: 'Inspection', time: '10:15', status: 'done' },
  { label: 'Parts approval', time: 'Waiting', status: 'current' },
  { label: 'Quality check', time: 'Next', status: 'idle' },
];

const invoices = [
  { id: 'INV-1842', item: 'Brake service deposit', amount: 'UGX 120,000', status: 'Paid' },
  { id: 'INV-1849', item: 'Front pads and labour', amount: 'UGX 277,300', status: 'Issued' },
];

const contextItems: Array<{ label: string; value: string; Icon: IconType }> = [
  { label: 'Next appointment', value: 'Tue 12 May, 10:00', Icon: PiCalendarCheck },
  { label: 'Vehicle', value: 'Toyota Harrier · Pearl', Icon: PiCarProfile },
  { label: 'Service timer', value: 'Inspection logged at 10:15', Icon: PiTimer },
  { label: 'Collection', value: 'After quality check', Icon: PiSealCheck },
];

export default function CustomerPortalPage() {
  return (
    <ProtectedRoute>
      <DashboardShell
        role="Customer"
        active="customer"
        dateLabel="Monday, 11 May 2026"
        title="Good evening, Alice,"
        subtitle="Service status, approvals, appointment history, invoices, and collection updates."
        stats={[
          { value: '1', label: 'vehicle in service' },
          { value: '2hrs', label: 'next update estimate' },
          { value: '1', label: 'invoice awaiting payment' },
        ]}
        secondaryAction={
          <Button variant="default" leftSection={<PiCalendarCheck size={18} />}>
            Book service
          </Button>
        }
        primaryAction={
          <Button leftSection={<PiCreditCard size={18} />}>
            Pay invoice
          </Button>
        }
      >
        <section className="customer-board" aria-label="Customer service overview">
          <Paper className="customer-status-panel">
            <Group justify="space-between" align="flex-start">
              <Stack gap={3}>
                <Text className="eyebrow">Current service</Text>
                <Title order={2}>UAX 123A</Title>
                <Text c="dimmed">2018 Toyota Harrier · Brake vibration above 80 km/h</Text>
              </Stack>
              <Badge color="orange">Awaiting approval</Badge>
            </Group>

            <div className="service-timeline">
              {serviceTimeline.map((item) => (
                <div className={`service-step is-${item.status}`} key={item.label}>
                  <i />
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.time}</small>
                  </span>
                </div>
              ))}
            </div>

            <div className="approval-callout">
              <PiWrench size={22} />
              <span>
                <strong>Lower arm bushing approval needed</strong>
                <small>Mechanic found visible cracking. Approve the quote before purchasing parts.</small>
              </span>
              <Button size="xs">Review</Button>
            </div>
          </Paper>

          <Paper className="customer-status-panel">
            <Group gap="xs">
              <PiReceipt size={22} />
              <Title order={2}>Invoices</Title>
            </Group>
            <div className="customer-list">
              {invoices.map((invoice) => (
                <div className="customer-row" key={invoice.id}>
                  <span>
                    <strong>{invoice.id}</strong>
                    <small>{invoice.item}</small>
                  </span>
                  <b>{invoice.amount}</b>
                  <Badge color={invoice.status === 'Paid' ? 'green' : 'garageBlue'}>{invoice.status}</Badge>
                </div>
              ))}
            </div>
          </Paper>

          <Paper className="customer-status-panel customer-context">
            {contextItems.map(({ label, value, Icon }) => (
              <div className="context-row" key={label}>
                <Icon size={21} />
                <span>
                  <strong>{label}</strong>
                  <small>{value}</small>
                </span>
              </div>
            ))}
          </Paper>
        </section>
      </DashboardShell>
    </ProtectedRoute>
  );
}
