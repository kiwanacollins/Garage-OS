"use client";

import {
  Badge,
  Button,
  Group,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
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
  NEXT_STATUS,
  STATUS_COLORS,
  STATUS_LABELS,
  URGENCY_OPTIONS,
  useMechanic,
  type PartRequest,
} from "@/lib/mechanic-store";

const MECHANIC_NAV: NavItem[] = [
  { key: "overview",   label: "Overview",       href: "/mechanic",            icon: WorkOrderIcon },
  { key: "jobs",       label: "Job cards",      href: "/mechanic/jobs",       icon: JobCardIcon   },
  { key: "inspection", label: "Inspection",     href: "/mechanic/inspection", icon: WorkOrderIcon },
  { key: "labour",     label: "Labour log",     href: "/mechanic/labour",     icon: TimerIcon     },
  { key: "parts",      label: "Parts requests", href: "/mechanic/parts",      icon: PartsIcon     },
  { key: "complete",   label: "Job completion", href: "/mechanic/complete",   icon: CameraIcon    },
];

const partStatusColor: Record<string, string> = {
  Approved: "green",
  Pending: "orange",
  Requested: "blue",
  "In stock": "teal",
};

export default function PartsPage() {
  const {
    jobItems,
    selectedJobId,
    setSelectedJobId,
    selectedJob,
    advanceSelectedJob,
    requestPart,
  } = useMechanic();

  const [partName, setPartName] = useState("");
  const [partQty, setPartQty] = useState<number | string>(1);
  const [partUrgency, setPartUrgency] =
    useState<PartRequest["urgency"]>("routine");
  const [partNote, setPartNote] = useState("");

  const selectedAction = NEXT_STATUS[selectedJob.status];
  const pendingParts = selectedJob.parts.filter(
    (p) => p.status === "Pending" || p.status === "Requested",
  );
  const activeJobs = jobItems.filter((j) => j.status !== "completed");

  function handleRequest() {
    const qty = Number(partQty);
    if (!partName.trim() || Number.isNaN(qty) || qty < 1) return;
    requestPart({ item: partName.trim(), quantity: qty, urgency: partUrgency, note: partNote.trim() });
    setPartName("");
    setPartQty(1);
    setPartUrgency("routine");
    setPartNote("");
  }

  return (
    <DashboardShell
      role="Mechanic"
      navItems={MECHANIC_NAV}
      dateLabel="Tuesday, 12 May 2026"
      title="Parts requests"
      subtitle="Request parts for the selected job and track approval or delivery status."
      stats={[]}
      topBarAction={null}
    >
      <div className="job-layout" aria-label="Parts requests workspace">
        {/* ── Job selector ──────────────────────────────────────── */}
        <Paper className="job-list">
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={12} style={{ letterSpacing: "0.06em" }}>
            Active jobs
          </Text>
          {activeJobs.map((job) => {
            const jobPending = job.parts.filter(
              (p) => p.status === "Pending" || p.status === "Requested",
            ).length;
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
                  {job.customer}
                  {jobPending > 0 ? (
                    <small style={{ color: "#F59E0B" }}>
                      {jobPending} part{jobPending > 1 ? "s" : ""} pending
                    </small>
                  ) : (
                    <small>No pending parts</small>
                  )}
                </span>
              </UnstyledButton>
            );
          })}
        </Paper>

        {/* ── Parts detail ──────────────────────────────────────── */}
        <Paper component="aside" className="job-detail" aria-label="Parts detail">
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

          <div className="stack-list">
            {/* ── Parts list ────────────────────────────────────── */}
            <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={8} style={{ letterSpacing: "0.06em" }}>
              Parts ({selectedJob.parts.length})
              {pendingParts.length > 0 && (
                <Badge size="xs" color="orange" ml={8}>
                  {pendingParts.length} pending
                </Badge>
              )}
            </Text>

            {selectedJob.parts.length ? (
              selectedJob.parts.map((part) => (
                <div
                  key={`${part.item}-${part.status}`}
                  className="stack-row split-row"
                >
                  <span>
                    {part.item} × {part.quantity}
                    <small>
                      {part.note ||
                        URGENCY_OPTIONS.find((u) => u.value === part.urgency)?.label}
                    </small>
                  </span>
                  <Badge
                    color={partStatusColor[part.status] ?? "gray"}
                    variant="light"
                  >
                    {part.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="empty-state">No parts requested yet.</div>
            )}

            {/* ── Request form ──────────────────────────────────── */}
            <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4} mt={8} style={{ letterSpacing: "0.06em" }}>
              Request a new part
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput
                label="Part name"
                placeholder="Fan relay"
                value={partName}
                onChange={(e) => setPartName(e.currentTarget.value)}
              />
              <NumberInput
                label="Quantity"
                min={1}
                value={partQty}
                onChange={setPartQty}
              />
            </SimpleGrid>
            <Select
              label="Urgency"
              value={partUrgency}
              onChange={(v) =>
                setPartUrgency((v ?? "routine") as PartRequest["urgency"])
              }
              data={URGENCY_OPTIONS}
            />
            <Textarea
              label="Urgency note"
              placeholder="Why this part is needed"
              minRows={2}
              value={partNote}
              onChange={(e) => setPartNote(e.currentTarget.value)}
            />
            <Button
              type="button"
              leftSection={<PartsIcon size={18} />}
              onClick={handleRequest}
              disabled={!partName.trim()}
            >
              Request part
            </Button>
          </div>
        </Paper>
      </div>
    </DashboardShell>
  );
}
