import type { FastifyPluginAsync } from "fastify";
import {
  createPurchaseOrderSchema,
  createSupplierSchema,
  supplierSearchSchema,
  updatePurchaseOrderSchema,
  updatePurchaseOrderStatusSchema,
  updateSupplierSchema,
} from "@garage-os/validation";
import {
  PartsRequestStatus,
  PurchaseOrderStatus,
} from "@garage-os/shared-types";
import { requireRoles } from "../middleware/rbac.js";

const adminOnly = { preHandler: requireRoles("admin") };

const purchaseOrderTransitions: Record<string, string[]> = {
  [PurchaseOrderStatus.ORDERED]: [
    PurchaseOrderStatus.SHIPPED,
    PurchaseOrderStatus.CANCELLED,
  ],
  [PurchaseOrderStatus.SHIPPED]: [
    PurchaseOrderStatus.RECEIVED,
    PurchaseOrderStatus.CANCELLED,
  ],
  [PurchaseOrderStatus.RECEIVED]: [],
  [PurchaseOrderStatus.CANCELLED]: [],
};

export const purchasingRoutes: FastifyPluginAsync = async (app) => {
  app.get("/suppliers", adminOnly, async (request, reply) => {
    const parsed = supplierSearchSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.badRequest("Invalid supplier search");
    }

    const suppliers = await app.deps.prisma.supplier.findMany({
      where: parsed.data.q
        ? {
            name: {
              contains: parsed.data.q,
              mode: "insensitive",
            },
          }
        : undefined,
      include: { purchaseOrders: true },
      orderBy: { name: "asc" },
    });

    return { suppliers };
  });

  app.post("/suppliers", adminOnly, async (request, reply) => {
    const parsed = createSupplierSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest("Invalid supplier input");
    }

    const supplier = await app.deps.prisma.supplier.create({
      data: parsed.data,
      include: { purchaseOrders: true },
    });

    return reply.code(201).send({ supplier });
  });

  app.patch("/suppliers/:id", adminOnly, async (request, reply) => {
    const parsed = updateSupplierSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest("Invalid supplier input");
    }

    const supplier = await app.deps.prisma.supplier.update({
      where: { id: (request.params as { id: string }).id },
      data: parsed.data,
      include: { purchaseOrders: true },
    });

    return { supplier };
  });

  app.delete("/suppliers/:id", adminOnly, async (request, reply) => {
    await app.deps.prisma.supplier.delete({
      where: { id: (request.params as { id: string }).id },
    });
    return reply.code(204).send();
  });

  app.get("/purchase-orders", adminOnly, async () => {
    const purchaseOrders = await app.deps.prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        partsRequest: {
          include: { workOrder: { include: { vehicle: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { purchaseOrders };
  });

  app.post("/purchase-orders", adminOnly, async (request, reply) => {
    const parsed = createPurchaseOrderSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest("Invalid purchase order input");
    }

    const partsRequest = await app.deps.prisma.partsRequest.findUnique({
      where: { id: parsed.data.partsRequestId },
    });
    if (!partsRequest) {
      return reply.notFound("Parts request was not found");
    }
    if (partsRequest.status !== PartsRequestStatus.APPROVED) {
      return reply.badRequest(
        "Purchase orders can only be created from approved parts requests",
      );
    }

    const purchaseOrder = await app.deps.prisma.purchaseOrder.create({
      data: {
        supplierId: parsed.data.supplierId,
        partsRequestId: parsed.data.partsRequestId,
        cost: parsed.data.cost,
        status: PurchaseOrderStatus.ORDERED,
      },
      include: { supplier: true, partsRequest: true },
    });

    return reply.code(201).send({ purchaseOrder });
  });

  app.patch("/purchase-orders/:id", adminOnly, async (request, reply) => {
    const parsed = updatePurchaseOrderSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest("Invalid purchase order input");
    }

    const purchaseOrder = await app.deps.prisma.purchaseOrder.update({
      where: { id: (request.params as { id: string }).id },
      data: parsed.data,
      include: { supplier: true, partsRequest: true },
    });

    return { purchaseOrder };
  });

  app.patch(
    "/purchase-orders/:id/status",
    adminOnly,
    async (request, reply) => {
      const parsed = updatePurchaseOrderStatusSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.badRequest("Invalid purchase order status");
      }

      const existing = await app.deps.prisma.purchaseOrder.findUnique({
        where: { id: (request.params as { id: string }).id },
      });
      if (!existing) {
        return reply.notFound("Purchase order was not found");
      }

      const allowed = purchaseOrderTransitions[existing.status] ?? [];
      if (
        !allowed.includes(parsed.data.status) &&
        existing.status !== parsed.data.status
      ) {
        return reply.badRequest("Invalid purchase order status transition");
      }

      const purchaseOrder = await app.deps.prisma.purchaseOrder.update({
        where: { id: existing.id },
        data: { status: parsed.data.status },
        include: { supplier: true, partsRequest: true },
      });

      if (parsed.data.status === PurchaseOrderStatus.RECEIVED) {
        await app.deps.prisma.partsRequest.update({
          where: { id: purchaseOrder.partsRequestId },
          data: { status: PartsRequestStatus.FULFILLED },
        });
      }

      return { purchaseOrder };
    },
  );

  app.delete("/purchase-orders/:id", adminOnly, async (request, reply) => {
    await app.deps.prisma.purchaseOrder.delete({
      where: { id: (request.params as { id: string }).id },
    });
    return reply.code(204).send();
  });
};
