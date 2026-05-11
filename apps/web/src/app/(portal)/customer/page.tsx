"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Accordion,
  Badge,
  Button,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
  UnstyledButton,
} from "@mantine/core";
import {
  PiCalendarCheck,
  PiCarProfile,
  PiCreditCard,
  PiFloppyDisk,
  PiReceipt,
  PiSealCheck,
  PiStar,
  PiTrash,
  PiWrench,
} from "react-icons/pi";
import { DashboardShell } from "@/components/DashboardShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthProvider";
import { apiRequest } from "@/lib/api";

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  colour: string;
  registrationPlate: string;
  odometerReading: number;
};

type WorkOrder = {
  id: string;
  vehicleId: string;
  status: "in_progress" | "awaiting_parts" | "completed" | "paid";
  concern: string;
  mechanicNotes: string;
  updatedAt: string;
};

type Invoice = {
  id: string;
  workOrderId: string;
  item: string;
  amount: number;
  status: "issued" | "paid" | "pending";
  trackingId?: string;
};

type Appointment = {
  id: string;
  vehicleId: string;
  scheduledAt: string;
  issue: string;
  status: "scheduled" | "confirmed";
};

const initialVehicles: Vehicle[] = [
  {
    id: "vehicle-1",
    make: "Toyota",
    model: "Harrier",
    year: 2018,
    colour: "Pearl",
    registrationPlate: "UAX 123A",
    odometerReading: 54210,
  },
  {
    id: "vehicle-2",
    make: "Honda",
    model: "Civic",
    year: 2021,
    colour: "Blue",
    registrationPlate: "UBB 456C",
    odometerReading: 22000,
  },
];

const initialWorkOrders: WorkOrder[] = [
  {
    id: "WO-1048",
    vehicleId: "vehicle-1",
    status: "awaiting_parts",
    concern: "Brake vibration above 80 km/h",
    mechanicNotes:
      "Front pads below 3 mm. Lower arm bushing has visible cracking.",
    updatedAt: "Today 12:15",
  },
  {
    id: "WO-1032",
    vehicleId: "vehicle-2",
    status: "completed",
    concern: "Oil service and inspection",
    mechanicNotes: "Service complete. Next oil change due after 5,000 km.",
    updatedAt: "2 May 2026",
  },
];

const initialInvoices: Invoice[] = [
  {
    id: "INV-1849",
    workOrderId: "WO-1048",
    item: "Front pads and labour",
    amount: 277300,
    status: "issued",
  },
  {
    id: "INV-1842",
    workOrderId: "WO-1032",
    item: "Oil service",
    amount: 120000,
    status: "paid",
  },
];

const initialAppointments: Appointment[] = [
  {
    id: "APT-208",
    vehicleId: "vehicle-2",
    scheduledAt: "Tue 12 May, 10:00",
    issue: "Wheel alignment",
    status: "confirmed",
  },
];

const statusSteps = [
  "Checked in",
  "Inspection",
  "Parts approval",
  "Quality check",
];
const slots = [
  "2026-05-12T08:30:00.000Z",
  "2026-05-12T10:00:00.000Z",
  "2026-05-12T11:30:00.000Z",
  "2026-05-12T14:00:00.000Z",
];

function money(value: number) {
  return `UGX ${value.toLocaleString()}`;
}

function statusLabel(status: WorkOrder["status"]) {
  return status.replaceAll("_", " ");
}

export default function CustomerPortalPage() {
  const { accessToken, user } = useAuth();
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [workOrders, setWorkOrders] = useState(initialWorkOrders);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [selectedVehicleId, setSelectedVehicleId] = useState(
    initialVehicles[0].id,
  );
  const [tab, setTab] = useState<string | null>("overview");
  const [profileStatus, setProfileStatus] = useState("Profile current");
  const [bookingStatus, setBookingStatus] = useState("No new booking");
  const [paymentStatus, setPaymentStatus] = useState("No checkout started");
  const [feedbackStatus, setFeedbackStatus] = useState("No feedback submitted");
  const [rating, setRating] = useState<number | string>(5);

  const selectedVehicle =
    vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicles[0];
  const activeWorkOrder = workOrders.find(
    (workOrder) =>
      workOrder.vehicleId === selectedVehicle?.id &&
      workOrder.status !== "paid",
  );
  const selectedVehicleAppointments = appointments.filter(
    (appointment) => appointment.vehicleId === selectedVehicle?.id,
  );
  const outstandingInvoices = invoices.filter(
    (invoice) => invoice.status !== "paid",
  );
  const completedOrders = workOrders.filter((workOrder) =>
    ["completed", "paid"].includes(workOrder.status),
  );

  const selectedInvoice = useMemo(
    () =>
      outstandingInvoices.find(
        (invoice) => invoice.workOrderId === activeWorkOrder?.id,
      ) ?? outstandingInvoices[0],
    [activeWorkOrder?.id, outstandingInvoices],
  );

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileStatus("Profile saved");
  }

  function addVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const vehicle = {
      id: `vehicle-${Date.now()}`,
      make: String(form.get("make")),
      model: String(form.get("model")),
      year: Number(form.get("year")),
      colour: String(form.get("colour")),
      registrationPlate: String(form.get("registrationPlate")).toUpperCase(),
      odometerReading: Number(form.get("odometerReading")),
    };
    setVehicles((items) => [vehicle, ...items]);
    setSelectedVehicleId(vehicle.id);
    event.currentTarget.reset();
  }

  function removeVehicle(vehicleId: string) {
    setVehicles((items) => items.filter((vehicle) => vehicle.id !== vehicleId));
    if (selectedVehicleId === vehicleId) {
      setSelectedVehicleId(
        vehicles.find((vehicle) => vehicle.id !== vehicleId)?.id ?? "",
      );
    }
  }

  function bookAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const appointment = {
      id: `APT-${Math.floor(Date.now() / 1000)
        .toString()
        .slice(-3)}`,
      vehicleId: String(form.get("vehicleId")),
      scheduledAt: String(form.get("scheduledAt")),
      issue: String(form.get("issue")),
      status: "scheduled" as const,
    };
    setAppointments((items) => [appointment, ...items]);
    setBookingStatus(`Booking confirmed for ${appointment.scheduledAt}`);
    event.currentTarget.reset();
  }

  async function startPesapalPayment(invoice: Invoice) {
    setPaymentStatus("Starting Pesapal checkout...");

    if (accessToken && !invoice.id.startsWith("INV-")) {
      try {
        const response = await apiRequest<{
          redirectUrl: string;
          orderTrackingId: string;
        }>("/api/v1/payments/pesapal/initiate", {
          method: "POST",
          headers: { authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ invoiceId: invoice.id }),
        });
        setPaymentStatus(`Pesapal checkout ready: ${response.orderTrackingId}`);
        return;
      } catch (error) {
        setPaymentStatus(
          error instanceof Error
            ? error.message
            : "Unable to start Pesapal checkout",
        );
        return;
      }
    }

    const trackingId = `mock-${invoice.id}`;
    setInvoices((items) =>
      items.map((item) =>
        item.id === invoice.id
          ? { ...item, status: "pending", trackingId }
          : item,
      ),
    );
    setPaymentStatus(`Pesapal checkout ready: ${trackingId}`);
  }

  function confirmPesapalCallback(invoiceId: string) {
    setInvoices((items) =>
      items.map((invoice) =>
        invoice.id === invoiceId ? { ...invoice, status: "paid" } : invoice,
      ),
    );
    setWorkOrders((items) =>
      items.map((workOrder) =>
        workOrder.id === selectedInvoice?.workOrderId
          ? { ...workOrder, status: "paid" }
          : workOrder,
      ),
    );
    setPaymentStatus("Pesapal payment completed");
  }

  function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setFeedbackStatus(
      `Feedback submitted: ${rating}/5 for ${String(form.get("workOrderId"))}`,
    );
    event.currentTarget.reset();
    setRating(5);
  }

  return (
    <ProtectedRoute>
      <DashboardShell
        role="Customer"
        active="customer"
        dateLabel="Monday, 11 May 2026"
        title="Customer portal"
        subtitle="Manage vehicles, bookings, service progress, invoices, online payments, and feedback."
        stats={[
          { value: String(vehicles.length), label: "vehicles" },
          {
            value: String(
              workOrders.filter((workOrder) => workOrder.status !== "paid")
                .length,
            ),
            label: "active services",
          },
          { value: String(outstandingInvoices.length), label: "open invoices" },
        ]}
        secondaryAction={
          <Button
            variant="default"
            leftSection={<PiCalendarCheck size={18} />}
            onClick={() => setTab("appointments")}
          >
            Book service
          </Button>
        }
        primaryAction={
          <Button
            leftSection={<PiCreditCard size={18} />}
            onClick={() => setTab("invoices")}
            disabled={!selectedInvoice}
          >
            Pay invoice
          </Button>
        }
      >
        <Tabs value={tab} onChange={setTab} className="admin-tabs">
          <Tabs.List>
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
            <Tabs.Tab value="profile">Profile</Tabs.Tab>
            <Tabs.Tab value="vehicles">Vehicles</Tabs.Tab>
            <Tabs.Tab value="appointments">Appointments</Tabs.Tab>
            <Tabs.Tab value="history">History</Tabs.Tab>
            <Tabs.Tab value="invoices">Invoices</Tabs.Tab>
            <Tabs.Tab value="feedback">Feedback</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt="md">
            <section
              className="customer-board"
              aria-label="Customer service overview"
            >
              <Paper className="customer-status-panel">
                <Group justify="space-between" align="flex-start">
                  <Stack gap={3}>
                    <Text className="eyebrow">Current service</Text>
                    <Title order={2}>
                      {selectedVehicle?.registrationPlate}
                    </Title>
                    <Text c="dimmed">
                      {selectedVehicle?.year} {selectedVehicle?.make}{" "}
                      {selectedVehicle?.model}
                      {activeWorkOrder
                        ? ` · ${activeWorkOrder.concern}`
                        : " · No active service"}
                    </Text>
                  </Stack>
                  <Badge
                    color={
                      activeWorkOrder?.status === "awaiting_parts"
                        ? "orange"
                        : "garageBlue"
                    }
                  >
                    {activeWorkOrder
                      ? statusLabel(activeWorkOrder.status)
                      : "clear"}
                  </Badge>
                </Group>

                <div className="service-timeline">
                  {statusSteps.map((item, index) => (
                    <div
                      className={`service-step is-${index < 2 ? "done" : index === 2 ? "current" : "idle"}`}
                      key={item}
                    >
                      <i />
                      <span>
                        <strong>{item}</strong>
                        <small>
                          {index < 2
                            ? "Done"
                            : index === 2
                              ? "Waiting"
                              : "Next"}
                        </small>
                      </span>
                    </div>
                  ))}
                </div>

                <div className="approval-callout">
                  <PiWrench size={22} />
                  <span>
                    <strong>
                      {activeWorkOrder?.mechanicNotes ??
                        "No service issue pending"}
                    </strong>
                    <small>
                      {activeWorkOrder?.updatedAt ??
                        "Garage updates will appear here."}
                    </small>
                  </span>
                  <Button
                    size="xs"
                    onClick={() => setTab("invoices")}
                    disabled={!selectedInvoice}
                  >
                    Review
                  </Button>
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
                      <b>{money(invoice.amount)}</b>
                      <Badge
                        color={
                          invoice.status === "paid"
                            ? "green"
                            : invoice.status === "pending"
                              ? "orange"
                              : "garageBlue"
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Paper>

              <Paper className="customer-status-panel customer-context">
                <div className="context-row">
                  <PiCalendarCheck size={21} />
                  <span>
                    <strong>Next appointment</strong>
                    <small>
                      {appointments[0]?.scheduledAt ?? "No appointment booked"}
                    </small>
                  </span>
                </div>
                <div className="context-row">
                  <PiCarProfile size={21} />
                  <span>
                    <strong>Selected vehicle</strong>
                    <small>
                      {selectedVehicle
                        ? `${selectedVehicle.make} ${selectedVehicle.model}`
                        : "No vehicle"}
                    </small>
                  </span>
                </div>
                <div className="context-row">
                  <PiSealCheck size={21} />
                  <span>
                    <strong>Payment status</strong>
                    <small>{paymentStatus}</small>
                  </span>
                </div>
                <div className="context-row">
                  <PiStar size={21} />
                  <span>
                    <strong>Feedback</strong>
                    <small>{feedbackStatus}</small>
                  </span>
                </div>
              </Paper>
            </section>
          </Tabs.Panel>

          <Tabs.Panel value="profile" pt="md">
            <section
              className="customer-portal-grid"
              aria-label="Customer profile"
            >
              <Paper className="operation-panel">
                <Group justify="space-between">
                  <Title order={2}>Profile details</Title>
                  <Badge>{profileStatus}</Badge>
                </Group>
                <form className="operation-form" onSubmit={saveProfile}>
                  <TextInput
                    name="name"
                    label="Name"
                    defaultValue={user?.name ?? "Alice Customer"}
                    required
                  />
                  <TextInput
                    name="email"
                    label="Email"
                    defaultValue={user?.email ?? "customer@example.com"}
                    required
                  />
                  <TextInput
                    name="phone"
                    label="Phone"
                    defaultValue={user?.phone ?? "+256700000004"}
                  />
                  <TextInput
                    className="wide-field"
                    name="address"
                    label="Address"
                    defaultValue="Ntinda, Kampala"
                  />
                  <Select
                    name="preferredContact"
                    label="Preferred contact"
                    defaultValue="whatsapp"
                    data={[
                      { value: "whatsapp", label: "WhatsApp" },
                      { value: "sms", label: "SMS" },
                      { value: "email", label: "Email" },
                    ]}
                  />
                  <Button
                    type="submit"
                    leftSection={<PiFloppyDisk size={18} />}
                  >
                    Save profile
                  </Button>
                </form>
              </Paper>
              <Paper className="operation-panel">
                <Title order={2}>Password</Title>
                <form className="operation-form" onSubmit={saveProfile}>
                  <TextInput
                    name="currentPassword"
                    label="Current password"
                    type="password"
                  />
                  <TextInput
                    name="newPassword"
                    label="New password"
                    type="password"
                  />
                  <Button type="submit">Update password</Button>
                </form>
              </Paper>
            </section>
          </Tabs.Panel>

          <Tabs.Panel value="vehicles" pt="md">
            <section
              className="customer-portal-grid"
              aria-label="Vehicle management"
            >
              <Paper className="operation-panel">
                <Title order={2}>My vehicles</Title>
                <div className="vehicle-list">
                  {vehicles.map((vehicle) => (
                    <UnstyledButton
                      className={`vehicle-item vehicle-button ${vehicle.id === selectedVehicleId ? "is-selected" : ""}`}
                      key={vehicle.id}
                      onClick={() => setSelectedVehicleId(vehicle.id)}
                    >
                      <div>
                        <strong className="mono-value">
                          {vehicle.registrationPlate}
                        </strong>
                        <span>
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </span>
                      </div>
                      <div>
                        <span>{vehicle.colour}</span>
                        <span>
                          {vehicle.odometerReading.toLocaleString()} km
                        </span>
                      </div>
                      <Button
                        variant="subtle"
                        color="red"
                        size="compact-xs"
                        leftSection={<PiTrash size={14} />}
                        onClick={(event) => {
                          event.stopPropagation();
                          removeVehicle(vehicle.id);
                        }}
                      >
                        Remove
                      </Button>
                    </UnstyledButton>
                  ))}
                </div>
              </Paper>
              <Paper className="operation-panel">
                <Title order={2}>Add vehicle</Title>
                <form className="operation-form" onSubmit={addVehicle}>
                  <TextInput name="make" label="Make" required />
                  <TextInput name="model" label="Model" required />
                  <NumberInput name="year" label="Year" min={1900} required />
                  <TextInput name="colour" label="Colour" />
                  <TextInput
                    name="registrationPlate"
                    label="Registration plate"
                    required
                  />
                  <NumberInput
                    name="odometerReading"
                    label="Odometer"
                    min={0}
                  />
                  <Button
                    type="submit"
                    leftSection={<PiCarProfile size={18} />}
                  >
                    Add vehicle
                  </Button>
                </form>
              </Paper>
            </section>
          </Tabs.Panel>

          <Tabs.Panel value="appointments" pt="md">
            <section
              className="customer-portal-grid"
              aria-label="Appointment booking"
            >
              <Paper className="operation-panel">
                <Group justify="space-between">
                  <Title order={2}>Book appointment</Title>
                  <Badge>{bookingStatus}</Badge>
                </Group>
                <form className="operation-form" onSubmit={bookAppointment}>
                  <Select
                    name="vehicleId"
                    label="Vehicle"
                    defaultValue={selectedVehicleId}
                    data={vehicles.map((vehicle) => ({
                      value: vehicle.id,
                      label: `${vehicle.registrationPlate} · ${vehicle.make} ${vehicle.model}`,
                    }))}
                  />
                  <Select
                    name="scheduledAt"
                    label="Available slot"
                    defaultValue={slots[1]}
                    data={slots}
                  />
                  <Textarea
                    className="wide-field"
                    name="issue"
                    label="Issue description"
                    required
                    autosize
                    minRows={2}
                  />
                  <Button
                    type="submit"
                    leftSection={<PiCalendarCheck size={18} />}
                  >
                    Book appointment
                  </Button>
                </form>
              </Paper>
              <Paper className="operation-panel">
                <Title order={2}>Upcoming appointments</Title>
                <div className="mini-list">
                  {appointments.map((appointment) => (
                    <div className="mini-row" key={appointment.id}>
                      <span>{appointment.scheduledAt}</span>
                      <strong>
                        {
                          vehicles.find(
                            (vehicle) => vehicle.id === appointment.vehicleId,
                          )?.registrationPlate
                        }
                      </strong>
                      <small>{appointment.issue}</small>
                    </div>
                  ))}
                </div>
              </Paper>
            </section>
          </Tabs.Panel>

          <Tabs.Panel value="history" pt="md">
            <Paper className="operation-panel" aria-label="Service history">
              <Title order={2}>Service history</Title>
              <Accordion variant="separated">
                {workOrders.map((workOrder) => {
                  const vehicle = vehicles.find(
                    (item) => item.id === workOrder.vehicleId,
                  );
                  return (
                    <Accordion.Item value={workOrder.id} key={workOrder.id}>
                      <Accordion.Control>
                        {workOrder.id} · {vehicle?.registrationPlate} ·{" "}
                        {statusLabel(workOrder.status)}
                      </Accordion.Control>
                      <Accordion.Panel>
                        <Stack gap="xs">
                          <Text>{workOrder.concern}</Text>
                          <Text c="dimmed">{workOrder.mechanicNotes}</Text>
                          <Text className="register-count">
                            Updated {workOrder.updatedAt}
                          </Text>
                        </Stack>
                      </Accordion.Panel>
                    </Accordion.Item>
                  );
                })}
              </Accordion>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="invoices" pt="md">
            <Paper
              className="operation-panel"
              aria-label="Invoice and payments"
            >
              <Group justify="space-between">
                <Title order={2}>Invoices and Pesapal payments</Title>
                <Badge>{paymentStatus}</Badge>
              </Group>
              <div className="customer-list">
                {invoices.map((invoice) => (
                  <div className="customer-row invoice-row" key={invoice.id}>
                    <span>
                      <strong>{invoice.id}</strong>
                      <small>{invoice.item}</small>
                    </span>
                    <b>{money(invoice.amount)}</b>
                    <Badge
                      color={
                        invoice.status === "paid"
                          ? "green"
                          : invoice.status === "pending"
                            ? "orange"
                            : "garageBlue"
                      }
                    >
                      {invoice.status}
                    </Badge>
                    <Group gap="xs">
                      <Button variant="default" size="compact-sm">
                        Download PDF
                      </Button>
                      {invoice.status === "paid" ? null : (
                        <Button
                          size="compact-sm"
                          leftSection={<PiCreditCard size={16} />}
                          onClick={() => startPesapalPayment(invoice)}
                        >
                          Pay online
                        </Button>
                      )}
                      {invoice.status === "pending" ? (
                        <Button
                          size="compact-sm"
                          color="green"
                          onClick={() => confirmPesapalCallback(invoice.id)}
                        >
                          Confirm Pesapal callback
                        </Button>
                      ) : null}
                    </Group>
                  </div>
                ))}
              </div>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="feedback" pt="md">
            <Paper className="operation-panel" aria-label="Customer feedback">
              <Group justify="space-between">
                <Title order={2}>Service feedback</Title>
                <Badge>{feedbackStatus}</Badge>
              </Group>
              <form className="operation-form" onSubmit={submitFeedback}>
                <Select
                  name="workOrderId"
                  label="Completed service"
                  defaultValue={completedOrders[0]?.id}
                  data={completedOrders.map((workOrder) => ({
                    value: workOrder.id,
                    label: `${workOrder.id} · ${vehicles.find((vehicle) => vehicle.id === workOrder.vehicleId)?.registrationPlate}`,
                  }))}
                />
                <NumberInput
                  name="rating"
                  label="Rating"
                  min={1}
                  max={5}
                  value={rating}
                  onChange={setRating}
                />
                <Textarea
                  className="wide-field"
                  name="comment"
                  label="Comment"
                  autosize
                  minRows={2}
                />
                <Button type="submit" leftSection={<PiStar size={18} />}>
                  Submit feedback
                </Button>
              </form>
            </Paper>
          </Tabs.Panel>
        </Tabs>
      </DashboardShell>
    </ProtectedRoute>
  );
}
