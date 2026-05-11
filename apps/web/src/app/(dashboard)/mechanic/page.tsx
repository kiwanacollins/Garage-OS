"use client";

import { Badge, Button, Group, Paper, Text, Title } from "@mantine/core";
import Link from "next/link";
import {
  PiArrowRight,
  PiCheckCircle,
  PiClockCountdown,
  PiHourglass,
  PiWrench,
} from "react-icons/pi";
import {
  CameraIcon,
  JobCardIcon,
  PartsIcon,
  TimerIcon,
  WorkOrderIcon,
} from "@/components/icons";
import { DashboardShell, type NavItem } from "@/components/DashboardShell";
import { StatCard, StatCardGrid } from "@/components/dashboard-ui";
import {
  formatHours,
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

export default function MechanicOverviewPage() {
  const { jobItems } = useMechanic();

  const activeJobs    = jobItems.filter((j) => j.status !== "completed");
  const awaitingParts = jobItems.filter((j) => j.status === "awaiting_parts");
  const totalLabour   = jobItems.reduce(
    (sum, j) => sum + j.labour.reduce((s, e) => s + e.hours, 0),
    0,
  );
  const pendingParts  = jobItems.reduce(
    (sum, j) =>
      sum +
      j.parts.filter(
        (p) => p.status === "Pending" || p.status === "Requested",
      ).length,
    0,
  );

  return (
    <DashboardShell
      role="Mechanic"
      navItems={MECHANIC_NAV}
      dateLabel="Tuesday, 12 May 2026"
      title="Good morning, Mechanic"
      subtitle="Here's your workload summary for today."
      stats={[]}
      topBarAction={null}
    >
      {/* ── Stats ─────────────────────────────────────────────────── */}
      <StatCardGrid>
        <StatCard
          icon={WorkOrderIcon}
          value={activeJobs.length}
          label="Active jobs"
          helper="Assigned to you today"
          color="#2563EB"
        />
        <StatCard
          icon={TimerIcon}
          value={formatHours(totalLabour)}
          label="Labour logged"
          helper="Across all active jobs"
          color="#7C3AED"
        />
        <StatCard
          icon={PartsIcon}
          value={pendingParts}
          label="Parts pending"
          helper="Awaiting approval or delivery"
          color={pendingParts > 0 ? "#F59E0B" : "#16A34A"}
        />
      </StatCardGrid>

      {/* ── Active jobs quick-view ──────────────────────────────────── */}
      <section className="mech-overview-section">
        <Group justify="space-between" mb={16}>
          <div>
            <Text className="section-eyebrow">Your workload</Text>
            <Title order={3} className="section-title">Active jobs</Title>
          </div>
          <Button
            component={Link}
            href="/mechanic/jobs"
            variant="light"
            rightSection={<PiArrowRight size={16} />}
          >
            All job cards
          </Button>
        </Group>

        <div className="mech-job-summary-grid">
          {activeJobs.length === 0 ? (
            <Paper className="mech-empty-state">
              <PiCheckCircle size={40} color="#16A34A" />
              <Text fw={600} mt={12}>All caught up</Text>
              <Text c="dimmed" size="sm">
                No active jobs assigned to you right now.
              </Text>
            </Paper>
          ) : (
            activeJobs.map((job) => {
              const labourTotal = job.labour.reduce(
                (s, e) => s + e.hours,
                0,
              );
              const pendingCount = job.parts.filter(
                (p) =>
                  p.status === "Pending" || p.status === "Requested",
              ).length;
              return (
                <Paper
                  key={job.id}
                  component={Link}
                  href={`/mechanic/jobs?id=${job.id}`}
                  className="mech-job-summary-card"
                >
                  <Group justify="space-between" mb={8}>
                    <Text className="mono-value" fw={700}>
                      {job.id}
                    </Text>
                    <Badge color={STATUS_COLORS[job.status]}>
                      {STATUS_LABELS[job.status]}
                    </Badge>
                  </Group>
                  <Text fw={600} size="sm">
                    {job.plate} — {job.vehicle}
                  </Text>
                  <Text c="dimmed" size="sm" lineClamp={2} mt={4}>
                    {job.concern}
                  </Text>
                  <div className="mech-job-meta">
                    <span>
                      <PiClockCountdown size={14} /> {job.promisedAt}
                    </span>
                    <span>
                      <PiWrench size={14} /> {job.bay}
                    </span>
                    <span>
                      <TimerIcon size={14} /> {formatHours(labourTotal)}
                    </span>
                    {pendingCount > 0 && (
                      <span className="mech-parts-badge">
                        <PiHourglass size={14} /> {pendingCount} part
                        {pendingCount > 1 ? "s" : ""} pending
                      </span>
                    )}
                  </div>
                </Paper>
              );
            })
          )}
        </div>
      </section>

      {/* ── Quick actions ───────────────────────────────────────────── */}
      <section className="mech-overview-section">
        <Text className="section-eyebrow" mb={4}>
          Quick actions
        </Text>
        <Title order={3} className="section-title" mb={16}>
          Go to
        </Title>
        <div className="mech-quicklinks">
          {[
            {
              href: "/mechanic/inspection",
              icon: WorkOrderIcon,
              label: "Inspection",
              desc: "Record findings, recommendations, and photos",
              color: "#2563EB",
            },
            {
              href: "/mechanic/labour",
              icon: TimerIcon,
              label: "Labour log",
              desc: "Start the timer or add manual labour entries",
              color: "#7C3AED",
            },
            {
              href: "/mechanic/parts",
              icon: PartsIcon,
              label: "Parts requests",
              desc: "Request parts and track delivery status",
              color: awaitingParts.length > 0 ? "#F59E0B" : "#0EA5E9",
              badge:
                awaitingParts.length > 0
                  ? `${awaitingParts.length} waiting`
                  : undefined,
            },
            {
              href: "/mechanic/complete",
              icon: CameraIcon,
              label: "Job completion",
              desc: "Add final notes and submit for quality check",
              color: "#16A34A",
            },
          ].map(({ href, icon: Icon, label, desc, color, badge }) => (
            <Paper
              key={href}
              component={Link}
              href={href}
              className="mech-quicklink-card"
            >
              <span
                className="stat-icon-wrap"
                style={{ background: `${color}18`, color }}
              >
                <Icon size={22} />
              </span>
              <div className="mech-quicklink-body">
                <Group gap={8} mb={2}>
                  <Text fw={600} size="sm">
                    {label}
                  </Text>
                  {badge && (
                    <Badge size="xs" color="orange">
                      {badge}
                    </Badge>
                  )}
                </Group>
                <Text c="dimmed" size="xs">
                  {desc}
                </Text>
              </div>
              <PiArrowRight
                size={18}
                color="#94A3B8"
                className="mech-quicklink-arrow"
              />
            </Paper>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
