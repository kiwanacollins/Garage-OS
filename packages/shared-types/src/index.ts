// ─── Role Enums ────────────────────────────────────────────────────────────────

export enum UserRole {
  ADMIN = 'admin',
  MECHANIC = 'mechanic',
  FRONT_DESK = 'front_desk',
  CUSTOMER = 'customer',
}

// ─── Work Order Status (State Machine) ─────────────────────────────────────────

export enum WorkOrderStatus {
  CREATED = 'created',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  AWAITING_PARTS = 'awaiting_parts',
  COMPLETED = 'completed',
  QUALITY_CHECK = 'quality_check',
  INVOICED = 'invoiced',
  PAID = 'paid',
  COLLECTED = 'collected',
}

/** Valid state transitions for the work order lifecycle */
export const WORK_ORDER_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  [WorkOrderStatus.CREATED]: [WorkOrderStatus.ASSIGNED],
  [WorkOrderStatus.ASSIGNED]: [WorkOrderStatus.IN_PROGRESS],
  [WorkOrderStatus.IN_PROGRESS]: [WorkOrderStatus.AWAITING_PARTS, WorkOrderStatus.COMPLETED],
  [WorkOrderStatus.AWAITING_PARTS]: [WorkOrderStatus.IN_PROGRESS],
  [WorkOrderStatus.COMPLETED]: [WorkOrderStatus.QUALITY_CHECK],
  [WorkOrderStatus.QUALITY_CHECK]: [WorkOrderStatus.INVOICED],
  [WorkOrderStatus.INVOICED]: [WorkOrderStatus.PAID],
  [WorkOrderStatus.PAID]: [WorkOrderStatus.COLLECTED],
  [WorkOrderStatus.COLLECTED]: [],
};

// ─── Parts Request Status ──────────────────────────────────────────────────────

export enum PartsRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FULFILLED = 'fulfilled',
}

// ─── Invoice Status ────────────────────────────────────────────────────────────

export enum InvoiceStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

// ─── Payment Method ────────────────────────────────────────────────────────────

export enum PaymentMethod {
  CASH = 'cash',
  MOBILE_MONEY = 'mobile_money',
  BANK_TRANSFER = 'bank_transfer',
  CARD = 'card',
}

// ─── Appointment Status ────────────────────────────────────────────────────────

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}

// ─── Purchase Order Status ─────────────────────────────────────────────────────

export enum PurchaseOrderStatus {
  ORDERED = 'ordered',
  SHIPPED = 'shipped',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

// ─── Notification Channel ──────────────────────────────────────────────────────

export enum NotificationChannel {
  IN_APP = 'in_app',
  SMS = 'sms',
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
}

// ─── Base Entity Interfaces ────────────────────────────────────────────────────

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  name: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  address: string | null;
  preferredContact: string | null;
}

export interface Vehicle {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year: number;
  colour: string | null;
  registrationPlate: string;
  odometerReading: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrder extends BaseEntity {
  vehicleId: string;
  assignedMechanicId: string | null;
  createdById: string;
  status: WorkOrderStatus;
  customerNotes: string | null;
  mechanicNotes: string | null;
}

export interface Inspection {
  id: string;
  workOrderId: string;
  findings: string | null;
  recommendations: string | null;
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LabourLog {
  id: string;
  workOrderId: string;
  mechanicId: string;
  startTime: Date;
  endTime: Date | null;
  description: string | null;
}

export interface PartsRequest {
  id: string;
  workOrderId: string;
  requestedById: string;
  partName: string;
  quantity: number;
  status: PartsRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  workOrderId: string;
  labourTotal: number;
  partsTotal: number;
  tax: number;
  grandTotal: number;
  status: InvoiceStatus;
  issuedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  transactionRef: string | null;
  paidAt: Date;
}

export interface Appointment {
  id: string;
  customerId: string;
  vehicleId: string;
  scheduledAt: Date;
  issueDescription: string | null;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contactPhone: string | null;
  contactEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  partsRequestId: string;
  status: PurchaseOrderStatus;
  cost: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Feedback {
  id: string;
  workOrderId: string;
  customerId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  changes: Record<string, unknown> | null;
  createdAt: Date;
}

export interface Notification {
  id: string;
  recipientId: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
}
