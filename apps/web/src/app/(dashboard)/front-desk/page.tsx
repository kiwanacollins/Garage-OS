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

export default function FrontDeskPage() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [query, setQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomers[0]?.id);
  const [customerPanel, setCustomerPanel] = useState<'closed' | 'new' | 'edit'>('closed');
  const [vehiclePanel, setVehiclePanel] = useState(false);

  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId) ?? customers[0];
  const selectedVehicles = vehicles.filter((vehicle) => vehicle.customerId === selectedCustomer?.id);

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
    setVehicles((items) => [
      {
        id: `vehicle-${Date.now()}`,
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
    setVehiclePanel(false);
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
                    onClick={() => setSelectedCustomerId(customer.id)}
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
                    <article className="vehicle-item" key={vehicle.id}>
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
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <p>No customer selected.</p>
            )}
          </aside>
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
