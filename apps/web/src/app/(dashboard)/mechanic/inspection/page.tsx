"use client";

import {
  Badge,
  Button,
  FileButton,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Title,
  UnstyledButton,
} from "@mantine/core";
import {
  CameraIcon,
  JobCardIcon,
  PartsIcon,
  TimerIcon,
  WorkOrderIcon,
} from "@/components/icons";
import { DashboardShell, type NavItem } from "@/components/DashboardShell";
import {
  NEXT_STATUS,
  STATUS_COLORS,
  STATUS_LABELS,
  useMechanic,
} from "@/lib/mechanic-store";
import { useState } from "react";

const MECHANIC_NAV: NavItem[] = [
  { key: "overview",   label: "Overview",       href: "/mechanic",            icon: WorkOrderIcon },
  { key: "jobs",       label: "Job cards",      href: "/mechanic/jobs",       icon: JobCardIcon   },
  { key: "inspection", label: "Inspection",     href: "/mechanic/inspection", icon: WorkOrderIcon },
  { key: "labour",     label: "Labour log",     href: "/mechanic/labour",     icon: TimerIcon     },
  { key: "parts",      label: "Parts requests", href: "/mechanic/parts",      icon: PartsIcon     },
  { key: "complete",   label: "Job completion", href: "/mechanic/complete",   icon: CameraIcon    },
];

export default function InspectionPage() {
  const {
    jobItems,
    selectedJobId,
    setSelectedJobId,
    selectedJob,
    advanceSelectedJob,
    recordInspection,
    addPhotos,
  } = useMechanic();

  const [finding, setFinding] = useState("");
  const [recommendation, setRecommendation] = useState("");

  const selectedAction = NEXT_STATUS[selectedJob.status];
  const activeJobs = jobItems.filter((j) => j.status !== "completed");

  function handleRecord() {
    recordInspection(finding, recommendation);
    setFinding("");
    setRecommendation("");
  }

  return (
    <DashboardShell
      role="Mechanic"
      navItems={MECHANIC_NAV}
      dateLabel="Tuesday, 12 May 2026"
      title="Inspection"
      subtitle="Record findings, recommendations, and attach inspection photos for each job."
      stats={[]}
      topBarAction={null}
    >
      <div className="job-layout" aria-label="Inspection workspace">
        {/* ── Job selector sidebar ───────────────────────────────── */}
        <Paper className="job-list">
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={12} style={{ letterSpacing: "0.06em" }}>
            Active jobs
          </Text>
          {activeJobs.length === 0 ? (
            <div className="empty-state">No active jobs.</div>
          ) : (
            activeJobs.map((job) => (
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
                  <small>{job.bay}</small>
                </span>
              </UnstyledButton>
            ))
          )}
        </Paper>

        {/* ── Inspection detail ─────────────────────────────────── */}
        <Paper component="aside" className="job-detail" aria-label="Inspection detail">
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

          <Text className="job-note">{selectedJob.concern}</Text>

          <div className="stack-list">
            {/* ── Existing findings ─────────────────────────────── */}
            {selectedJob.findings.length > 0 && (
              <div>
                <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={8} style={{ letterSpacing: "0.06em" }}>
                  Findings ({selectedJob.findings.length})
                </Text>
                {selectedJob.findings.map((item) => (
                  <div className="stack-row" key={item}>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Existing recommendations ──────────────────────── */}
            {selectedJob.recommendations.length > 0 && (
              <div>
                <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={8} style={{ letterSpacing: "0.06em" }}>
                  Recommendations ({selectedJob.recommendations.length})
                </Text>
                {selectedJob.recommendations.map((item) => (
                  <div className="stack-row muted-row" key={item}>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Photos ────────────────────────────────────────── */}
            {selectedJob.photos.length > 0 && (
              <SimpleGrid
                cols={{ base: 2, sm: 3 }}
                spacing="xs"
                aria-label="Inspection photo previews"
              >
                {selectedJob.photos.map((photo) => (
                  <img
                    key={photo}
                    className="inspection-photo"
                    src={photo}
                    alt="Inspection preview"
                  />
                ))}
              </SimpleGrid>
            )}

            {/* ── Add finding / recommendation form ─────────────── */}
            <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4} mt={8} style={{ letterSpacing: "0.06em" }}>
              Add new entry
            </Text>
            <Textarea
              label="Finding"
              placeholder="Record measured fault, damage, or diagnostic result"
              minRows={3}
              value={finding}
              onChange={(e) => setFinding(e.currentTarget.value)}
            />
            <Textarea
              label="Recommendation"
              placeholder="Recommended repair, customer approval note, or watch item"
              minRows={2}
              value={recommendation}
              onChange={(e) => setRecommendation(e.currentTarget.value)}
            />
            <Group align="center" justify="space-between">
              <FileButton onChange={addPhotos} accept="image/png,image/jpeg" multiple>
                {(props) => (
                  <Button
                    type="button"
                    variant="light"
                    leftSection={<CameraIcon size={18} />}
                    {...props}
                  >
                    Add photos
                  </Button>
                )}
              </FileButton>
              <Button
                type="button"
                leftSection={<JobCardIcon size={18} />}
                onClick={handleRecord}
                disabled={!finding.trim() && !recommendation.trim()}
              >
                Record finding
              </Button>
            </Group>
          </div>
        </Paper>
      </div>
    </DashboardShell>
  );
}
