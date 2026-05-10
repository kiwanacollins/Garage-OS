'use client';

import { FormEvent, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

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
  const [customers, setCustomers] = useState(initialCustomers);
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [query, setQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomers[0]?.id);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(initialVehicles[0]?.id);
  const [workOrders, setWorkOrders] = useState(initialWorkOrders);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentStatus, setPaymentStatus] = useState('No payment recorded');
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

  return (
    <ProtectedRoute>
      <main className="dashboard register-workspace">
        <section className="workspace-header" aria-labelledby="register-title">
          <div>
            <p className="eyebrow">Front desk</p>
            <h1 id="register-title">Vehicle register and customers</h1>
            <p>Find an owner, verify linked vehicles, and create a clean intake record.</p>
          </div>
          <div className="workspace-actions">
            <button className="button secondary-button" type="button" onClick={() => setCustomerPanel('edit')}>
              Edit customer
            </button>
            <button className="button" type="button" onClick={() => setCustomerPanel('new')}>
              Add customer
            </button>
          </div>
        </section>

        <section className="register-layout" aria-label="Customer and vehicle register">
          <div className="register-main">
            <div className="register-toolbar">
              <label className="search-field">
                <span>Search register</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Name, phone, email, or plate"
                />
              </label>
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
          </div>

          <aside className="register-detail" aria-label="Selected customer">
            {selectedCustomer ? (
              <>
                <div className="detail-heading">
                  <div>
                    <p className="eyebrow">Selected record</p>
                    <h2>{selectedCustomer.name}</h2>
                  </div>
                  <span className="status-badge">{selectedCustomer.preferredContact}</span>
                </div>

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
                  <button className="text-action" type="button" onClick={() => setVehiclePanel(true)}>
                    Add vehicle
                  </button>
                </div>

                <div className="vehicle-list">
                  {selectedVehicles.map((vehicle) => (
                    <button
                      className={`vehicle-item vehicle-button ${vehicle.id === selectedVehicle?.id ? 'is-selected' : ''}`}
                      type="button"
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
                      <span className={`status-badge ${vehicle.status === 'Awaiting parts' ? 'warning' : ''}`}>
                        {vehicle.status}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p>No customer selected.</p>
            )}
          </aside>
        </section>

        <section className="operations-grid" aria-label="Front desk operations">
          <section className="operation-panel" aria-label="Check-in">
            <div className="operation-heading">
              <div>
                <p className="eyebrow">Check-in</p>
                <h2>{selectedVehicle ? selectedVehicle.registrationPlate : 'No vehicle'}</h2>
              </div>
              <span className="status-badge">{selectedWorkOrder?.status ?? 'Ready'}</span>
            </div>
            <form className="operation-form" onSubmit={checkInVehicle}>
              <label className="field">
                <span>Odometer</span>
                <input
                  name="odometerReading"
                  type="number"
                  min="0"
                  required
                  defaultValue={selectedVehicle?.odometerReading}
                />
              </label>
              <label className="field wide-field">
                <span>Customer notes</span>
                <input name="notes" placeholder="Issue, symptoms, arrival condition" required />
              </label>
              <div className="operation-actions">
                <button className="button" type="submit">
                  Check in vehicle
                </button>
                <button
                  className="button secondary-button"
                  type="button"
                  onClick={checkOutVehicle}
                  disabled={!selectedWorkOrder || selectedWorkOrder.status === 'collected'}
                >
                  Confirm collection
                </button>
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
          </section>

          <section className="operation-panel" aria-label="Appointments">
            <div className="operation-heading">
              <div>
                <p className="eyebrow">Appointments</p>
                <h2>Daily booking</h2>
              </div>
              <span className="register-count">{appointments.length} booked</span>
            </div>
            <form className="operation-form" onSubmit={bookAppointment}>
              <label className="field">
                <span>Slot</span>
                <select name="scheduledAt" defaultValue="Tomorrow, 10:00">
                  <option>Tomorrow, 08:30</option>
                  <option>Tomorrow, 10:00</option>
                  <option>Tomorrow, 11:30</option>
                  <option>Tomorrow, 14:00</option>
                </select>
              </label>
              <label className="field wide-field">
                <span>Issue</span>
                <input name="issue" placeholder="Service reason" required />
              </label>
              <button className="button" type="submit">
                Book appointment
              </button>
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
          </section>

          <section className="operation-panel" aria-label="Invoice">
            <div className="operation-heading">
              <div>
                <p className="eyebrow">Invoice</p>
                <h2>{selectedInvoice?.id ?? 'Preview'}</h2>
              </div>
              <span className="status-badge">{selectedInvoice?.status ?? 'No invoice'}</span>
            </div>
            <form className="operation-form" onSubmit={generateInvoice}>
              <label className="field">
                <span>Labour</span>
                <input name="labourTotal" type="number" min="0" required defaultValue="150000" />
              </label>
              <label className="field">
                <span>Parts</span>
                <input name="partsTotal" type="number" min="0" required defaultValue="85000" />
              </label>
              <label className="field">
                <span>Tax</span>
                <input name="tax" type="number" min="0" required defaultValue="42300" />
              </label>
              <button className="button" type="submit" disabled={!selectedWorkOrder}>
                Generate invoice
              </button>
            </form>
            <div className="invoice-total">
              Grand total
              <strong>UGX {(selectedInvoice?.grandTotal ?? 277300).toLocaleString()}</strong>
            </div>
          </section>

          <section className="operation-panel" aria-label="Payment">
            <div className="operation-heading">
              <div>
                <p className="eyebrow">Payment</p>
                <h2>Receipt</h2>
              </div>
              <span className="status-badge">{paymentStatus}</span>
            </div>
            <form className="operation-form" onSubmit={recordPayment}>
              <label className="field">
                <span>Method</span>
                <select name="method" defaultValue="Mobile money">
                  <option>Cash</option>
                  <option>Mobile money</option>
                  <option>Card</option>
                  <option>Bank transfer</option>
                </select>
              </label>
              <label className="field">
                <span>Amount</span>
                <input
                  name="amount"
                  type="number"
                  min="1"
                  required
                  defaultValue={selectedInvoice?.grandTotal ?? 277300}
                />
              </label>
              <button className="button" type="submit" disabled={!selectedInvoice}>
                Record payment
              </button>
            </form>
          </section>
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
      </main>
    </ProtectedRoute>
  );
}
