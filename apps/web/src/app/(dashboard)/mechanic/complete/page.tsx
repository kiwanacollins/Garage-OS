"use client";

import {
  Badge,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useState } from "react";
import { PiCheckCircle } from "react-icons/pi";
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

export default function JobCompletePage() {
  const {
    jobItems,
    selectedJobId,
    setSelectedJobId,
    selectedJob,
    submitCompletion,
  } = useMechanic();

  const [finalNotes, setFinalNotes] = useState("");

  const labourTotal = selectedJob.labour.reduce((s, e) => s + e.hours, 0);
  const completableJobs = jobItems.filter((j) => j.status !== "completed");
  const completedJobs = jobItems.filter((j) => j.status === "completed");

  const alreadyDone = selectedJob.status === "completed";

  function handleSubmit() {
    submitCompletion(finalNotes);
    setFinalNotes("");
  }

  return (
    <DashboardShell
      role="Mechanic"
      navItems={MECHANIC_NAV}
      dateLabel="Tuesday, 12 May 2026"
      title="Job completion"
      subtitle="Review the job summary, add final handover notes, and submit for quality check."
      stats={[]}
      topBarAction={null}
    >
      <div className="job-layout" aria-label="Job completion workspace">
        {/* ── Job selector ──────────────────────────────────────── */}
        <Paper className="job-list">
          {completableJobs.length > 0 && (
            <>
              <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={12} style={{ letterSpacing: "0.06em" }}>
                Ready to complete
              </Text>
              {completableJobs.map((job) => (
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
                    <small>{job.bay} · {job.promisedAt}</small>
                  </span>
                </UnstyledButton>
              ))}
            </>
          )}

          {completedJobs.length > 0 && (
            <>
              <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={12} mt={16} style={{ letterSpacing: "0.06em" }}>
                Completed today
              </Text>
              {completedJobs.map((job) => (
                <UnstyledButton
                  key={job.id}
                  className={`job-card ${job.id === selectedJob.id ? "is-selected" : ""}`}
                  onClick={() => setSelectedJobId(job.id)}
                >
                  <Badge color="green">Completed</Badge>
                  <span>
                    <strong className="mono-value">{job.plate}</strong>
                    <small>{job.vehicle}</small>
                  </span>
                  <span>
                    {job.customer}
                    <small>{job.finalNotes}</small>
                  </span>
                </UnstyledButton>
              ))}
            </>
          )}

          {jobItems.length === 0 && (
            <div className="empty-state">No jobs assigned.</div>
          )}
        </Paper>

        {/* ── Completion detail ─────────────────────────────────── */}
        <Paper component="aside" className="job-detail" aria-label="Completion detail">
          <Group className="detail-heading" align="flex-start" justify="space-between">
            <Stack gap={2}>
              <Text className="eyebrow">{selectedJob.id}</Text>
              <Title order={2}>{selectedJob.plate}</Title>
              <Text c="dimmed">{selectedJob.vehicle} · {selectedJob.customer}</Text>
            </Stack>
            <Badge color={STATUS_COLORS[selectedJob.status]}>
              {STATUS_LABELS[selectedJob.status]}
            </Badge>
          </Group>

          {/* ── Summary metrics ───────────────────────────────── */}
          <SimpleGrid cols={3} spacing="xs" mb={16}>
            <Paper className="mini-metric">
              <Text size="xs" c="dimmed" fw={600}>Findings</Text>
              <Text fw={800}>{selectedJob.findings.filter(f => f !== "Pending initial inspection").length}</Text>
            </Paper>
            <Paper className="mini-metric">
              <Text size="xs" c="dimmed" fw={600}>Labour</Text>
              <Text fw={800}>{formatHours(labourTotal)}</Text>
            </Paper>
            <Paper className="mini-metric">
              <Text size="xs" c="dimmed" fw={600}>Parts</Text>
              <Text fw={800}>{selectedJob.parts.length}</Text>
            </Paper>
          </SimpleGrid>

          {alreadyDone ? (
            /* ── Already completed ──────────────────────────────── */
            <div className="stack-list">
              <Paper
                p={20}
                style={{
                  background: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <PiCheckCircle size={28} color="#16A34A" style={{ flexShrink: 0 }} />
                <div>
                  <Text fw={600} size="sm" c="#15803D">
                    Submitted for quality check
                  </Text>
                  <Text size="xs" c="dimmed" mt={2}>
                    {selectedJob.finalNotes || "No final notes added."}
                  </Text>
                </div>
              </Paper>
            </div>
          ) : (
            /* ── Completion form ─────────────────────────────────── */
            <div className="stack-list">
              {selectedJob.finalNotes && (
                <div className="stack-row">
                  <span>{selectedJob.finalNotes}</span>
                </div>
              )}
              <Textarea
                label="Final notes"
                placeholder="Work completed, road test result, handover notes"
                minRows={4}
                value={finalNotes}
                onChange={(e) => setFinalNotes(e.currentTarget.value)}
              />
              <Button
                type="button"
                leftSection={<WorkOrderIcon size={18} />}
                onClick={handleSubmit}
              >
                Submit for quality check
              </Button>
            </div>
          )}
        </Paper>
      </div>
    </DashboardShell>
  );
}
