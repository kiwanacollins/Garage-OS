import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { createFeedbackSchema } from "@garage-os/validation";

type WorkOrderForFeedback = {
  id: string;
  status: string;
  vehicle?: {
    customer?: {
      id: string;
      userId: string;
    };
  };
  feedback?: unknown;
};

function canManageFeedback(
  request: FastifyRequest,
  workOrder: WorkOrderForFeedback | null,
) {
  if (!workOrder) {
    return false;
  }

  if (request.user?.role === "admin" || request.user?.role === "front_desk") {
    return true;
  }

  return workOrder.vehicle?.customer?.userId === request.user?.id;
}

async function findFeedbackWorkOrder(
  app: Parameters<FastifyPluginAsync>[0],
  workOrderId: string,
) {
  return app.deps.prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: { vehicle: { include: { customer: true } }, feedback: true },
  });
}

async function authorizeFeedbackAccess(
  app: Parameters<FastifyPluginAsync>[0],
  request: FastifyRequest,
  reply: FastifyReply,
  workOrderId: string,
) {
  const workOrder = await findFeedbackWorkOrder(app, workOrderId);
  if (!workOrder) {
    reply.notFound("Work order was not found");
    return null;
  }

  if (!canManageFeedback(request, workOrder)) {
    reply.forbidden("You cannot access feedback for this work order");
    return null;
  }

  return workOrder;
}

export const feedbackRoutes: FastifyPluginAsync = async (app) => {
  app.post("/feedback", async (request, reply) => {
    const parsed = createFeedbackSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest("Invalid feedback input");
    }

    const workOrder = await authorizeFeedbackAccess(
      app,
      request,
      reply,
      parsed.data.workOrderId,
    );
    if (!workOrder) {
      return reply;
    }

    if (request.user?.role !== "customer") {
      return reply.forbidden("Only customers can submit service feedback");
    }

    if (
      !["completed", "quality_check", "invoiced", "paid", "collected"].includes(
        workOrder.status,
      )
    ) {
      return reply.badRequest("Feedback is available after service completion");
    }

    const feedback = await app.deps.prisma.feedback.create({
      data: {
        workOrderId: parsed.data.workOrderId,
        customerId: workOrder.vehicle.customer.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      },
    });

    return reply.code(201).send({ feedback });
  });

  app.get("/feedback/by-work-order/:id", async (request, reply) => {
    const workOrder = await authorizeFeedbackAccess(
      app,
      request,
      reply,
      (request.params as { id: string }).id,
    );
    if (!workOrder) {
      return reply;
    }

    const feedback =
      workOrder.feedback ??
      (await app.deps.prisma.feedback.findUnique({
        where: { workOrderId: workOrder.id },
      }));

    return { feedback };
  });
};
