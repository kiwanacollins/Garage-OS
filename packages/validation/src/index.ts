import { z } from 'zod';

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
} from '@garage-os/shared-types';

// ─── Auth Schemas ──────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'mechanic', 'front_desk', 'customer']).optional().default('customer'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'mechanic', 'front_desk', 'customer']),
  isActive: z.boolean().optional().default(true),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    phone: z.string().nullable().optional(),
    role: z.enum(['admin', 'mechanic', 'front_desk', 'customer']).optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(8).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export const updateMeSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().nullable().optional(),
    password: z.string().min(8).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');

// ─── Vehicle Schemas ───────────────────────────────────────────────────────────

export const createVehicleSchema = z.object({
  customerId: z.string().uuid(),
  make: z.string().min(1, 'Make is required').max(100),
  model: z.string().min(1, 'Model is required').max(100),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  colour: z.string().max(50).optional(),
  registrationPlate: z.string().min(1, 'Registration plate is required').max(20),
  odometerReading: z.number().int().min(0).optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial().omit({ customerId: true });

// ─── Work Order Schemas ────────────────────────────────────────────────────────

export const createWorkOrderSchema = z.object({
  vehicleId: z.string().uuid(),
  customerNotes: z.string().max(2000).optional(),
});

export const updateWorkOrderStatusSchema = z.object({
  status: z.enum([
    'created',
    'assigned',
    'in_progress',
    'awaiting_parts',
    'completed',
    'quality_check',
    'invoiced',
    'paid',
    'collected',
  ]),
});

export const assignMechanicSchema = z.object({
  mechanicId: z.string().uuid(),
});

// ─── Customer Schemas ──────────────────────────────────────────────────────────

export const createCustomerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().max(500).optional(),
  preferredContact: z.enum(['sms', 'email', 'whatsapp', 'phone']).optional(),
});

export const updateCustomerSchema = createCustomerSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');

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
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerSearchInput = z.infer<typeof customerSearchSchema>;
export type VehicleSearchInput = z.infer<typeof vehicleSearchSchema>;
