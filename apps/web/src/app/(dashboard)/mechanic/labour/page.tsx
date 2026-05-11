"use client";

import {
  Badge,
  Button,
  Divider,
  Group,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useState } from "react";
import {
  CameraIcon,
  JobCardIcon,
  PartsIcon,
  TimerIcon,
  WorkOrderIcon,
} from "@/components/icons";
import { DashboardShell, type NavItem } from "@/components/DashboardShell";
import {
  formatHours,
  NEXT_STATUS,
  STATUS_COLORS,
  STATUS_LABELS,
  useMechanic,
} from "@/lib/mechanic-store";

const MECHANIC_NAV: NavItem[] = [
  { key: "overview",   label: "Overview",       href: "/mechanic",            icon: WorkOrderIcon },
  { key: "jobs",       label: "Job cards",      href: "/mechanic/jobs",       icon: JobCardIcon   },
  { key: "inspection", label: "Inspection",     href: "/mechanic/inspection", icon: WorkOrderIcon },
  { key: "labour",     label: "Labour log",     href: "/mechanic/labour",     icon: TimerIcon     },
  { key: "parts",      label: "Parts requests", href: "/mechanic/parts",      icon: PartsIcon     },
  { key: "complete",   label: "Job completion", href: "/mechanic/complete",   icon: CameraIcon    },
];

export default function LabourPage() {
  const {
    jobItems,
    selectedJobId,
    setSelectedJobId,
    selectedJob,
    advanceSelectedJob,
    addLabourEntry,
    timerStartedAt,
    toggleTimer,
  } = useMechanic();

  const [runningTask, setRunningTask] = useState("Diagnosis and repair");
  const [manualTask, setManualTask] = useState("");
  const [manualHours, setManualHours] = useState<number | string>(0.5);

  const labourTotal = selectedJob.labour.reduce((s, e) => s + e.hours, 0);
  const selectedAction = NEXT_STATUS[selectedJob.status];
  const activeJobs = jobItems.filter((j) => j.status !== "completed");

  function handleManualAdd() {
    const hours = Number(manualHours);
    if (!manualTask.trim() || Number.isNaN(hours) || hours <= 0) return;
    addLabourEntry({ task: manualTask.trim(), hours });
    setManualTask("");
    setManualHours(0.5);
  }

  return (
    <DashboardShell
      role="Mechanic"
      navItems={MECHANIC_NAV}
      dateLabel="Tuesday, 12 May 2026"
      title="Labour log"
      subtitle="Start a labour timer or manually log hours for the selected job."
      stats={[]}
      topBarAction={null}
    >
      <div className="job-layout" aria-label="Labour log workspace">
        {/* ── Job selector ──────────────────────────────────────── */}
        <Paper className="job-list">
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={12} style={{ letterSpacing: "0.06em" }}>
            Active jobs
          </Text>
          {activeJobs.map((job) => {
            const jLabour = job.labour.reduce((s, e) => s + e.hours, 0);
            return (
              <UnstyledButton
                key={job.id}
                className={`job-card ${job.id === selectedJob.id ? "is-selected" : ""}`}
                onClick={() => setSelectedJobId(job.id)}
              >
                <Badge color={STATUS_COLORS[job.status]}>
                  {STATUS_LABELS[job.status]}
                </Badge>
                <span>
                  <strong className="mono-value">{job.plate}</strong>
                  <small>{job.vehicle}</small>
                </span>
                <span>
                  Labour: {formatHours(jLabour)}
                  <small>{job.bay}</small>
                </span>
              </UnstyledButton>
            );
          })}
        </Paper>

        {/* ── Labour detail ─────────────────────────────────────── */}
        <Paper component="aside" className="job-detail" aria-label="Labour detail">
          <Group className="detail-heading" align="flex-start" justify="space-between">
            <Stack gap={2}>
              <Text className="eyebrow">{selectedJob.id}</Text>
              <Title order={2}>{selectedJob.plate}</Title>
              <Text c="dimmed">{selectedJob.vehicle} · {selectedJob.customer}</Text>
            </Stack>
            <Stack className="detail-actions" gap="xs" align="flex-end">
              <Badge color={STATUS_COLORS[selectedJob.status]}>
                {STATUS_LABELS[selectedJob.status]}
              </Badge>
              {selectedAction && (
                <Button
                  size="xs"
                  type="button"
                  leftSection={<WorkOrderIcon size={16} />}
                  onClick={advanceSelectedJob}
                >
                  {selectedAction.label}
                </Button>
              )}
            </Stack>
          </Group>

          <dl className="detail-list compact-detail">
            <div><dt>Total labour</dt><dd className="mono-value">{formatHours(labourTotal)}</dd></div>
            <div><dt>Entries</dt><dd>{selectedJob.labour.length}</dd></div>
          </dl>

          <div className="stack-list">
            {/* ── Logged entries ────────────────────────────────── */}
            <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={8} style={{ letterSpacing: "0.06em" }}>
              Labour entries
            </Text>
            {selectedJob.labour.length ? (
              selectedJob.labour.map((entry) => (
                <div
                  key={`${entry.task}-${entry.startedAt ?? entry.hours}`}
                  className="stack-row split-row"
                >
                  <span>
                    {entry.task}
                    {entry.startedAt && (
                      <small>{entry.startedAt} – {entry.endedAt}</small>
                    )}
                  </span>
                  <strong>{formatHours(entry.hours)}</strong>
                </div>
              ))
            ) : (
              <div className="empty-state">No labour logged yet.</div>
            )}

            {/* ── Timer ─────────────────────────────────────────── */}
            <Divider label="Labour timer" labelPosition="center" />
            <TextInput
              label="Timer task"
              value={runningTask}
              onChange={(e) => setRunningTask(e.currentTarget.value)}
            />
            <Button
              type="button"
              leftSection={<TimerIcon size={18} />}
              color={timerStartedAt ? "orange" : undefined}
              onClick={() => toggleTimer(runningTask)}
            >
              {timerStartedAt
                ? `Stop timer (started ${timerStartedAt})`
                : "Start labour timer"}
            </Button>

            {/* ── Manual entry ──────────────────────────────────── */}
            <Divider label="Manual entry" labelPosition="center" />
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput
                label="Labour task"
                placeholder="Replace front pads"
                value={manualTask}
                onChange={(e) => setManualTask(e.currentTarget.value)}
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
            <Button
              type="button"
              variant="light"
              leftSection={<WorkOrderIcon size={18} />}
              onClick={handleManualAdd}
              disabled={!manualTask.trim()}
            >
              Add labour entry
            </Button>
          </div>
        </Paper>
      </div>
    </DashboardShell>
  );
}
