import { z } from "zod";

// ─── Re-exports from shared-types ──────────────────────────────────────────────

export {
  UserRole,
  WorkOrderStatus,
  PartsRequestStatus,
  InvoiceStatus,
  PaymentMethod,
  AppointmentStatus,
  PurchaseOrderStatus,
  NotificationChannel,
} from "@garage-os/shared-types";

// ─── Auth Schemas ──────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z
    .enum(["admin", "mechanic", "front_desk", "customer"])
    .optional()
    .default("customer"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "mechanic", "front_desk", "customer"]),
  isActive: z.boolean().optional().default(true),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    phone: z.string().nullable().optional(),
    role: z.enum(["admin", "mechanic", "front_desk", "customer"]).optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(8).optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required",
  );

export const updateMeSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().nullable().optional(),
    password: z.string().min(8).optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required",
  );

// ─── Vehicle Schemas ───────────────────────────────────────────────────────────

export const createVehicleSchema = z.object({
  customerId: z.string().uuid(),
  make: z.string().min(1, "Make is required").max(100),
  model: z.string().min(1, "Model is required").max(100),
  year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  colour: z.string().max(50).optional(),
  registrationPlate: z
    .string()
    .min(1, "Registration plate is required")
    .max(20),
  odometerReading: z.number().int().min(0).optional(),
});

export const updateVehicleSchema = createVehicleSchema
  .partial()
  .omit({ customerId: true });

// ─── Work Order Schemas ────────────────────────────────────────────────────────

export const createWorkOrderSchema = z.object({
  vehicleId: z.string().uuid(),
  customerNotes: z.string().max(2000).optional(),
});

export const workOrderSearchSchema = z.object({
  status: z
    .enum([
      "created",
      "assigned",
      "in_progress",
      "awaiting_parts",
      "completed",
      "quality_check",
      "invoiced",
      "paid",
      "collected",
    ])
    .optional(),
  mechanicId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const updateWorkOrderStatusSchema = z.object({
  status: z.enum([
    "created",
    "assigned",
    "in_progress",
    "awaiting_parts",
    "completed",
    "quality_check",
    "invoiced",
    "paid",
    "collected",
  ]),
});

export const assignMechanicSchema = z.object({
  mechanicId: z.string().uuid(),
});

export const checkInSchema = z.object({
  vehicleId: z.string().uuid(),
  odometerReading: z.number().int().min(0),
  customerNotes: z.string().max(2000).optional(),
  photos: z.array(z.string().url()).optional().default([]),
});

export const checkOutSchema = z.object({
  workOrderId: z.string().min(1),
  collectedBy: z.string().min(2).max(100).optional(),
});

export const createAppointmentSchema = z.object({
  customerId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  issueDescription: z.string().max(2000).optional(),
});

export const updateAppointmentSchema = z
  .object({
    scheduledAt: z.string().datetime().optional(),
    issueDescription: z.string().max(2000).optional(),
    status: z
      .enum(["scheduled", "confirmed", "cancelled", "completed", "no_show"])
      .optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required",
  );

export const availableSlotsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const createInvoiceSchema = z.object({
  workOrderId: z.string().min(1),
  labourTotal: z.number().min(0),
  partsTotal: z.number().min(0),
  tax: z.number().min(0).optional().default(0),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(["draft", "issued", "paid", "overdue", "cancelled"]),
});

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive(),
  method: z.enum(["cash", "mobile_money", "bank_transfer", "card"]),
  transactionRef: z.string().max(100).optional(),
});

export const pesapalInitiateSchema = z.object({
  invoiceId: z.string().min(1),
});

export const pesapalIpnSchema = z
  .object({
    OrderTrackingId: z.string().min(1).optional(),
    OrderMerchantReference: z.string().min(1).optional(),
    OrderNotificationType: z.string().min(1).optional(),
    orderTrackingId: z.string().min(1).optional(),
    orderMerchantReference: z.string().min(1).optional(),
    orderNotificationType: z.string().min(1).optional(),
    mockStatus: z
      .enum(["pending", "completed", "failed", "cancelled"])
      .optional(),
  })
  .refine(
    (value) =>
      Boolean(
        value.OrderTrackingId ??
        value.orderTrackingId ??
        value.OrderMerchantReference ??
        value.orderMerchantReference,
      ),
    "Pesapal IPN requires an order tracking id or merchant reference",
  );

export const createFeedbackSchema = z.object({
  workOrderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export const customerAppointmentSchema = z.object({
  vehicleId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  issueDescription: z.string().max(2000).optional(),
});

// ─── Notification Schemas ────────────────────────────────────────────────────

export const notificationSearchSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
  unreadOnly: z.coerce.boolean().optional().default(false),
});

export const manualNotificationSchema = z.object({
  customerId: z.string().min(1),
  channel: z.enum(["sms", "email", "whatsapp"]),
  title: z.string().min(1).max(200).optional().default("GarageOS update"),
  message: z.string().min(1).max(1000),
});

// ─── Mechanic Operation Schemas ───────────────────────────────────────────────

export const createInspectionSchema = z.object({
  workOrderId: z.string().min(1),
  findings: z.string().max(4000).optional(),
  recommendations: z.string().max(4000).optional(),
  photos: z.array(z.string().url()).optional().default([]),
});

export const updateInspectionSchema = z
  .object({
    findings: z.string().max(4000).optional(),
    recommendations: z.string().max(4000).optional(),
    photos: z.array(z.string().url()).optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required",
  );

export const createLabourLogSchema = z.object({
  workOrderId: z.string().min(1),
  description: z.string().max(1000).optional(),
  startTime: z.string().datetime().optional(),
});

export const updateLabourLogSchema = z
  .object({
    description: z.string().max(1000).optional(),
    endTime: z.string().datetime().optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required",
  );

export const createPartsRequestSchema = z.object({
  workOrderId: z.string().min(1),
  partName: z.string().min(1).max(200),
  quantity: z.number().int().min(1).optional().default(1),
});

export const updatePartsRequestStatusSchema = z.object({
  status: z.enum(["approved", "rejected", "fulfilled"]),
});

export const completeWorkOrderSchema = z.object({
  mechanicNotes: z.string().max(4000).optional(),
  recommendations: z.string().max(4000).optional(),
});

// ─── Admin Reporting and Staff Schemas ────────────────────────────────────────

export const reportDateRangeSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export const createExpenseSchema = z.object({
  category: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  amount: z.number().positive(),
  incurredAt: z.string().datetime().optional(),
});

export const updateExpenseSchema = createExpenseSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required",
  );

export const expenseSearchSchema = reportDateRangeSchema.extend({
  category: z.string().max(100).optional(),
});

export const createServiceSchema = z.object({
  name: z.string().min(1).max(160),
  category: z.string().min(1).max(100),
  price: z.number().min(0),
  isActive: z.boolean().optional().default(true),
});

export const updateServiceSchema = createServiceSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required",
  );

export const serviceSearchSchema = z.object({
  category: z.string().max(100).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const updateStaffShiftSchema = z.object({
  shift: z.string().min(1).max(100),
});

export const createAttendanceSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["present", "absent", "late"]),
  loggedAt: z.string().datetime().optional(),
});

export const reportExportSchema = z.object({
  type: z.enum(["revenue", "jobs", "staff-performance", "tax-summary"]),
  format: z.enum(["pdf", "excel"]),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// ─── Audit, Settings, Purchasing, and Upload Schemas ──────────────────────────

export const auditLogSearchSchema = z.object({
  entityType: z.string().max(100).optional(),
  entityId: z.string().optional(),
  userId: z.string().optional(),
  action: z.string().max(50).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const garageDetailsSettingsSchema = z.object({
  name: z.string().min(1).max(160),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
  address: z.string().max(500).optional(),
  logoUrl: z.string().url().optional(),
});

export const taxSettingsSchema = z.object({
  vatRate: z.number().min(0).max(100),
  tin: z.string().max(80).optional(),
  invoicePrefix: z.string().min(1).max(20),
});

export const notificationSettingsSchema = z.object({
  appointmentReminders: z.boolean(),
  invoiceAlerts: z.boolean(),
  preferredChannels: z
    .array(z.enum(["in_app", "sms", "email", "whatsapp"]))
    .min(1),
});

export const backupSettingsSchema = z.object({
  enabled: z.boolean(),
  retentionDays: z.number().int().min(1).max(365),
  runAt: z.string().regex(/^\d{2}:\d{2}$/),
});

export const systemSettingsSchema = z.object({
  garage: garageDetailsSettingsSchema,
  tax: taxSettingsSchema,
  notifications: notificationSettingsSchema,
  backups: backupSettingsSchema,
});

export const updateSystemSettingsSchema = z
  .object({
    garage: garageDetailsSettingsSchema.partial().optional(),
    tax: taxSettingsSchema.partial().optional(),
    notifications: notificationSettingsSchema.partial().optional(),
    backups: backupSettingsSchema.partial().optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one settings group is required",
  );

export const createSupplierSchema = z.object({
  name: z.string().min(1).max(200),
  contactPhone: z.string().max(20).optional(),
  contactEmail: z.string().email().optional(),
});

export const updateSupplierSchema = createSupplierSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required",
  );

export const supplierSearchSchema = z.object({
  q: z.string().max(100).optional(),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1),
  partsRequestId: z.string().min(1),
  cost: z.number().min(0).optional(),
});

export const updatePurchaseOrderSchema = z
  .object({
    supplierId: z.string().min(1).optional(),
    cost: z.number().min(0).nullable().optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required",
  );

export const updatePurchaseOrderStatusSchema = z.object({
  status: z.enum(["ordered", "shipped", "received", "cancelled"]),
});

export const uploadPurposeSchema = z.object({
  purpose: z.enum(["check-in-condition", "inspection-photo", "garage-logo"]),
});

// ─── Customer Schemas ──────────────────────────────────────────────────────────

export const createCustomerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().max(500).optional(),
  preferredContact: z.enum(["sms", "email", "whatsapp", "phone"]).optional(),
});

export const updateCustomerSchema = createCustomerSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required",
  );

export const customerSearchSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const vehicleSearchSchema = z.object({
  q: z.string().optional(),
  customerId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
});

// ─── Type Inference Helpers ────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
export type WorkOrderSearchInput = z.infer<typeof workOrderSearchSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type PesapalInitiateInput = z.infer<typeof pesapalInitiateSchema>;
export type PesapalIpnInput = z.infer<typeof pesapalIpnSchema>;
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type NotificationSearchInput = z.infer<typeof notificationSearchSchema>;
export type ManualNotificationInput = z.infer<typeof manualNotificationSchema>;
export type CreateInspectionInput = z.infer<typeof createInspectionSchema>;
export type CreateLabourLogInput = z.infer<typeof createLabourLogSchema>;
export type CreatePartsRequestInput = z.infer<typeof createPartsRequestSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type AuditLogSearchInput = z.infer<typeof auditLogSearchSchema>;
export type SystemSettingsInput = z.infer<typeof systemSettingsSchema>;
export type UpdateSystemSettingsInput = z.infer<
  typeof updateSystemSettingsSchema
>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type CreatePurchaseOrderInput = z.infer<
  typeof createPurchaseOrderSchema
>;
export type UpdatePurchaseOrderInput = z.infer<
  typeof updatePurchaseOrderSchema
>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerSearchInput = z.infer<typeof customerSearchSchema>;
export type VehicleSearchInput = z.infer<typeof vehicleSearchSchema>;
