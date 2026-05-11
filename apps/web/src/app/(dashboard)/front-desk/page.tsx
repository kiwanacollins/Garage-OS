'use client';

import { FormEvent, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
  UnstyledButton,
} from '@mantine/core';
import {
  CalendarIcon,
  CheckIcon,
  CustomerIcon,
  InvoiceIcon,
  OdometerIcon,
  PaymentIcon,
  VehicleIcon,
} from '@/components/icons';
import { DashboardShell, type NavItem } from '@/components/DashboardShell';
import { useAuth } from '@/components/AuthProvider';

const FRONT_DESK_NAV: NavItem[] = [
  { key: 'register', label: 'Register', href: '/front-desk', icon: CustomerIcon },
  { key: 'checkin', label: 'Check-in / out', href: '/front-desk', icon: VehicleIcon },
  { key: 'appointments', label: 'Appointments', href: '/front-desk', icon: CalendarIcon },
  { key: 'invoices', label: 'Invoices', href: '/front-desk', icon: InvoiceIcon },
  { key: 'payments', label: 'Payments', href: '/front-desk', icon: PaymentIcon },
  { key: 'notifications', label: 'Notifications', href: '/front-desk', icon: WorkOrderIcon },
];
import { apiRequest } from '@/lib/api';

type Vehicle = {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year: number;
  colour: string;
  registrationPlate: string;
  odometerReading: number;
  status: 'Ready' | 'In service' | 'Awaiting parts';
};

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferredContact: string;
  address: string;
  lastVisit: string;
};

type WorkOrder = {
  id: string;
  vehicleId: string;
  status: 'created' | 'invoiced' | 'paid' | 'collected';
  notes: string;
  checkedInAt: string;
};

type Appointment = {
  id: string;
  customerId: string;
  vehicleId: string;
  scheduledAt: string;
  issue: string;
  status: 'scheduled' | 'confirmed';
};

type Invoice = {
  id: string;
  workOrderId: string;
  labourTotal: number;
  partsTotal: number;
  tax: number;
  grandTotal: number;
  status: 'issued' | 'paid';
};

const initialCustomers: Customer[] = [
  {
    id: 'customer-1',
    name: 'Alice Nakato',
    email: 'alice@example.com',
    phone: '+256 700 000 014',
    preferredContact: 'WhatsApp',
    address: 'Ntinda, Kampala',
    lastVisit: 'Today, 09:20',
  },
  {
    id: 'customer-2',
    name: 'Brian Mugisha',
    email: 'brian@example.com',
    phone: '+256 701 114 245',
    preferredContact: 'SMS',
    address: 'Kololo, Kampala',
    lastVisit: 'Yesterday',
  },
  {
    id: 'customer-3',
    name: 'Nadia Achieng',
    email: 'nadia@example.com',
    phone: '+256 772 910 441',
    preferredContact: 'Email',
    address: 'Kira Road',
    lastVisit: '4 May 2026',
  },
];

const initialVehicles: Vehicle[] = [
  {
    id: 'vehicle-1',
    customerId: 'customer-1',
    make: 'Toyota',
    model: 'Harrier',
    year: 2018,
    colour: 'Pearl',
    registrationPlate: 'UAX 123A',
    odometerReading: 54210,
    status: 'In service',
  },
  {
    id: 'vehicle-2',
    customerId: 'customer-1',
    make: 'Subaru',
    model: 'Forester',
    year: 2016,
    colour: 'Blue',
    registrationPlate: 'UBK 442M',
    odometerReading: 86100,
    status: 'Ready',
  },
  {
    id: 'vehicle-3',
    customerId: 'customer-2',
    make: 'Mitsubishi',
    model: 'Pajero',
    year: 2014,
    colour: 'Silver',
    registrationPlate: 'UAZ 774Q',
    odometerReading: 118430,
    status: 'Awaiting parts',
  },
];

const initialWorkOrders: WorkOrder[] = [
  {
    id: 'WO-1048',
    vehicleId: 'vehicle-1',
    status: 'created',
    notes: 'Brake vibration above 80 km/h.',
    checkedInAt: 'Today, 09:20',
  },
];

const initialAppointments: Appointment[] = [
  {
    id: 'APT-208',
    customerId: 'customer-3',
    vehicleId: 'vehicle-2',
    scheduledAt: 'Tomorrow, 10:00',
    issue: 'Oil service and cabin filter',
    status: 'confirmed',
  },
];

export default function FrontDeskPage() {
  const { accessToken } = useAuth();
  const [customers, setCustomers] = useState(initialCustomers);
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [query, setQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomers[0]?.id);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(initialVehicles[0]?.id);
  const [workOrders, setWorkOrders] = useState(initialWorkOrders);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentStatus, setPaymentStatus] = useState('No payment recorded');
  const [notificationStatus, setNotificationStatus] = useState('No message queued');
  const [notificationChannel, setNotificationChannel] = useState('whatsapp');
  const [customerPanel, setCustomerPanel] = useState<'closed' | 'new' | 'edit'>('closed');
  const [vehiclePanel, setVehiclePanel] = useState(false);

  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId) ?? customers[0];
  const selectedVehicles = vehicles.filter((vehicle) => vehicle.customerId === selectedCustomer?.id);
  const selectedVehicle =
    selectedVehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? selectedVehicles[0] ?? vehicles[0];
  const selectedWorkOrder = workOrders.find((workOrder) => workOrder.vehicleId === selectedVehicle?.id);
  const selectedInvoice = selectedWorkOrder
    ? invoices.find((invoice) => invoice.workOrderId === selectedWorkOrder.id)
    : undefined;

  const filteredCustomers = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) {
      return customers;
    }

    return customers.filter((customer) => {
      const customerVehicles = vehicles.filter((vehicle) => vehicle.customerId === customer.id);
      return [customer.name, customer.email, customer.phone, customer.address]
        .concat(customerVehicles.map((vehicle) => vehicle.registrationPlate))
        .some((item) => item.toLowerCase().includes(value));
    });
  }, [customers, query, vehicles]);

  function saveCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      name: String(form.get('name')),
      email: String(form.get('email')),
      phone: String(form.get('phone')),
      preferredContact: String(form.get('preferredContact')),
      address: String(form.get('address')),
    };

    if (customerPanel === 'edit' && selectedCustomer) {
      setCustomers((items) =>
        items.map((customer) =>
          customer.id === selectedCustomer.id ? { ...customer, ...input } : customer,
        ),
      );
    } else {
      const id = `customer-${Date.now()}`;
      setCustomers((items) => [{ id, ...input, lastVisit: 'New record' }, ...items]);
      setSelectedCustomerId(id);
    }

    setCustomerPanel('closed');
  }

  function saveVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCustomer) {
      return;
    }

    const form = new FormData(event.currentTarget);
    const id = `vehicle-${Date.now()}`;
    setVehicles((items) => [
      {
        id,
        customerId: selectedCustomer.id,
        make: String(form.get('make')),
        model: String(form.get('model')),
        year: Number(form.get('year')),
        colour: String(form.get('colour')),
        registrationPlate: String(form.get('registrationPlate')).toUpperCase(),
        odometerReading: Number(form.get('odometerReading')),
        status: 'Ready',
      },
      ...items,
    ]);
    setSelectedVehicleId(id);
    setVehiclePanel(false);
  }

  function checkInVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedVehicle) {
      return;
    }

    const form = new FormData(event.currentTarget);
    const odometerReading = Number(form.get('odometerReading'));
    const notes = String(form.get('notes'));
    const id = `WO-${Math.floor(Date.now() / 1000).toString().slice(-4)}`;

    setVehicles((items) =>
      items.map((vehicle) =>
        vehicle.id === selectedVehicle.id
          ? { ...vehicle, odometerReading, status: 'In service' }
          : vehicle,
      ),
    );
    setWorkOrders((items) => [
      {
        id,
        vehicleId: selectedVehicle.id,
        status: 'created',
        notes,
        checkedInAt: 'Just now',
      },
      ...items,
    ]);
    event.currentTarget.reset();
  }

  function checkOutVehicle() {
    if (!selectedWorkOrder) {
      return;
    }

    setWorkOrders((items) =>
      items.map((workOrder) =>
        workOrder.id === selectedWorkOrder.id ? { ...workOrder, status: 'collected' } : workOrder,
      ),
    );
    setVehicles((items) =>
      items.map((vehicle) =>
        vehicle.id === selectedWorkOrder.vehicleId ? { ...vehicle, status: 'Ready' } : vehicle,
      ),
    );
  }

  function bookAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCustomer || !selectedVehicle) {
      return;
    }

    const form = new FormData(event.currentTarget);
    setAppointments((items) => [
      {
        id: `APT-${Math.floor(Date.now() / 1000).toString().slice(-3)}`,
        customerId: selectedCustomer.id,
        vehicleId: selectedVehicle.id,
        scheduledAt: String(form.get('scheduledAt')),
        issue: String(form.get('issue')),
        status: 'scheduled',
      },
      ...items,
    ]);
    event.currentTarget.reset();
  }

  function generateInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedWorkOrder) {
      return;
    }

    const form = new FormData(event.currentTarget);
    const labourTotal = Number(form.get('labourTotal'));
    const partsTotal = Number(form.get('partsTotal'));
    const tax = Number(form.get('tax'));
    const invoice = {
      id: `INV-${Math.floor(Date.now() / 1000).toString().slice(-4)}`,
      workOrderId: selectedWorkOrder.id,
      labourTotal,
      partsTotal,
      tax,
      grandTotal: labourTotal + partsTotal + tax,
      status: 'issued' as const,
    };

    setInvoices((items) => [invoice, ...items.filter((item) => item.workOrderId !== selectedWorkOrder.id)]);
    setWorkOrders((items) =>
      items.map((workOrder) =>
        workOrder.id === selectedWorkOrder.id ? { ...workOrder, status: 'invoiced' } : workOrder,
      ),
    );
  }

  function recordPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedInvoice || !selectedWorkOrder) {
      return;
    }

    const form = new FormData(event.currentTarget);
    setInvoices((items) =>
      items.map((invoice) =>
        invoice.id === selectedInvoice.id ? { ...invoice, status: 'paid' } : invoice,
      ),
    );
    setWorkOrders((items) =>
      items.map((workOrder) =>
        workOrder.id === selectedWorkOrder.id ? { ...workOrder, status: 'paid' } : workOrder,
      ),
    );
    setPaymentStatus(`${String(form.get('method'))} payment recorded`);
  }

  async function sendManualNotification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCustomer) {
      return;
    }

    const form = new FormData(event.currentTarget);
    const message = String(form.get('message'));
    setNotificationStatus('Queueing message...');

    if (!accessToken || selectedCustomer.id.startsWith('customer-')) {
      setNotificationStatus(`${notificationChannel.toUpperCase()} queued for ${selectedCustomer.name}`);
      event.currentTarget.reset();
      return;
    }

    try {
      await apiRequest('/api/v1/notifications/manual-send', {
        method: 'POST',
        headers: { authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          channel: notificationChannel,
          title: 'GarageOS update',
          message,
        }),
      });
      setNotificationStatus(`${notificationChannel.toUpperCase()} queued for ${selectedCustomer.name}`);
      event.currentTarget.reset();
    } catch (error) {
      setNotificationStatus(error instanceof Error ? error.message : 'Unable to queue message');
    }
  }

  return (
    <DashboardShell
      role="Front desk"
      navItems={FRONT_DESK_NAV}
      dateLabel="Monday, 11 May 2026"
      title="Vehicle register and customers"
      subtitle="Customer lookup, vehicle intake, bookings, invoices, and collections."
      stats={[
        { value: String(filteredCustomers.length), label: 'customer records' },
        { value: String(vehicles.filter((vehicle) => vehicle.status === 'In service').length), label: 'vehicles in service' },
        { value: String(appointments.length), label: 'appointments booked' },
      ]}
      secondaryAction={
        <Button variant="default" type="button" leftSection={<CustomerIcon size={18} />} onClick={() => setCustomerPanel('edit')}>
          Edit customer
        </Button>
      }
      primaryAction={
        <Button type="button" leftSection={<CustomerIcon size={18} />} onClick={() => setCustomerPanel('new')}>
          Add customer
        </Button>
      }
    >

        <section className="register-layout" aria-label="Customer and vehicle register">
          <Paper className="register-main">
            <div className="register-toolbar">
              <div className="search-field">
                <TextInput
                  label="Search register"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Name, phone, email, or plate"
                />
              </div>
              <div className="register-count" aria-live="polite">
                {filteredCustomers.length} customers
              </div>
            </div>

            <div className="register-table" role="table" aria-label="Customers">
              <div className="register-row register-row-head" role="row">
                <span>Customer</span>
                <span>Contact</span>
                <span>Vehicles</span>
                <span>Last visit</span>
              </div>
              {filteredCustomers.map((customer) => {
                const count = vehicles.filter((vehicle) => vehicle.customerId === customer.id).length;
                return (
                  <button
                    className={`register-row ${customer.id === selectedCustomer?.id ? 'is-selected' : ''}`}
                    type="button"
                    role="row"
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomerId(customer.id);
                      setSelectedVehicleId(vehicles.find((vehicle) => vehicle.customerId === customer.id)?.id);
                    }}
                  >
                    <span>
                      <strong>{customer.name}</strong>
                      <small>{customer.address}</small>
                    </span>
                    <span>
                      {customer.phone}
                      <small>{customer.email}</small>
                    </span>
                    <span className="mono-value">{count}</span>
                    <span>{customer.lastVisit}</span>
                  </button>
                );
              })}
            </div>
          </Paper>

          <Paper component="aside" className="register-detail" aria-label="Selected customer">
            {selectedCustomer ? (
              <>
                <Group className="detail-heading" align="flex-start" justify="space-between">
                  <Stack gap={2}>
                    <Text className="eyebrow">Selected record</Text>
                    <Title order={2}>{selectedCustomer.name}</Title>
                  </Stack>
                  <Badge>{selectedCustomer.preferredContact}</Badge>
                </Group>

                <dl className="detail-list">
                  <div>
                    <dt>Phone</dt>
                    <dd>{selectedCustomer.phone}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{selectedCustomer.email}</dd>
                  </div>
                  <div>
                    <dt>Address</dt>
                    <dd>{selectedCustomer.address}</dd>
                  </div>
                </dl>

                <div className="linked-heading">
                  <h3>Linked vehicles</h3>
                  <Button variant="subtle" size="compact-sm" type="button" leftSection={<VehicleIcon size={16} />} onClick={() => setVehiclePanel(true)}>
                    Add vehicle
                  </Button>
                </div>

                <div className="vehicle-list">
                  {selectedVehicles.map((vehicle) => (
                    <UnstyledButton
                      className={`vehicle-item vehicle-button ${vehicle.id === selectedVehicle?.id ? 'is-selected' : ''}`}
                      key={vehicle.id}
                      onClick={() => setSelectedVehicleId(vehicle.id)}
                    >
                      <div>
                        <strong className="mono-value">{vehicle.registrationPlate}</strong>
                        <span>
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </span>
                      </div>
                      <div>
                        <span>{vehicle.colour}</span>
                        <span>{vehicle.odometerReading.toLocaleString()} km</span>
                      </div>
                      <Badge color={vehicle.status === 'Awaiting parts' ? 'orange' : vehicle.status === 'In service' ? 'garageBlue' : 'green'}>
                        {vehicle.status}
                      </Badge>
                    </UnstyledButton>
                  ))}
                </div>
              </>
            ) : (
              <p>No customer selected.</p>
            )}
          </Paper>
        </section>

        <section className="operations-grid" aria-label="Front desk operations">
          <Paper className="operation-panel" aria-label="Check-in">
            <Group className="operation-heading" align="flex-start" justify="space-between">
              <Stack gap={2}>
                <Text className="eyebrow">Check-in</Text>
                <Title order={2}>{selectedVehicle ? selectedVehicle.registrationPlate : 'No vehicle'}</Title>
              </Stack>
              <Badge>{selectedWorkOrder?.status ?? 'Ready'}</Badge>
            </Group>
            <form className="operation-form" onSubmit={checkInVehicle}>
              <NumberInput name="odometerReading" label="Odometer" min={0} required defaultValue={selectedVehicle?.odometerReading} />
              <Textarea className="wide-field" name="notes" label="Customer notes" placeholder="Issue, symptoms, arrival condition" required autosize minRows={1} />
              <div className="operation-actions">
                <Button type="submit" leftSection={<OdometerIcon size={18} />}>
                  Check in vehicle
                </Button>
                <Button
                  variant="default"
                  type="button"
                  leftSection={<CheckIcon size={18} />}
                  onClick={checkOutVehicle}
                  disabled={!selectedWorkOrder || selectedWorkOrder.status === 'collected'}
                >
                  Confirm collection
                </Button>
              </div>
            </form>
            <div className="mini-list">
              {workOrders
                .filter((workOrder) => workOrder.vehicleId === selectedVehicle?.id)
                .slice(0, 3)
                .map((workOrder) => (
                  <div className="mini-row" key={workOrder.id}>
                    <span>{workOrder.checkedInAt}</span>
                    <strong>{workOrder.id}</strong>
                    <small>{workOrder.notes}</small>
                  </div>
                ))}
            </div>
          </Paper>

          <Paper className="operation-panel" aria-label="Appointments">
            <Group className="operation-heading" align="flex-start" justify="space-between">
              <Stack gap={2}>
                <Text className="eyebrow">Appointments</Text>
                <Title order={2}>Daily booking</Title>
              </Stack>
              <Text className="register-count">{appointments.length} booked</Text>
            </Group>
            <form className="operation-form" onSubmit={bookAppointment}>
              <Select
                name="scheduledAt"
                label="Slot"
                defaultValue="Tomorrow, 10:00"
                data={['Tomorrow, 08:30', 'Tomorrow, 10:00', 'Tomorrow, 11:30', 'Tomorrow, 14:00']}
              />
              <TextInput className="wide-field" name="issue" label="Issue" placeholder="Service reason" required />
              <Button type="submit" leftSection={<CalendarIcon size={18} />}>
                Book appointment
              </Button>
            </form>
            <div className="mini-list">
              {appointments.slice(0, 3).map((appointment) => {
                const vehicle = vehicles.find((item) => item.id === appointment.vehicleId);
                return (
                  <div className="mini-row" key={appointment.id}>
                    <span>{appointment.scheduledAt}</span>
                    <strong>{vehicle?.registrationPlate}</strong>
                    <small>{appointment.issue}</small>
                  </div>
                );
              })}
            </div>
          </Paper>

          <Paper className="operation-panel" aria-label="Invoice">
            <Group className="operation-heading" align="flex-start" justify="space-between">
              <Stack gap={2}>
                <Text className="eyebrow">Invoice</Text>
                <Title order={2}>{selectedInvoice?.id ?? 'Preview'}</Title>
              </Stack>
              <Badge>{selectedInvoice?.status ?? 'No invoice'}</Badge>
            </Group>
            <form className="operation-form" onSubmit={generateInvoice}>
              <NumberInput name="labourTotal" label="Labour" min={0} required defaultValue={150000} />
              <NumberInput name="partsTotal" label="Parts" min={0} required defaultValue={85000} />
              <NumberInput name="tax" label="Tax" min={0} required defaultValue={42300} />
              <Button type="submit" leftSection={<InvoiceIcon size={18} />} disabled={!selectedWorkOrder}>
                Generate invoice
              </Button>
            </form>
            <div className="invoice-total">
              Grand total
              <strong>UGX {(selectedInvoice?.grandTotal ?? 277300).toLocaleString()}</strong>
            </div>
          </Paper>

          <Paper className="operation-panel" aria-label="Payment">
            <Group className="operation-heading" align="flex-start" justify="space-between">
              <Stack gap={2}>
                <Text className="eyebrow">Payment</Text>
                <Title order={2}>Receipt</Title>
              </Stack>
              <Badge>{paymentStatus}</Badge>
            </Group>
            <form className="operation-form" onSubmit={recordPayment}>
              <Select
                name="method"
                label="Method"
                defaultValue="Mobile money"
                data={['Cash', 'Mobile money', 'Card', 'Bank transfer']}
              />
              <NumberInput name="amount" label="Amount" min={1} required defaultValue={selectedInvoice?.grandTotal ?? 277300} />
              <Button type="submit" leftSection={<PaymentIcon size={18} />} disabled={!selectedInvoice}>
                Record payment
              </Button>
            </form>
          </Paper>

          <Paper className="operation-panel" aria-label="Manual notification">
            <Group className="operation-heading" align="flex-start" justify="space-between">
              <Stack gap={2}>
                <Text className="eyebrow">Notification</Text>
                <Title order={2}>Customer message</Title>
              </Stack>
              <Badge>{notificationStatus}</Badge>
            </Group>
            <form className="operation-form" onSubmit={sendManualNotification}>
              <Select
                label="Channel"
                value={notificationChannel}
                onChange={(value) => setNotificationChannel(value ?? 'whatsapp')}
                data={[
                  { value: 'whatsapp', label: 'WhatsApp' },
                  { value: 'sms', label: 'SMS' },
                  { value: 'email', label: 'Email' },
                ]}
              />
              <Textarea
                className="wide-field"
                name="message"
                label="Message"
                placeholder="Collection notice, appointment reminder, or status update"
                required
                autosize
                minRows={2}
              />
              <Button type="submit" disabled={!selectedCustomer}>
                Queue message
              </Button>
            </form>
          </Paper>
        </section>

        {customerPanel !== 'closed' ? (
          <section className="entry-panel" aria-label={customerPanel === 'edit' ? 'Edit customer' : 'Add customer'}>
            <form className="entry-form" onSubmit={saveCustomer}>
              <div>
                <p className="eyebrow">Customer profile</p>
                <h2>{customerPanel === 'edit' ? 'Edit customer' : 'Add customer'}</h2>
              </div>
              <label className="field">
                <span>Name</span>
                <input name="name" required defaultValue={customerPanel === 'edit' ? selectedCustomer?.name : ''} />
              </label>
              <label className="field">
                <span>Email</span>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={customerPanel === 'edit' ? selectedCustomer?.email : ''}
                />
              </label>
              <label className="field">
                <span>Phone</span>
                <input name="phone" required defaultValue={customerPanel === 'edit' ? selectedCustomer?.phone : ''} />
              </label>
              <label className="field">
                <span>Preferred contact</span>
                <select
                  name="preferredContact"
                  defaultValue={customerPanel === 'edit' ? selectedCustomer?.preferredContact : 'WhatsApp'}
                >
                  <option>WhatsApp</option>
                  <option>SMS</option>
                  <option>Email</option>
                  <option>Phone</option>
                </select>
              </label>
              <label className="field wide-field">
                <span>Address</span>
                <input name="address" required defaultValue={customerPanel === 'edit' ? selectedCustomer?.address : ''} />
              </label>
              <div className="entry-actions">
                <button className="button secondary-button" type="button" onClick={() => setCustomerPanel('closed')}>
                  Cancel
                </button>
                <button className="button" type="submit">
                  Save customer
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {vehiclePanel ? (
          <section className="entry-panel" aria-label="Add vehicle">
            <form className="entry-form" onSubmit={saveVehicle}>
              <div>
                <p className="eyebrow">Vehicle register</p>
                <h2>Add vehicle</h2>
              </div>
              <label className="field">
                <span>Make</span>
                <input name="make" required />
              </label>
              <label className="field">
                <span>Model</span>
                <input name="model" required />
              </label>
              <label className="field">
                <span>Year</span>
                <input name="year" type="number" min="1900" max="2027" required />
              </label>
              <label className="field">
                <span>Colour</span>
                <input name="colour" required />
              </label>
              <label className="field">
                <span>Registration plate</span>
                <input name="registrationPlate" required />
              </label>
              <label className="field">
                <span>Odometer</span>
                <input name="odometerReading" type="number" min="0" required />
              </label>
              <div className="entry-actions">
                <button className="button secondary-button" type="button" onClick={() => setVehiclePanel(false)}>
                  Cancel
                </button>
                <button className="button" type="submit">
                  Register vehicle
                </button>
              </div>
            </form>
          </section>
        ) : null}
    </DashboardShell>
  );
}
