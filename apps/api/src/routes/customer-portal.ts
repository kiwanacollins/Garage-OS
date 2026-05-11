import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import {
  customerAppointmentSchema,
  updateAppointmentSchema,
  updateCustomerSchema,
} from "@garage-os/validation";
import { requireRoles } from "../middleware/rbac.js";

type CustomerProfileRecord = {
  id: string;
  userId: string;
  address: string | null;
  preferredContact: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  vehicles?: unknown[];
  appointments?: unknown[];
  feedbacks?: unknown[];
};

async function getCustomerProfile(
  app: Parameters<FastifyPluginAsync>[0],
  request: FastifyRequest,
) {
  return app.deps.prisma.customerProfile.findUnique({
    where: { userId: request.user?.id },
    include: {
      user: true,
      vehicles: true,
      appointments: true,
      feedbacks: true,
    },
  });
}

function publicProfile(profile: CustomerProfileRecord) {
  return {
    id: profile.id,
    userId: profile.userId,
    name: profile.user?.name,
    email: profile.user?.email,
    phone: profile.user?.phone,
    address: profile.address,
    preferredContact: profile.preferredContact,
    vehicles: profile.vehicles ?? [],
    appointments: profile.appointments ?? [],
    feedbacks: profile.feedbacks ?? [],
  };
}

async function requireProfile(
  app: Parameters<FastifyPluginAsync>[0],
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const profile = await getCustomerProfile(app, request);
  if (!profile) {
    reply.notFound("Customer profile was not found");
    return null;
  }

  return profile;
}

export const customerPortalRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireRoles("customer"));

  app.get("/profile", async (request, reply) => {
    const profile = await requireProfile(app, request, reply);
    if (!profile) {
      return reply;
    }

    return { customer: publicProfile(profile) };
  });

  app.patch("/profile", async (request, reply) => {
    const parsed = updateCustomerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest("Invalid customer profile input");
    }

    const profile = await requireProfile(app, request, reply);
    if (!profile) {
      return reply;
    }

    const updated = await app.deps.prisma.customerProfile.update({
      where: { id: profile.id },
      data: {
        address: parsed.data.address,
        preferredContact: parsed.data.preferredContact,
        user: {
          update: {
            name: parsed.data.name,
            email: parsed.data.email,
            phone: parsed.data.phone,
          },
        },
      },
      include: {
        user: true,
        vehicles: true,
        appointments: true,
        feedbacks: true,
      },
    });

    return { customer: publicProfile(updated) };
  });

  app.get("/portal", async (request, reply) => {
    const profile = await requireProfile(app, request, reply);
    if (!profile) {
      return reply;
    }

    const [workOrders, invoices] = await Promise.all([
      app.deps.prisma.workOrder.findMany({
        where: { vehicle: { customer: { userId: request.user?.id } } },
        include: {
          vehicle: true,
          inspection: true,
          labourLogs: true,
          partsRequests: true,
          invoice: { include: { payments: true } },
          feedback: true,
        },
        orderBy: { updatedAt: "desc" },
      }),
      app.deps.prisma.invoice.findMany({
        where: {
          workOrder: { vehicle: { customer: { userId: request.user?.id } } },
        },
        include: {
          payments: true,
          workOrder: { include: { vehicle: true, feedback: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      customer: publicProfile(profile),
      vehicles: profile.vehicles ?? [],
      appointments: profile.appointments ?? [],
      workOrders,
      invoices,
    };
  });

  app.get("/appointments", async (request, reply) => {
    const profile = await requireProfile(app, request, reply);
    if (!profile) {
      return reply;
    }

    const appointments = await app.deps.prisma.appointment.findMany({
      where: { customerId: profile.id },
      include: { vehicle: true },
      orderBy: { scheduledAt: "asc" },
    });

    return { appointments };
  });

  app.post("/appointments", async (request, reply) => {
    const parsed = customerAppointmentSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest("Invalid appointment input");
    }

    const profile = await requireProfile(app, request, reply);
    if (!profile) {
      return reply;
    }

    const vehicle = await app.deps.prisma.vehicle.findUnique({
      where: { id: parsed.data.vehicleId },
      include: { customer: { include: { user: true } } },
    });
    if (!vehicle || vehicle.customer?.userId !== request.user?.id) {
      return reply.forbidden("You cannot book appointments for this vehicle");
    }

    const appointment = await app.deps.prisma.appointment.create({
      data: {
        customerId: profile.id,
        vehicleId: parsed.data.vehicleId,
        scheduledAt: new Date(parsed.data.scheduledAt),
        issueDescription: parsed.data.issueDescription,
      },
      include: { vehicle: true },
    });

    return reply.code(201).send({ appointment });
  });

  app.patch("/appointments/:id", async (request, reply) => {
    const parsed = updateAppointmentSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest("Invalid appointment input");
    }

    const profile = await requireProfile(app, request, reply);
    if (!profile) {
      return reply;
    }

    const existing = await app.deps.prisma.appointment.findUnique({
      where: { id: (request.params as { id: string }).id },
    });
    if (!existing || existing.customerId !== profile.id) {
      return reply.forbidden("You cannot manage this appointment");
    }

    const appointment = await app.deps.prisma.appointment.update({
      where: { id: existing.id },
      data: {
        scheduledAt: parsed.data.scheduledAt
          ? new Date(parsed.data.scheduledAt)
          : undefined,
        issueDescription: parsed.data.issueDescription,
        status: parsed.data.status,
      },
      include: { vehicle: true },
    });

    return { appointment };
  });

  app.delete("/appointments/:id", async (request, reply) => {
    const profile = await requireProfile(app, request, reply);
    if (!profile) {
      return reply;
    }

    const existing = await app.deps.prisma.appointment.findUnique({
      where: { id: (request.params as { id: string }).id },
    });
    if (!existing || existing.customerId !== profile.id) {
      return reply.forbidden("You cannot manage this appointment");
    }

    await app.deps.prisma.appointment.delete({ where: { id: existing.id } });
    return reply.code(204).send();
  });

  app.get("/invoices", async (request) => {
    const invoices = await app.deps.prisma.invoice.findMany({
      where: {
        workOrder: { vehicle: { customer: { userId: request.user?.id } } },
      },
      include: { payments: true, workOrder: { include: { vehicle: true } } },
      orderBy: { createdAt: "desc" },
    });

    return { invoices };
  });
};
