"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import {
  Badge,
  Button,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { PiWifiHigh, PiWifiSlash } from "react-icons/pi";
import { useState } from "react";
import { PiArrowRight } from "react-icons/pi";
import Link from "next/link";
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
  type JobStatus,
} from "@/lib/mechanic-store";

const MECHANIC_NAV: NavItem[] = [
  { key: "overview",   label: "Overview",       href: "/mechanic",            icon: WorkOrderIcon },
  { key: "jobs",       label: "Job cards",      href: "/mechanic/jobs",       icon: JobCardIcon   },
  { key: "inspection", label: "Inspection",     href: "/mechanic/inspection", icon: WorkOrderIcon },
  { key: "labour",     label: "Labour log",     href: "/mechanic/labour",     icon: TimerIcon     },
  { key: "parts",      label: "Parts requests", href: "/mechanic/parts",      icon: PartsIcon     },
  { key: "complete",   label: "Job completion", href: "/mechanic/complete",   icon: CameraIcon    },
];

export default function JobCardsPage() {
  const {
    jobItems, selectedJobId, setSelectedJobId, advanceSelectedJob, selectedJob,
    isOffline, offlineReady, queuedChanges, syncStatus,
  } = useMechanic();

  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");

  // Pre-select job from URL query param (?id=WO-1048)
  useEffect(() => {
    const id = searchParams.get("id");
    if (id && jobItems.some((j) => j.id === id)) {
      setSelectedJobId(id);
    }
  }, [searchParams, jobItems, setSelectedJobId]);

  const filteredJobs =
    statusFilter === "all"
      ? jobItems
      : jobItems.filter((j) => j.status === statusFilter);

  const labourTotal = selectedJob.labour.reduce((s, e) => s + e.hours, 0);
  const selectedAction = NEXT_STATUS[selectedJob.status];

  return (
    <DashboardShell
      role="Mechanic"
      navItems={MECHANIC_NAV}
      dateLabel="Tuesday, 12 May 2026"
      title="Job cards"
      subtitle="Select a job to view details, then navigate to Inspection, Labour, Parts, or Completion."
      stats={[]}
      topBarAction={null}
      secondaryAction={
        <SegmentedControl
          aria-label="Filter jobs by status"
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as JobStatus | "all")}
          data={[
            { value: "all", label: "All" },
            { value: "assigned", label: "Assigned" },
            { value: "in_progress", label: "In progress" },
            { value: "awaiting_parts", label: "Awaiting parts" },
            { value: "completed", label: "Completed" },
          ]}
        />
      }
    >
      {/* ── Offline sync strip ────────────────────────────────── */}
      <Paper className="sync-strip" aria-label="Offline sync status" mb={16}>
        <Group justify="space-between" gap="md">
          <Group gap="sm">
            <Badge color={isOffline ? "orange" : "green"}>
              {isOffline ? <PiWifiSlash size={13} /> : <PiWifiHigh size={13} />}
              {isOffline ? " Offline" : " Online"}
            </Badge>
            <Text fw={600} size="sm">
              {offlineReady ? "Offline ready" : "Preparing offline cache"}
            </Text>
            <Text c="dimmed" size="sm">
              Job card data, inspection draft, labour timer, and parts requests persist locally.
            </Text>
          </Group>
          <Badge color={queuedChanges.length ? "orange" : "garageBlue"}>
            {queuedChanges.length} queued
          </Badge>
        </Group>
        <Text aria-live="polite" size="xs" c={isOffline ? "orange" : "dimmed"} mt={4}>
          {syncStatus}
        </Text>
      </Paper>

      <section className="job-layout" aria-label="Mechanic job cards">
        {/* ── Job list ──────────────────────────────────────────── */}
        <Paper className="job-list">
          {filteredJobs.length === 0 ? (
            <div className="empty-state">No jobs match this filter.</div>
          ) : (
            filteredJobs.map((job) => (
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
                  {job.customer}
                  <small>{job.concern}</small>
                </span>
                <span>
                  {job.bay}
                  <small>{job.promisedAt}</small>
                </span>
              </UnstyledButton>
            ))
          )}
        </Paper>

        {/* ── Job detail ────────────────────────────────────────── */}
        <Paper component="aside" className="job-detail" aria-label="Selected job">
          <Group className="detail-heading" align="flex-start" justify="space-between">
            <Stack gap={2}>
              <Text className="eyebrow">{selectedJob.id}</Text>
              <Title order={2}>{selectedJob.plate}</Title>
              <Text c="dimmed">{selectedJob.vehicle}</Text>
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
            <div><dt>Customer</dt><dd>{selectedJob.customer}</dd></div>
            <div><dt>Odometer</dt><dd>{selectedJob.odometer.toLocaleString()} km</dd></div>
            <div><dt>Labour</dt><dd>{formatHours(labourTotal)}</dd></div>
            <div><dt>Bay</dt><dd>{selectedJob.bay}</dd></div>
            <div><dt>Promised</dt><dd>{selectedJob.promisedAt}</dd></div>
          </dl>

          <Text className="job-note">{selectedJob.concern}</Text>

          {/* ── Navigate to sub-sections ──────────────────────── */}
          <div className="job-detail-actions">
            <Text size="sm" c="dimmed" fw={500} mb={12}>
              Continue working on this job:
            </Text>
            <div className="mech-quicklinks mech-quicklinks--compact">
              {[
                { href: "/mechanic/inspection", icon: WorkOrderIcon, label: "Inspection",    color: "#2563EB", count: selectedJob.findings.filter(f => f !== "Pending initial inspection").length },
                { href: "/mechanic/labour",     icon: TimerIcon,     label: "Labour log",    color: "#7C3AED", count: selectedJob.labour.length },
                { href: "/mechanic/parts",      icon: PartsIcon,     label: "Parts",         color: "#F59E0B", count: selectedJob.parts.length },
                { href: "/mechanic/complete",   icon: CameraIcon,    label: "Job completion",color: "#16A34A", count: undefined },
              ].map(({ href, icon: Icon, label, color, count }) => (
                <Paper
                  key={href}
                  component={Link}
                  href={href}
                  className="mech-quicklink-card mech-quicklink-card--sm"
                >
                  <span
                    className="stat-icon-wrap stat-icon-wrap--sm"
                    style={{ color }}
                  >
                    <Icon size={18} />
                  </span>
                  <Text fw={600} size="sm" style={{ flex: 1 }}>
                    {label}
                    {count != null && count > 0 && (
                      <Badge size="xs" ml={6} color="gray">{count}</Badge>
                    )}
                  </Text>
                  <PiArrowRight size={16} color="#94A3B8" />
                </Paper>
              ))}
            </div>
          </div>
        </Paper>
      </section>
    </DashboardShell>
  );
}
