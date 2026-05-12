"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Checkbox,
  FileButton,
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
} from "@mantine/core";
import {
  PiClipboardText,
  PiGear,
  PiMagnifyingGlass,
  PiTruck,
  PiCurrencyCircleDollar,
  PiUsers,
  PiCalendarCheck,
  PiPackage,
  PiTimer,
  PiGauge,
  PiCarProfile,
} from "react-icons/pi";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { io } from "socket.io-client";
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
} from "@/components/icons";
import { DashboardShell, type NavItem } from "@/components/DashboardShell";
import {
  StatCard,
  StatCardGrid,
  KpiTile,
  DashboardCard,
  CardHeader,
} from "@/components/dashboard-ui";
import { API_URL } from "@/lib/api";

function buildAdminNav(
  tab: AdminTab,
  setTab: (t: AdminTab) => void,
  pendingParts: number,
): NavItem[] {
  return [
    { key: 'overview',    label: 'Overview',      href: '/admin', icon: ChartIcon,       onClick: () => setTab('overview') },
    { key: 'operations',  label: 'Work orders',   href: '/admin', icon: WorkOrderIcon,   onClick: () => setTab('operations'),
      count: pendingParts > 0 ? pendingParts : undefined },
    { key: 'staff',       label: 'Staff',         href: '/admin', icon: StaffIcon,       onClick: () => setTab('staff') },
    { key: 'reports',     label: 'Reports',       href: '/admin', icon: ExportIcon,      onClick: () => setTab('reports') },
    { key: 'services',    label: 'Services',      href: '/admin', icon: MoneyIcon,       onClick: () => setTab('services') },
    { key: 'suppliers',   label: 'Suppliers',     href: '/admin', icon: PiTruck,         onClick: () => setTab('suppliers') },
    { key: 'purchases',   label: 'Purchases',     href: '/admin', icon: PiClipboardText, onClick: () => setTab('purchases') },
    { key: 'settings',    label: 'Settings',      href: '/admin', icon: PiGear,          onClick: () => setTab('settings') },
  ];
}

type AssignmentStatus = "created" | "assigned" | "quality_check";
type AdminTab =
  | "overview"
  | "reports"
  | "staff"
  | "services"
  | "operations"
  | "settings"
  | "suppliers"
  | "purchases";

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
  status: "pending" | "approved" | "rejected";
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

type AuditItem = {
  id: string;
  user: string;
  entityType: string;
  entityId: string;
  action: string;
  createdAt: string;
  changes: Record<string, unknown>;
};

type SupplierItem = {
  id: string;
  name: string;
  contactPhone: string;
  contactEmail: string;
  purchaseOrders: number;
};

type PurchaseOrderItem = {
  id: string;
  supplierId: string;
  partsRequestId: string;
  partName: string;
  plate: string;
  status: "ordered" | "shipped" | "received" | "cancelled";
  cost: number;
};

type ApprovedPartsRequest = {
  id: string;
  partName: string;
  quantity: number;
  plate: string;
  workOrderId: string;
};

const mechanics = [
  {
    id: "mechanic-1",
    name: "Moses Kato",
    load: 4,
    shift: "08:00-17:00",
    attendance: "present",
    jobs: 18,
    hours: 37.5,
    utilisation: 94,
  },
  {
    id: "mechanic-2",
    name: "Sarah Auma",
    load: 2,
    shift: "09:00-18:00",
    attendance: "present",
    jobs: 14,
    hours: 31,
    utilisation: 78,
  },
  {
    id: "mechanic-3",
    name: "Daniel Okello",
    load: 3,
    shift: "08:00-16:00",
    attendance: "late",
    jobs: 11,
    hours: 25,
    utilisation: 63,
  },
];

const initialAssignments: Assignment[] = [
  {
    id: "WO-1058",
    status: "created",
    plate: "UCA 990P",
    vehicle: "2020 Mazda CX-5",
    customer: "Grace Tumusiime",
    concern: "Check engine light and rough idle at start.",
    mechanicId: null,
    createdAt: "10 May 2026, 10:40",
  },
  {
    id: "WO-1055",
    status: "assigned",
    plate: "UBK 442M",
    vehicle: "2016 Subaru Forester",
    customer: "Nadia Achieng",
    concern: "Oil service and suspension noise check.",
    mechanicId: "mechanic-1",
    createdAt: "10 May 2026, 09:05",
  },
  {
    id: "WO-1049",
    status: "quality_check",
    plate: "UBH 810L",
    vehicle: "2017 Nissan X-Trail",
    customer: "Oscar Lwanga",
    concern: "Post-service review before invoice.",
    mechanicId: "mechanic-2",
    createdAt: "9 May 2026, 16:45",
  },
];

const initialPartsApprovals: PartsApproval[] = [
  {
    id: "PR-301",
    workOrderId: "WO-1048",
    plate: "UAX 123A",
    part: "Lower arm bushing",
    quantity: 1,
    requestedBy: "Moses Kato",
    note: "Bushing has visible cracks; customer approval required before release.",
    status: "pending",
  },
  {
    id: "PR-302",
    workOrderId: "WO-1052",
    plate: "UAZ 774Q",
    part: "Fan relay",
    quantity: 1,
    requestedBy: "Sarah Auma",
    note: "Vehicle held in bay until relay is available.",
    status: "pending",
  },
];

const initialServices: ServiceItem[] = [
  {
    id: "SVC-01",
    name: "Oil service",
    category: "Mechanical",
    price: 90000,
    isActive: true,
  },
  {
    id: "SVC-02",
    name: "Brake inspection",
    category: "Mechanical",
    price: 65000,
    isActive: true,
  },
  {
    id: "SVC-03",
    name: "Computer diagnosis",
    category: "Electrical",
    price: 80000,
    isActive: true,
  },
];

const initialExpenses: ExpenseItem[] = [
  {
    id: "EXP-01",
    category: "Utilities",
    description: "Workshop power",
    amount: 240000,
  },
  {
    id: "EXP-02",
    category: "Supplies",
    description: "Cleaning consumables",
    amount: 95000,
  },
];

const initialAuditLogs: AuditItem[] = [
  {
    id: "AUD-9001",
    user: "Moses Kato",
    entityType: "work_order",
    entityId: "WO-1048",
    action: "update",
    createdAt: "11 May 2026, 10:42",
    changes: {
      request: { status: "awaiting_parts" },
      path: "/api/v1/parts-requests",
    },
  },
  {
    id: "AUD-9002",
    user: "Grace Nalwanga",
    entityType: "invoice",
    entityId: "INV-1849",
    action: "create",
    createdAt: "11 May 2026, 09:15",
    changes: {
      request: { labourTotal: 180000, tax: 42300 },
      path: "/api/v1/invoices",
    },
  },
  {
    id: "AUD-9003",
    user: "Kiwana Admin",
    entityType: "settings",
    entityId: "garage-os",
    action: "update",
    createdAt: "10 May 2026, 17:30",
    changes: { request: { tax: { vatRate: 18 } }, path: "/api/v1/settings" },
  },
];

const initialSuppliers: SupplierItem[] = [
  {
    id: "SUP-01",
    name: "Kampala Genuine Parts",
    contactPhone: "+256 700 411 200",
    contactEmail: "sales@kampalaparts.local",
    purchaseOrders: 2,
  },
  {
    id: "SUP-02",
    name: "Nakasero Auto Spares",
    contactPhone: "+256 701 922 540",
    contactEmail: "orders@nakasero.local",
    purchaseOrders: 1,
  },
];

const approvedPartsRequests: ApprovedPartsRequest[] = [
  {
    id: "PR-301",
    workOrderId: "WO-1048",
    plate: "UAX 123A",
    partName: "Lower arm bushing",
    quantity: 1,
  },
  {
    id: "PR-302",
    workOrderId: "WO-1052",
    plate: "UAZ 774Q",
    partName: "Fan relay",
    quantity: 1,
  },
];

const initialPurchaseOrders: PurchaseOrderItem[] = [
  {
    id: "PO-7001",
    supplierId: "SUP-01",
    partsRequestId: "PR-301",
    partName: "Lower arm bushing",
    plate: "UAX 123A",
    status: "ordered",
    cost: 140000,
  },
];

const revenueTrend = [
  { label: "Mon", revenue: 1.8, expenses: 0.4 },
  { label: "Tue", revenue: 2.4, expenses: 0.6 },
  { label: "Wed", revenue: 2.1, expenses: 0.5 },
  { label: "Thu", revenue: 3.2, expenses: 0.7 },
  { label: "Fri", revenue: 2.8, expenses: 0.8 },
  { label: "Sat", revenue: 1.6, expenses: 0.3 },
];

const statusLabels: Record<AssignmentStatus, string> = {
  created: "Unassigned",
  assigned: "Assigned",
  quality_check: "Quality check",
};

const statusColors: Record<AssignmentStatus, string> = {
  created: "orange",
  assigned: "garageBlue",
  quality_check: "green",
};

function money(value: number) {
  return `UGX ${value.toLocaleString()}`;
}

export default function AdminDashboardPage() {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [partsApprovals, setPartsApprovals] = useState(initialPartsApprovals);
  const [services, setServices] = useState(initialServices);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [auditLogs] = useState(initialAuditLogs);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditEntity, setAuditEntity] = useState<string | null>("all");
  const [selectedAuditId, setSelectedAuditId] = useState(
    initialAuditLogs[0].id,
  );
  const [garageName, setGarageName] = useState("GarageOS Service Centre");
  const [garagePhone, setGaragePhone] = useState("+256700000000");
  const [garageEmail, setGarageEmail] = useState("frontdesk@garageos.local");
  const [vatRate, setVatRate] = useState<number | string>(18);
  const [invoicePrefix, setInvoicePrefix] = useState("GOS");
  const [invoiceAlerts, setInvoiceAlerts] = useState(true);
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [logoName, setLogoName] = useState("No logo selected");
  const [settingsStatus, setSettingsStatus] = useState("Settings unchanged");
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState(
    initialSuppliers[0].id,
  );
  const [purchaseOrders, setPurchaseOrders] = useState(initialPurchaseOrders);
  const [partsRequestId, setPartsRequestId] = useState(
    approvedPartsRequests[0].id,
  );
  const [purchaseSupplierId, setPurchaseSupplierId] = useState(
    initialSuppliers[0].id,
  );
  const [purchaseCost, setPurchaseCost] = useState<number | string>(140000);
  const [approvalNote, setApprovalNote] = useState("");
  const [selectedId, setSelectedId] = useState(initialAssignments[0].id);
  const [selectedMechanic, setSelectedMechanic] = useState(mechanics[0].id);
  const [tab, setTab] = useState<AdminTab>("overview");
  const [dateFrom, setDateFrom] = useState("2026-05-01");
  const [dateTo, setDateTo] = useState("2026-05-10");
  const [exportStatus, setExportStatus] = useState("No export queued");
  const [serviceName, setServiceName] = useState("");
  const [serviceCategory, setServiceCategory] = useState("Mechanical");
  const [servicePrice, setServicePrice] = useState<number | string>(75000);
  const selected =
    assignments.find((assignment) => assignment.id === selectedId) ??
    assignments[0];
  const filteredAuditLogs = auditLogs.filter((item) => {
    const query = auditSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [item.user, item.entityType, item.entityId, item.action].some((value) =>
        value.toLowerCase().includes(query),
      );
    const matchesEntity =
      !auditEntity || auditEntity === "all" || item.entityType === auditEntity;
    return matchesSearch && matchesEntity;
  });
  const selectedAudit =
    auditLogs.find((item) => item.id === selectedAuditId) ??
    filteredAuditLogs[0] ??
    auditLogs[0];
  const selectedSupplier =
    suppliers.find((supplier) => supplier.id === selectedSupplierId) ??
    suppliers[0];

  useEffect(() => {
    const socket = io(API_URL, {
      transports: ["websocket"],
      autoConnect: true,
    });
    socket.on(
      "work-order:status-updated",
      (event: {
        workOrderId: string;
        status: AssignmentStatus;
        assignedMechanicId?: string | null;
      }) => {
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
    const expenseTotal = expenses.reduce(
      (total, expense) => total + expense.amount,
      0,
    );
    return {
      open: assignments.filter(
        (assignment) => assignment.status !== "quality_check",
      ).length,
      unassigned: assignments.filter(
        (assignment) => assignment.status === "created",
      ).length,
      quality: assignments.filter(
        (assignment) => assignment.status === "quality_check",
      ).length,
      revenueToday: 1840000,
      revenueMonth,
      outstandingInvoices: 6,
      averageTurnaround: "18.4h",
      utilisation: 78,
      appointmentsToday: 9,
      collectionReady: 4,
      partsPending: partsApprovals.filter(
        (request) => request.status === "pending",
      ).length,
      expenses: expenseTotal,
      taxCollected: 1886000,
      netRevenue: revenueMonth - expenseTotal,
    };
  }, [assignments, expenses, partsApprovals]);

  function assignMechanic() {
    setAssignments((items) =>
      items.map((assignment) =>
        assignment.id === selected.id
          ? { ...assignment, mechanicId: selectedMechanic, status: "assigned" }
          : assignment,
      ),
    );
  }

  function resolvePartRequest(id: string, status: PartsApproval["status"]) {
    setPartsApprovals((items) =>
      items.map((request) =>
        request.id === id
          ? {
              ...request,
              status,
              note: approvalNote.trim()
                ? `${request.note} Admin: ${approvalNote.trim()}`
                : request.note,
            }
          : request,
      ),
    );
    setApprovalNote("");
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
        id: `SVC-${String(items.length + 1).padStart(2, "0")}`,
        name: serviceName.trim(),
        category: serviceCategory,
        price,
        isActive: true,
      },
    ]);
    setServiceName("");
    setServicePrice(75000);
  }

  function saveSettings() {
    setSettingsStatus(
      `${garageName} settings saved with ${vatRate}% VAT and ${invoicePrefix} invoices`,
    );
  }

  function addSupplier() {
    if (!supplierName.trim()) {
      return;
    }

    const supplier = {
      id: `SUP-${String(suppliers.length + 1).padStart(2, "0")}`,
      name: supplierName.trim(),
      contactPhone: supplierPhone.trim(),
      contactEmail: supplierEmail.trim(),
      purchaseOrders: 0,
    };
    setSuppliers((items) => [...items, supplier]);
    setSelectedSupplierId(supplier.id);
    setPurchaseSupplierId(supplier.id);
    setSupplierName("");
    setSupplierPhone("");
    setSupplierEmail("");
  }

  function updateSelectedSupplier() {
    if (!selectedSupplier) {
      return;
    }

    setSuppliers((items) =>
      items.map((supplier) =>
        supplier.id === selectedSupplier.id
          ? {
              ...supplier,
              name: supplierName.trim() || supplier.name,
              contactPhone: supplierPhone.trim() || supplier.contactPhone,
              contactEmail: supplierEmail.trim() || supplier.contactEmail,
            }
          : supplier,
      ),
    );
    setSupplierName("");
    setSupplierPhone("");
    setSupplierEmail("");
  }

  function deleteSelectedSupplier() {
    if (!selectedSupplier || suppliers.length === 1) {
      return;
    }

    setSuppliers((items) =>
      items.filter((supplier) => supplier.id !== selectedSupplier.id),
    );
    setSelectedSupplierId(
      suppliers.find((supplier) => supplier.id !== selectedSupplier.id)?.id ??
        suppliers[0].id,
    );
  }

  function createPurchaseOrder() {
    const cost = Number(purchaseCost);
    const partsRequest = approvedPartsRequests.find(
      (request) => request.id === partsRequestId,
    );
    if (!partsRequest || !purchaseSupplierId || Number.isNaN(cost)) {
      return;
    }

    const purchaseOrder = {
      id: `PO-${7001 + purchaseOrders.length}`,
      supplierId: purchaseSupplierId,
      partsRequestId: partsRequest.id,
      partName: partsRequest.partName,
      plate: partsRequest.plate,
      status: "ordered" as const,
      cost,
    };
    setPurchaseOrders((items) => [...items, purchaseOrder]);
    setSuppliers((items) =>
      items.map((supplier) =>
        supplier.id === purchaseSupplierId
          ? { ...supplier, purchaseOrders: supplier.purchaseOrders + 1 }
          : supplier,
      ),
    );
  }

  function movePurchaseOrder(id: string, status: PurchaseOrderItem["status"]) {
    setPurchaseOrders((items) =>
      items.map((order) => (order.id === id ? { ...order, status } : order)),
    );
  }

  const adminNav = buildAdminNav(tab, setTab, metrics.partsPending);

  return (
    <DashboardShell
      role="Admin"
      navItems={adminNav}
      activeNavKey={tab}
      dateLabel="Monday, 11 May 2026"
      title="Admin dashboard"
      subtitle="Revenue, assignments, staff load, and approvals for the garage floor."
      stats={[]}
      secondaryAction={
        <Button
          variant="default"
          leftSection={<ExportIcon size={18} />}
          onClick={() => queueExport("Operations")}
        >
          Share report
        </Button>
      }
      primaryAction={
        <Button
          leftSection={<ChartIcon size={18} />}
          onClick={() => setTab("operations")}
        >
          Assign work
        </Button>
      }
    >
        <Tabs
          value={tab}
          onChange={(value) => setTab((value ?? "overview") as AdminTab)}
          className="admin-tabs"
        >
          <Tabs.List aria-label="Admin dashboard sections" style={{ display: 'none' }}>
            <Tabs.Tab value="overview">overview</Tabs.Tab>
            <Tabs.Tab value="reports">reports</Tabs.Tab>
            <Tabs.Tab value="staff">staff</Tabs.Tab>
            <Tabs.Tab value="services">services</Tabs.Tab>
            <Tabs.Tab value="operations">operations</Tabs.Tab>
            <Tabs.Tab value="audit">audit</Tabs.Tab>
            <Tabs.Tab value="settings">settings</Tabs.Tab>
            <Tabs.Tab value="suppliers">suppliers</Tabs.Tab>
            <Tabs.Tab value="purchases">purchases</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt="md">
            <StatCardGrid>
              <StatCard
                icon={PiCurrencyCircleDollar}
                value={money(metrics.revenueToday)}
                label="Revenue today"
                helper="Paid invoices received today"
                color="#16A34A"
              />
              <StatCard
                icon={WorkOrderIcon}
                value={`${metrics.open} open`}
                label="Work orders"
                helper={`${metrics.unassigned} unassigned, ${metrics.quality} in QC`}
                color="#2563EB"
              />
              <StatCard
                icon={PiPackage}
                value={String(metrics.partsPending)}
                label="Parts pending"
                helper="Awaiting approval"
                color={metrics.partsPending > 0 ? "#F59E0B" : "#16A34A"}
              />
            </StatCardGrid>

            <section className="admin-grid" aria-label="Dashboard KPIs">
              <KpiTile icon={MoneyIcon} label="Revenue month" value={money(metrics.revenueMonth)} helper="Issued and paid service revenue" accentColor="#16A34A" />
              <KpiTile icon={MoneyIcon} label="Outstanding invoices" value={String(metrics.outstandingInvoices)} helper="Invoices not paid or cancelled" accentColor="#DC2626" />
              <KpiTile icon={PiTimer} label="Avg turnaround" value={metrics.averageTurnaround} helper="Completed job cycle time" accentColor="#2563EB" />
              <KpiTile icon={PiGauge} label="Mechanic utilisation" value={`${metrics.utilisation}%`} helper="Booked labour vs capacity" accentColor="#7C3AED" />
              <KpiTile icon={PiCalendarCheck} label="Appointments today" value={String(metrics.appointmentsToday)} helper="Scheduled workshop visits" accentColor="#2563EB" />
              <KpiTile icon={PiCarProfile} label="Collection ready" value={String(metrics.collectionReady)} helper="Paid jobs ready for pickup" accentColor="#16A34A" />
            </section>

            <section
              className="analytics-layout"
              aria-label="Revenue and workload analytics"
            >
              <Paper className="analytics-panel">
                <Group justify="space-between">
                  <Stack gap={2}>
                    <Group gap="xs">
                      <MoneyIcon size={22} />
                      <Title order={2}>Revenue and expenses</Title>
                    </Group>
                    <Text c="dimmed">
                      Daily revenue vs operating expenses for the selected period.
                    </Text>
                  </Stack>
                  <Badge color="green">Net {money(metrics.netRevenue)}</Badge>
                </Group>
                <div className="chart-container" aria-label="Revenue trend chart">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={revenueTrend.map((point) => ({
                        day: point.label,
                        Revenue: Math.round(point.revenue * 1000000),
                        Expenses: Math.round(point.expenses * 1000000),
                      }))}
                      margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="day" stroke="#6b7280" />
                      <YAxis
                        stroke="#6b7280"
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip
                        formatter={(value) => money(Number(value))}
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                        }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: "16px" }}
                        iconType="square"
                      />
                      <Bar dataKey="Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Paper>

              <Paper className="analytics-panel">
                <Group gap="xs" mb={16}>
                  <WorkOrderIcon size={22} />
                  <Title order={2}>Workload status</Title>
                </Group>
                <div className="chart-container" aria-label="Workload distribution">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Assigned", value: 34, count: Math.round(34 * metrics.open / 100) },
                          { name: "In progress", value: 28, count: Math.round(28 * metrics.open / 100) },
                          { name: "Awaiting parts", value: 18, count: Math.round(18 * metrics.open / 100) },
                          { name: "Quality check", value: 20, count: Math.round(20 * metrics.open / 100) },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        <Cell fill="#2563eb" />
                        <Cell fill="#7c3aed" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#16a34a" />
                      </Pie>
                      <Tooltip
                        formatter={(value, name, props) =>
                          name === "value"
                            ? `${value}%`
                            : `${props.payload.count} jobs`
                        }
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="workload-legend">
                    {(
                      [
                        ["Assigned", 34, "#2563eb"] as const,
                        ["In progress", 28, "#7c3aed"] as const,
                        ["Awaiting parts", 18, "#f59e0b"] as const,
                        ["Quality check", 20, "#16a34a"] as const,
                      ] as const
                    ).map(([label, width, color]) => (
                      <div className="legend-item" key={label}>
                        <span
                          className="legend-dot"
                          style={{ backgroundColor: color }}
                        />
                        <span className="legend-label">{label}</span>
                        <span className="legend-value">{width}%</span>
                      </div>
                    ))}
                  </div>
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
                  <Text c="dimmed">
                    Generate revenue, job, staff, and tax summaries for the
                    selected period.
                  </Text>
                </Stack>
                <Group align="flex-end">
                  <TextInput
                    label="From"
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.currentTarget.value)}
                  />
                  <TextInput
                    label="To"
                    type="date"
                    value={dateTo}
                    onChange={(event) => setDateTo(event.currentTarget.value)}
                  />
                </Group>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                {["Revenue", "Jobs", "Staff performance", "Tax summary"].map(
                  (type) => (
                    <Button
                      key={type}
                      type="button"
                      variant="light"
                      leftSection={<ExportIcon size={18} />}
                      onClick={() => queueExport(type)}
                    >
                      Export {type}
                    </Button>
                  ),
                )}
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
                          <Badge
                            color={
                              mechanic.attendance === "late"
                                ? "orange"
                                : "green"
                            }
                          >
                            {mechanic.attendance}
                          </Badge>
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
                  <Text c="dimmed">
                    Standard service prices used by front desk and reports.
                  </Text>
                </Stack>
                <Group align="flex-end">
                  <TextInput
                    label="Service"
                    value={serviceName}
                    onChange={(event) =>
                      setServiceName(event.currentTarget.value)
                    }
                  />
                  <Select
                    label="Category"
                    value={serviceCategory}
                    onChange={(value) =>
                      setServiceCategory(value ?? "Mechanical")
                    }
                    data={["Mechanical", "Electrical", "Body work"]}
                  />
                  <NumberInput
                    label="Price"
                    min={0}
                    value={servicePrice}
                    onChange={setServicePrice}
                  />
                  <Button type="button" onClick={addService}>
                    Add service
                  </Button>
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
                        <Table.Td>
                          <Badge color={service.isActive ? "green" : "gray"}>
                            {service.isActive ? "active" : "inactive"}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="audit" pt="md">
            <section className="job-layout" aria-label="Audit log workspace">
              <Paper className="job-list">
                <Group align="flex-end" justify="space-between">
                  <TextInput
                    label="Search audit logs"
                    placeholder="User, entity, action"
                    leftSection={<PiMagnifyingGlass size={18} />}
                    value={auditSearch}
                    onChange={(event) =>
                      setAuditSearch(event.currentTarget.value)
                    }
                  />
                  <Select
                    label="Audit entity"
                    value={auditEntity}
                    onChange={setAuditEntity}
                    data={[
                      { value: "all", label: "All entities" },
                      { value: "work_order", label: "Work orders" },
                      { value: "invoice", label: "Invoices" },
                      { value: "settings", label: "Settings" },
                    ]}
                  />
                </Group>
                {filteredAuditLogs.map((item) => (
                  <UnstyledButton
                    className={`job-card ${item.id === selectedAudit.id ? "is-selected" : ""}`}
                    key={item.id}
                    onClick={() => setSelectedAuditId(item.id)}
                  >
                    <Badge
                      color={item.action === "create" ? "green" : "garageBlue"}
                    >
                      {item.action}
                    </Badge>
                    <span>
                      <strong className="mono-value">{item.entityId}</strong>
                      <small>{item.entityType}</small>
                    </span>
                    <span>
                      {item.user}
                      <small>{item.createdAt}</small>
                    </span>
                    <span>
                      {item.id}
                      <small>captured by audit middleware</small>
                    </span>
                  </UnstyledButton>
                ))}
              </Paper>

              <Paper
                component="aside"
                className="job-detail"
                aria-label="Audit change diff"
              >
                <Group
                  className="detail-heading"
                  justify="space-between"
                  align="flex-start"
                >
                  <Stack gap={2}>
                    <Text className="eyebrow">{selectedAudit.id}</Text>
                    <Title order={2}>Change diff</Title>
                    <Text c="dimmed">
                      {selectedAudit.user} · {selectedAudit.createdAt}
                    </Text>
                  </Stack>
                  <Badge color="garageBlue">{selectedAudit.entityType}</Badge>
                </Group>
                <dl className="detail-list compact-detail">
                  <div>
                    <dt>Entity</dt>
                    <dd>{selectedAudit.entityId}</dd>
                  </div>
                  <div>
                    <dt>Action</dt>
                    <dd>{selectedAudit.action}</dd>
                  </div>
                  <div>
                    <dt>User</dt>
                    <dd>{selectedAudit.user}</dd>
                  </div>
                </dl>
                <pre className="diff-box">
                  {JSON.stringify(selectedAudit.changes, null, 2)}
                </pre>
              </Paper>
            </section>
          </Tabs.Panel>

          <Tabs.Panel value="settings" pt="md">
            <Paper className="analytics-panel" aria-label="System settings">
              <Group align="flex-start" justify="space-between">
                <Stack gap={2}>
                  <Group gap="xs">
                    <PiGear size={22} />
                    <Title order={2}>System settings</Title>
                  </Group>
                  <Text c="dimmed">
                    Garage profile, tax rules, uploads, notifications, and
                    backup policy.
                  </Text>
                </Stack>
                <Badge color="green">Admin only</Badge>
              </Group>

              <SimpleGrid cols={{ base: 1, md: 2 }}>
                <Stack gap="sm">
                  <Title order={3}>Garage details</Title>
                  <TextInput
                    label="Garage name"
                    value={garageName}
                    onChange={(event) =>
                      setGarageName(event.currentTarget.value)
                    }
                  />
                  <TextInput
                    label="Garage phone"
                    value={garagePhone}
                    onChange={(event) =>
                      setGaragePhone(event.currentTarget.value)
                    }
                  />
                  <TextInput
                    label="Garage email"
                    value={garageEmail}
                    onChange={(event) =>
                      setGarageEmail(event.currentTarget.value)
                    }
                  />
                  <FileButton
                    onChange={(file) =>
                      setLogoName(file?.name ?? "No logo selected")
                    }
                    accept="image/png,image/jpeg"
                  >
                    {(props) => (
                      <Button
                        type="button"
                        variant="light"
                        leftSection={<PiClipboardText size={18} />}
                        {...props}
                      >
                        Upload logo
                      </Button>
                    )}
                  </FileButton>
                  <Text c="dimmed" size="sm">
                    {logoName}
                  </Text>
                </Stack>

                <Stack gap="sm">
                  <Title order={3}>Tax and notifications</Title>
                  <NumberInput
                    label="VAT rate"
                    suffix="%"
                    min={0}
                    max={100}
                    value={vatRate}
                    onChange={setVatRate}
                  />
                  <TextInput
                    label="Invoice prefix"
                    value={invoicePrefix}
                    onChange={(event) =>
                      setInvoicePrefix(event.currentTarget.value)
                    }
                  />
                  <Checkbox
                    label="Appointment reminders"
                    checked={appointmentReminders}
                    onChange={(event) =>
                      setAppointmentReminders(event.currentTarget.checked)
                    }
                  />
                  <Checkbox
                    label="Invoice alerts"
                    checked={invoiceAlerts}
                    onChange={(event) =>
                      setInvoiceAlerts(event.currentTarget.checked)
                    }
                  />
                  <div className="stack-row split-row">
                    <span>
                      Daily backup
                      <small>02:00 local time · 30 day retention</small>
                    </span>
                    <Badge color="green">enabled</Badge>
                  </div>
                </Stack>
              </SimpleGrid>

              <Group justify="space-between">
                <Text aria-live="polite">{settingsStatus}</Text>
                <Button type="button" onClick={saveSettings}>
                  Save settings
                </Button>
              </Group>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="suppliers" pt="md">
            <Paper className="analytics-panel" aria-label="Supplier directory">
              <Group align="flex-end" justify="space-between">
                <Stack gap={2}>
                  <Group gap="xs">
                    <PiTruck size={22} />
                    <Title order={2}>Supplier directory</Title>
                  </Group>
                  <Text c="dimmed">
                    Supplier contacts and linked purchase orders.
                  </Text>
                </Stack>
                <Group align="flex-end">
                  <TextInput
                    label="Supplier name"
                    value={supplierName}
                    onChange={(event) =>
                      setSupplierName(event.currentTarget.value)
                    }
                  />
                  <TextInput
                    label="Supplier phone"
                    value={supplierPhone}
                    onChange={(event) =>
                      setSupplierPhone(event.currentTarget.value)
                    }
                  />
                  <TextInput
                    label="Supplier email"
                    value={supplierEmail}
                    onChange={(event) =>
                      setSupplierEmail(event.currentTarget.value)
                    }
                  />
                  <Button type="button" onClick={addSupplier}>
                    Add supplier
                  </Button>
                </Group>
              </Group>

              <Table.ScrollContainer minWidth={760}>
                <Table verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Supplier</Table.Th>
                      <Table.Th>Phone</Table.Th>
                      <Table.Th>Email</Table.Th>
                      <Table.Th>Purchase orders</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {suppliers.map((supplier) => (
                      <Table.Tr
                        key={supplier.id}
                        className={
                          supplier.id === selectedSupplier?.id
                            ? "is-selected-row"
                            : ""
                        }
                        onClick={() => {
                          setSelectedSupplierId(supplier.id);
                          setSupplierName(supplier.name);
                          setSupplierPhone(supplier.contactPhone);
                          setSupplierEmail(supplier.contactEmail);
                        }}
                      >
                        <Table.Td>{supplier.name}</Table.Td>
                        <Table.Td>{supplier.contactPhone}</Table.Td>
                        <Table.Td>{supplier.contactEmail}</Table.Td>
                        <Table.Td>{supplier.purchaseOrders}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>

              <Group justify="flex-end">
                <Button
                  type="button"
                  variant="light"
                  onClick={updateSelectedSupplier}
                >
                  Update selected
                </Button>
                <Button
                  type="button"
                  variant="light"
                  color="red"
                  onClick={deleteSelectedSupplier}
                >
                  Delete selected
                </Button>
              </Group>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="purchases" pt="md">
            <Paper
              className="analytics-panel"
              aria-label="Purchase order management"
            >
              <Group align="flex-end" justify="space-between">
                <Stack gap={2}>
                  <Group gap="xs">
                    <PiTruck size={22} />
                    <Title order={2}>Purchase orders</Title>
                  </Group>
                  <Text c="dimmed">
                    Create orders from approved parts requests and track
                    fulfilment.
                  </Text>
                </Stack>
                <Group align="flex-end">
                  <Select
                    label="Approved parts request"
                    value={partsRequestId}
                    onChange={(value) =>
                      setPartsRequestId(value ?? approvedPartsRequests[0].id)
                    }
                    data={approvedPartsRequests.map((request) => ({
                      value: request.id,
                      label: `${request.id} · ${request.partName} · ${request.plate}`,
                    }))}
                  />
                  <Select
                    label="Supplier"
                    value={purchaseSupplierId}
                    onChange={(value) =>
                      setPurchaseSupplierId(value ?? suppliers[0].id)
                    }
                    data={suppliers.map((supplier) => ({
                      value: supplier.id,
                      label: supplier.name,
                    }))}
                  />
                  <NumberInput
                    label="Cost"
                    min={0}
                    value={purchaseCost}
                    onChange={setPurchaseCost}
                  />
                  <Button type="button" onClick={createPurchaseOrder}>
                    Create purchase order
                  </Button>
                </Group>
              </Group>

              <div className="approval-list">
                {purchaseOrders.map((order) => {
                  const supplier = suppliers.find(
                    (item) => item.id === order.supplierId,
                  );
                  return (
                    <div className="approval-row" key={order.id}>
                      <Badge
                        color={
                          order.status === "received"
                            ? "green"
                            : order.status === "shipped"
                              ? "garageBlue"
                              : "orange"
                        }
                      >
                        {order.status}
                      </Badge>
                      <span>
                        <strong>{order.partName}</strong>
                        <small>
                          {order.id} · {order.partsRequestId} · {order.plate}
                        </small>
                      </span>
                      <Text c="dimmed">
                        {supplier?.name ?? "Unknown supplier"} ·{" "}
                        {money(order.cost)}
                      </Text>
                      <Group gap="xs" justify="flex-end">
                        <Button
                          type="button"
                          size="xs"
                          variant="light"
                          disabled={order.status !== "ordered"}
                          onClick={() => movePurchaseOrder(order.id, "shipped")}
                        >
                          Mark shipped
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant="light"
                          color="green"
                          disabled={order.status !== "shipped"}
                          onClick={() =>
                            movePurchaseOrder(order.id, "received")
                          }
                        >
                          Mark received
                        </Button>
                      </Group>
                    </div>
                  );
                })}
              </div>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="operations" pt="md">
            <section className="job-layout" aria-label="Work order assignments">
              <Paper className="job-list">
                {assignments.map((assignment) => {
                  const mechanic = mechanics.find(
                    (item) => item.id === assignment.mechanicId,
                  );
                  return (
                    <UnstyledButton
                      className={`job-card ${assignment.id === selected.id ? "is-selected" : ""}`}
                      key={assignment.id}
                      onClick={() => {
                        setSelectedId(assignment.id);
                        setSelectedMechanic(
                          assignment.mechanicId ?? mechanics[0].id,
                        );
                      }}
                    >
                      <Badge color={statusColors[assignment.status]}>
                        {statusLabels[assignment.status]}
                      </Badge>
                      <span>
                        <strong className="mono-value">
                          {assignment.plate}
                        </strong>
                        <small>{assignment.vehicle}</small>
                      </span>
                      <span>
                        {assignment.customer}
                        <small>{assignment.concern}</small>
                      </span>
                      <span>
                        {mechanic?.name ?? "No mechanic"}
                        <small>{assignment.createdAt}</small>
                      </span>
                    </UnstyledButton>
                  );
                })}
              </Paper>

              <Paper
                component="aside"
                className="job-detail"
                aria-label="Assignment detail"
              >
                <Group
                  className="detail-heading"
                  align="flex-start"
                  justify="space-between"
                >
                  <Stack gap={2}>
                    <Text className="eyebrow">{selected.id}</Text>
                    <Title order={2}>{selected.plate}</Title>
                    <Text c="dimmed">{selected.vehicle}</Text>
                  </Stack>
                  <Badge color={statusColors[selected.status]}>
                    {statusLabels[selected.status]}
                  </Badge>
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
                    <dd>
                      {mechanics.find((item) => item.id === selected.mechanicId)
                        ?.name ?? "Unassigned"}
                    </dd>
                  </div>
                </dl>

                <Text className="job-note">{selected.concern}</Text>

                <Select
                  label="Assign mechanic"
                  value={selectedMechanic}
                  onChange={(value) =>
                    setSelectedMechanic(value ?? mechanics[0].id)
                  }
                  data={mechanics.map((mechanic) => ({
                    value: mechanic.id,
                    label: `${mechanic.name} (${mechanic.load} active)`,
                  }))}
                />

                <Button
                  type="button"
                  leftSection={<JobCardIcon size={18} />}
                  onClick={assignMechanic}
                >
                  Assign job card
                </Button>
              </Paper>
            </section>

            <Paper
              className="approval-board"
              component="section"
              aria-label="Parts approval queue"
            >
              <Group align="center" justify="space-between">
                <Stack gap={2}>
                  <Group gap="xs">
                    <PartsIcon size={24} />
                    <Title order={2}>Parts approval</Title>
                  </Group>
                  <Text c="dimmed">
                    Approve, reject, or hold requested parts before purchasing.
                  </Text>
                </Stack>
                <Badge color="orange">
                  {
                    partsApprovals.filter(
                      (request) => request.status === "pending",
                    ).length
                  }{" "}
                  pending
                </Badge>
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
                    <Badge
                      color={
                        request.status === "approved"
                          ? "green"
                          : request.status === "rejected"
                            ? "red"
                            : "orange"
                      }
                    >
                      {request.status}
                    </Badge>
                    <span>
                      <strong>
                        {request.part} x{request.quantity}
                      </strong>
                      <small>
                        {request.workOrderId} · {request.plate} ·{" "}
                        {request.requestedBy}
                      </small>
                    </span>
                    <Text c="dimmed">{request.note}</Text>
                    <Group gap="xs" justify="flex-end">
                      <Button
                        type="button"
                        size="xs"
                        variant="light"
                        color="green"
                        leftSection={<CheckIcon size={16} />}
                        disabled={request.status !== "pending"}
                        onClick={() =>
                          resolvePartRequest(request.id, "approved")
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        variant="light"
                        color="red"
                        leftSection={<WarningIcon size={16} />}
                        disabled={request.status !== "pending"}
                        onClick={() =>
                          resolvePartRequest(request.id, "rejected")
                        }
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
  );
}
