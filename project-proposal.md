


GARAGE MANAGEMENT SYSTEM
System Requirements & Feature Specification
Proposal Document – Pending Approval
Prepared: 8 May 2026

1. Introduction
This document outlines the proposed features, modules, and functionality for a Garage Management System (GMS). The system is designed to digitise and streamline the day-to-day operations of an automotive garage, covering customer management, job scheduling, vehicle servicing, invoicing, and reporting.
The system will serve four user roles — Admin/Owner, Mechanic, Front Desk, and Customer — each with a tailored interface and access level appropriate to their responsibilities. This proposal is submitted for review and approval before development commences.

2. Project Objectives
•	Centralise all garage operations into a single, easy-to-use digital platform.
•	Eliminate manual paperwork for job cards, invoices, and customer records.
•	Provide management with real-time visibility into business performance.
•	Improve communication between the front desk, mechanics, and management.
•	Maintain a complete, searchable history of all vehicles and services.
•	Enforce role-based access control so each user only sees what is relevant to them.

3. User Roles Overview
The system will support the following four roles, each with distinct permissions and responsibilities:

Role	Access Level	Primary Responsibilities
Admin / Owner	Full access	Business oversight, staff management, finance, reporting, and system configuration.
Mechanic	Restricted (own jobs)	View and update assigned job cards, log labour, perform inspections, and request parts.
Front Desk	Customer & billing	Manage customers, schedule appointments, check vehicles in/out, generate invoices, and process payments.
Customer	Self-service (own data)	Book appointments, track vehicle service status, view invoices, make payments, and access personal service history.

4. System Modules & Features
The following sections detail the features available to each user role.

4.1  Admin / Owner
The Admin/Owner has full system access and is responsible for overall business management. The following modules are available exclusively or primarily to this role:

Module / Feature	Description
Dashboard & Analytics	A real-time overview of business KPIs including revenue, number of jobs completed, pending jobs, and mechanic performance metrics. Includes visual charts and date-range filtering.
Staff Management	Add, edit, and deactivate staff accounts. Assign roles, manage working shifts, and track attendance. View performance summaries per employee.
Finance & Billing	View total revenue, outstanding invoices, and daily/monthly financial summaries. Record operational expenses and generate tax reports.
Service Catalogue	Define the list of services the garage offers, set standard prices, and categorise service types (e.g. mechanical, electrical, body work).
Reports & Exports	Generate printable or downloadable reports (PDF/Excel) covering jobs, revenue, customer history, and staff performance across any date range.
System Settings	Configure garage details, manage user roles and permissions, set up notification preferences, and manage data backups.

4.2  Mechanic
Mechanics have a focused, task-oriented interface. They can only access information relevant to their assigned jobs and do not have visibility into financial or administrative data.

Module / Feature	Description
Job Card / Work Order	View all job cards assigned to them. Each card shows the vehicle details, customer notes, requested service, and current status. Mechanics can update the job status (e.g. In Progress, Awaiting Parts, Complete).
Inspection & Diagnosis	Record findings from vehicle inspection including observed faults, recommended repairs, and supporting photos. These notes are visible to the front desk and admin.
Parts Request	Submit requests for parts needed to complete a job. The request is routed to admin for approval and fulfilment.
Labour Logging	Log time spent on each job to support accurate billing. Entries include start time, end time, and a brief description of work performed.
Vehicle History	View the full service history of a vehicle currently in the workshop, including previous jobs, reported faults, and parts replaced.
Job Completion & Sign-off	Mark a job as complete and submit it for quality check. Add final notes or recommendations for the customer (e.g. parts that should be replaced at next service).

4.3  Front Desk
The Front Desk role handles all customer-facing interactions, from booking through to payment. This role has access to customer and vehicle data but not to financial management or staff administration.

Module / Feature	Description
Customer Management	Register new customers with their contact details. Search and view existing customer profiles, including their vehicle(s) and service history.
Appointment Booking	Schedule service appointments by date and time. View the daily/weekly appointment calendar. Reschedule or cancel bookings with automated notifications.
Vehicle Check-in / Check-out	Log a vehicle on arrival by capturing make, model, registration plate, current odometer reading, and condition photos. Mark vehicle as collected on departure.
Invoice Generation	Generate itemised invoices for completed jobs. Invoices include labour charges, service fees, and applicable taxes. Can be printed or exported as PDF.
Payment Processing	Record payments received via cash, mobile money, or bank transfer. Issue receipts and update job status to Paid.
Customer Notifications	Send automated or manual alerts to customers via SMS or WhatsApp — including appointment reminders, job status updates, and collection notices.

4.4  Customer
The Customer role provides clients with a self-service portal to manage their own vehicles and service interactions. Customers only have access to their own data and cannot view other customers' records, financial data, or internal garage operations.

Module / Feature	Description
Account Registration & Profile	Create a personal account with name, contact details, and address. Update profile information and manage login credentials at any time.
Vehicle Management	Register one or more vehicles under the customer account. Each vehicle records the make, model, year, colour, and registration plate.
Appointment Booking	Browse available time slots and book a service appointment online. Select the vehicle, describe the issue or service required, and receive a booking confirmation.
Service Status Tracking	View the real-time status of a vehicle currently in the workshop (e.g. Checked In, Under Inspection, In Progress, Ready for Collection). Receive push or SMS notifications on status changes.
Service History	Access a full history of all past services for each registered vehicle, including dates, work performed, parts used, and mechanic notes or recommendations.
Invoice & Payment	View and download invoices for completed jobs. Make payments online via mobile money or card. View payment receipts and outstanding balances.
Feedback & Ratings	Submit a rating and optional comment after a service is completed. Feedback is visible to admin and helps monitor service quality.

5. Shared Core Modules
The following modules are shared across all roles and form the backbone of the system:

Module	Description
Vehicle Register	A central database of all vehicles serviced by the garage. Records make, model, year, colour, and registration plate. Linked to customer profiles and job history.
Work Order Lifecycle	The end-to-end workflow for a service job: Created (Front Desk) → Assigned (Admin) → In Progress (Mechanic) → Completed (Mechanic) → Invoiced (Front Desk) → Paid.
Authentication & Access Control	Secure login for all users. Role-based permissions ensure each user only sees and interacts with data relevant to their role. Supports password reset and session management.
Audit Trail	Every action in the system (creating a job, updating a status, generating an invoice) is logged with the user's name, timestamp, and a description of the change.
In-App Notifications	Internal alerts to notify users of actions that require their attention — e.g. a mechanic is notified when a job is assigned to them; admin is alerted when a job is marked complete.
Supplier & Parts Procurement	Maintain a list of supplier contacts, raise purchase orders for parts, and track order status. Reorder alerts can be configured to flag when stock falls below a set threshold.

6. Suggested Development Phases
To manage delivery risk and allow for early testing and feedback, development is proposed in four phases:

Phase	Focus	Key Deliverables
Phase 1	Core Loop	Authentication, vehicle register, work order creation, front desk check-in/check-out, basic job card view for mechanics.
Phase 2	Operations	Labour logging, parts requests, invoice generation, payment processing, customer notifications.
Phase 3	Intelligence	Admin dashboard & analytics, full reporting/exports, in-app notifications, complete audit trail.
Phase 4	Customer Portal & Extras	Customer self-service portal (registration, booking, tracking, invoices, payments, feedback), supplier & procurement module, SMS/WhatsApp integration.

7. Approval
Please review this document and indicate your approval by signing below. Any amendments or feedback should be noted before the document is finalised and development commences.


Approved by:

Name & Signature	Date:

DD / MM / YYYY


Comments / Amendments:



