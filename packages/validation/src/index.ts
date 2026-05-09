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

export const updateCustomerSchema = createCustomerSchema.partial();

// ─── Type Inference Helpers ────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
