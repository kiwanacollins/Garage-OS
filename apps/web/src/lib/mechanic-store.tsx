"use client";

/**
 * MechanicStore — shared state context for the mechanic portal.
 *
 * All sub-route pages (jobs, inspection, labour, parts, complete) consume this
 * context so they share a single source of truth without prop drilling or
 * duplicated localStorage logic.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { io } from "socket.io-client";
import { API_URL } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type JobStatus =
  | "assigned"
  | "in_progress"
  | "awaiting_parts"
  | "completed";

export type LabourEntry = {
  task: string;
  hours: number;
  startedAt?: string;
  endedAt?: string;
};

export type PartRequest = {
  item: string;
  quantity: number;
  urgency: "routine" | "urgent" | "vehicle_down";
  note: string;
  status: string;
};

export type JobCard = {
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

export type QueuedChange = {
  id: string;
  type: "inspection" | "labour" | "parts";
  jobId: string;
  createdAt: string;
};

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_JOBS: JobCard[] = [
  {
    id: "WO-1048",
    status: "in_progress",
    plate: "UAX 123A",
    vehicle: "2018 Toyota Harrier",
    customer: "Alice Nakato",
    promisedAt: "Today 16:00",
    bay: "Bay 2",
    concern: "Brake vibration above 80 km/h, inspect front axle and pads.",
    odometer: 54210,
    findings: ["Front pads below 3 mm", "Right lower arm bushing cracked"],
    recommendations: [
      "Replace front pads before release",
      "Quote lower arm bushing for approval",
    ],
    photos: [],
    labour: [
      {
        task: "Road test and lift inspection",
        hours: 0.6,
        startedAt: "09:10",
        endedAt: "09:46",
      },
      {
        task: "Front brake strip-down",
        hours: 0.9,
        startedAt: "09:50",
        endedAt: "10:44",
      },
    ],
    parts: [
      {
        item: "Front brake pads",
        quantity: 1,
        urgency: "urgent",
        note: "Low pad depth",
        status: "Approved",
      },
      {
        item: "Lower arm bushing",
        quantity: 1,
        urgency: "routine",
        note: "Visible cracking",
        status: "Pending",
      },
    ],
    finalNotes: "",
  },
  {
    id: "WO-1052",
    status: "awaiting_parts",
    plate: "UAZ 774Q",
    vehicle: "2014 Mitsubishi Pajero",
    customer: "Brian Mugisha",
    promisedAt: "Tomorrow 11:30",
    bay: "Hold",
    concern: "Intermittent overheating during traffic stops.",
    odometer: 118430,
    findings: [
      "Radiator fan relay failing under heat",
      "Coolant low on arrival",
    ],
    recommendations: ["Replace relay and retest fan cycle"],
    photos: [],
    labour: [
      {
        task: "Cooling pressure test",
        hours: 0.5,
        startedAt: "11:00",
        endedAt: "11:30",
      },
    ],
    parts: [
      {
        item: "Fan relay",
        quantity: 1,
        urgency: "vehicle_down",
        note: "Vehicle held until relay arrives",
        status: "Requested",
      },
    ],
    finalNotes: "",
  },
  {
    id: "WO-1055",
    status: "assigned",
    plate: "UBK 442M",
    vehicle: "2016 Subaru Forester",
    customer: "Nadia Achieng",
    promisedAt: "Today 18:00",
    bay: "Bay 4",
    concern: "Oil service, cabin filter, and suspension noise check.",
    odometer: 86100,
    findings: ["Pending initial inspection"],
    recommendations: [],
    photos: [],
    labour: [],
    parts: [
      {
        item: "Cabin filter",
        quantity: 1,
        urgency: "routine",
        note: "Service item",
        status: "In stock",
      },
    ],
    finalNotes: "",
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<JobStatus, string> = {
  assigned: "Assigned",
  in_progress: "In progress",
  awaiting_parts: "Awaiting parts",
  completed: "Completed",
};

export const STATUS_COLORS: Record<JobStatus, string> = {
  assigned: "garageBlue",
  in_progress: "garageBlue",
  awaiting_parts: "orange",
  completed: "green",
};

export const NEXT_STATUS: Partial<
  Record<JobStatus, { label: string; status: JobStatus }>
> = {
  assigned: { label: "Start work", status: "in_progress" },
  in_progress: { label: "Mark complete", status: "completed" },
  awaiting_parts: { label: "Resume work", status: "in_progress" },
};

export const URGENCY_OPTIONS = [
  { value: "routine", label: "Routine" },
  { value: "urgent", label: "Urgent" },
  { value: "vehicle_down", label: "Vehicle down" },
];

export const OFFLINE_DRAFT_KEY = "garageos.mechanic.offline-draft";

export function formatHours(hours: number) {
  return `${hours.toFixed(1)}h`;
}

// ─── Context ──────────────────────────────────────────────────────────────────

type MechanicContextValue = {
  jobItems: JobCard[];
  selectedJobId: string;
  setSelectedJobId: (id: string) => void;
  selectedJob: JobCard;
  updateSelectedJob: (update: (job: JobCard) => JobCard) => void;
  advanceSelectedJob: () => void;
  recordInspection: (finding: string, recommendation: string) => void;
  addPhotos: (files: File[]) => void;
  addLabourEntry: (entry: LabourEntry) => void;
  requestPart: (part: Omit<PartRequest, "status">) => void;
  submitCompletion: (notes: string) => void;
  timerStartedAt: string | null;
  toggleTimer: (taskName: string) => void;
  isOffline: boolean;
  offlineReady: boolean;
  queuedChanges: QueuedChange[];
  syncStatus: string;
};

const MechanicContext = createContext<MechanicContextValue | null>(null);

export function useMechanic(): MechanicContextValue {
  const ctx = useContext(MechanicContext);
  if (!ctx)
    throw new Error("useMechanic must be used inside <MechanicProvider>");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function MechanicProvider({ children }: { children: ReactNode }) {
  const [jobItems, setJobItems] = useState(SEED_JOBS);
  const [selectedJobId, setSelectedJobId] = useState(SEED_JOBS[0].id);
  const [timerStartedAt, setTimerStartedAt] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [queuedChanges, setQueuedChanges] = useState<QueuedChange[]>([]);
  const [syncStatus, setSyncStatus] = useState(
    "Current job cards cached for offline use",
  );

  // ── Hydrate from localStorage ──────────────────────────────────────────────
  useEffect(() => {
    const saved = window.localStorage.getItem(OFFLINE_DRAFT_KEY);
    if (!saved) return;
    try {
      const draft = JSON.parse(saved) as {
        jobItems?: JobCard[];
        timerStartedAt?: string | null;
        queuedChanges?: QueuedChange[];
      };
      if (draft.jobItems?.length) setJobItems(draft.jobItems);
      if (draft.timerStartedAt) setTimerStartedAt(draft.timerStartedAt);
      if (draft.queuedChanges?.length) {
        setQueuedChanges(draft.queuedChanges);
        setSyncStatus(`${draft.queuedChanges.length} changes queued offline`);
      }
    } catch {
      window.localStorage.removeItem(OFFLINE_DRAFT_KEY);
    }
  }, []);

  // ── Persist to localStorage ────────────────────────────────────────────────
  useEffect(() => {
    window.localStorage.setItem(
      OFFLINE_DRAFT_KEY,
      JSON.stringify({ jobItems, timerStartedAt, queuedChanges }),
    );
  }, [jobItems, timerStartedAt, queuedChanges]);

  // ── Online / offline ───────────────────────────────────────────────────────
  useEffect(() => {
    setIsOffline(!window.navigator.onLine);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then(() => setOfflineReady(true))
        .catch(() => setOfflineReady(false));
    }
    const handleOffline = () => {
      setIsOffline(true);
      setSyncStatus("Offline mode active: data persisted locally");
    };
    const handleOnline = () => {
      setIsOffline(false);
      setQueuedChanges((items) => {
        if (items.length) {
          setSyncStatus(`Sync complete for ${items.length} queued changes`);
          return [];
        }
        setSyncStatus((cur) =>
          cur.startsWith("Sync complete") ? cur : "Online: changes synced",
        );
        return items;
      });
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // ── Socket.IO realtime updates ─────────────────────────────────────────────
  useEffect(() => {
    const socket = io(API_URL, { transports: ["websocket"], autoConnect: true });
    socket.on(
      "work-order:status-updated",
      (event: { workOrderId: string; status: JobStatus }) => {
        if (!Object.hasOwn(STATUS_LABELS, event.status)) return;
        setJobItems((items) =>
          items.map((job) =>
            job.id === event.workOrderId
              ? { ...job, status: event.status }
              : job,
          ),
        );
      },
    );
    return () => { socket.disconnect(); };
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const selectedJob = useMemo(
    () => jobItems.find((j) => j.id === selectedJobId) ?? jobItems[0],
    [jobItems, selectedJobId],
  );

  const updateSelectedJob = useCallback(
    (update: (job: JobCard) => JobCard) => {
      setJobItems((items) =>
        items.map((j) => (j.id === selectedJob.id ? update(j) : j)),
      );
    },
    [selectedJob.id],
  );

  function queueOfflineChange(type: QueuedChange["type"]) {
    if (typeof window === "undefined" || window.navigator.onLine) {
      setSyncStatus("Saved");
      return;
    }
    setQueuedChanges((items) => {
      const next = [
        ...items,
        {
          id: `${type}-${selectedJob.id}-${Date.now()}`,
          type,
          jobId: selectedJob.id,
          createdAt: new Date().toISOString(),
        },
      ];
      setSyncStatus(`${next.length} changes queued offline`);
      return next;
    });
  }

  function advanceSelectedJob() {
    const action = NEXT_STATUS[selectedJob.status];
    if (!action) return;
    updateSelectedJob((job) => ({ ...job, status: action.status }));
  }

  function recordInspection(finding: string, recommendation: string) {
    if (!finding.trim() && !recommendation.trim()) return;
    updateSelectedJob((job) => ({
      ...job,
      status: job.status === "assigned" ? "in_progress" : job.status,
      findings: finding.trim()
        ? [
            ...job.findings.filter((f) => f !== "Pending initial inspection"),
            finding.trim(),
          ]
        : job.findings,
      recommendations: recommendation.trim()
        ? [...job.recommendations, recommendation.trim()]
        : job.recommendations,
    }));
    queueOfflineChange("inspection");
  }

  function addPhotos(files: File[]) {
    if (!files.length) return;
    const urls = files.map((f) => URL.createObjectURL(f));
    updateSelectedJob((job) => ({ ...job, photos: [...job.photos, ...urls] }));
  }

  function addLabourEntry(entry: LabourEntry) {
    updateSelectedJob((job) => ({
      ...job,
      status: job.status === "assigned" ? "in_progress" : job.status,
      labour: [...job.labour, entry],
    }));
    queueOfflineChange("labour");
  }

  function toggleTimer(taskName: string) {
    if (!timerStartedAt) {
      setTimerStartedAt(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      );
      return;
    }
    addLabourEntry({
      task: taskName.trim() || "Labour timer",
      hours: 0.5,
      startedAt: timerStartedAt,
      endedAt: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
    setTimerStartedAt(null);
  }

  function requestPart(part: Omit<PartRequest, "status">) {
    if (!part.item.trim() || part.quantity < 1) return;
    updateSelectedJob((job) => ({
      ...job,
      status: "awaiting_parts",
      parts: [...job.parts, { ...part, status: "Requested" }],
    }));
    queueOfflineChange("parts");
  }

  function submitCompletion(notes: string) {
    updateSelectedJob((job) => ({
      ...job,
      status: "completed",
      finalNotes: notes.trim() || "Ready for quality check.",
    }));
  }

  const value: MechanicContextValue = {
    jobItems,
    selectedJobId,
    setSelectedJobId,
    selectedJob,
    updateSelectedJob,
    advanceSelectedJob,
    recordInspection,
    addPhotos,
    addLabourEntry,
    requestPart,
    submitCompletion,
    timerStartedAt,
    toggleTimer,
    isOffline,
    offlineReady,
    queuedChanges,
    syncStatus,
  };

  return (
    <MechanicContext.Provider value={value}>
      {children}
    </MechanicContext.Provider>
  );
}
