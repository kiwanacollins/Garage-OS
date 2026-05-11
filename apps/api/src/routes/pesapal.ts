import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { pesapalInitiateSchema, pesapalIpnSchema } from "@garage-os/validation";
import { InvoiceStatus, PaymentMethod } from "@garage-os/shared-types";
import { requireRoles } from "../middleware/rbac.js";

type InvoiceForPayment = {
  id: string;
  grandTotal: unknown;
  status: string;
  workOrderId: string;
  payments?: Array<{ amount: unknown }>;
  workOrder?: {
    vehicle?: {
      registrationPlate?: string;
      customer?: {
        userId: string;
        user?: {
          name: string;
          email: string;
          phone: string | null;
        };
      };
    };
  };
};

function moneyNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    "toNumber" in value &&
    typeof value.toNumber === "function"
  ) {
    return value.toNumber();
  }

  return Number(value ?? 0);
}

function outstandingAmount(invoice: InvoiceForPayment) {
  const paid = (invoice.payments ?? []).reduce(
    (total, payment) => total + moneyNumber(payment.amount),
    0,
  );
  return Math.max(moneyNumber(invoice.grandTotal) - paid, 0);
}

function ownsInvoice(
  request: FastifyRequest,
  invoice: InvoiceForPayment | null,
) {
  return invoice?.workOrder?.vehicle?.customer?.userId === request.user?.id;
}

async function submitPesapalOrder(invoice: InvoiceForPayment, amount: number) {
  const merchantReference = `GOS-${invoice.id}-${Date.now()}`;
  const mockTrackingId = `mock-${merchantReference}`;
  const mockRedirectUrl = `https://cybqa.pesapal.com/pesapalv3/mock/pay/${merchantReference}`;

  if (
    !process.env.PESAPAL_CONSUMER_KEY ||
    !process.env.PESAPAL_CONSUMER_SECRET
  ) {
    return {
      merchantReference,
      orderTrackingId: mockTrackingId,
      redirectUrl: mockRedirectUrl,
    };
  }

  const baseUrl =
    process.env.PESAPAL_BASE_URL ?? "https://pay.pesapal.com/v3/api";
  const authResponse = await fetch(`${baseUrl}/Auth/RequestToken`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }),
  });
  const auth = (await authResponse.json()) as { token?: string };
  if (!auth.token) {
    throw new Error("Pesapal authentication failed");
  }

  const customer = invoice.workOrder?.vehicle?.customer?.user;
  const response = await fetch(`${baseUrl}/Transactions/SubmitOrderRequest`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${auth.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      id: merchantReference,
      currency: "UGX",
      amount,
      description: `GarageOS invoice ${invoice.id}`,
      callback_url:
        process.env.PESAPAL_CALLBACK_URL ?? "http://localhost:3000/customer",
      notification_id: process.env.PESAPAL_NOTIFICATION_ID,
      billing_address: {
        email_address: customer?.email,
        phone_number: customer?.phone,
        first_name: customer?.name?.split(" ")[0] ?? "GarageOS",
        last_name: customer?.name?.split(" ").slice(1).join(" ") || "Customer",
      },
    }),
  });
  const result = (await response.json()) as {
    order_tracking_id?: string;
    redirect_url?: string;
  };

  if (!result.order_tracking_id || !result.redirect_url) {
    throw new Error("Pesapal order request failed");
  }

  return {
    merchantReference,
    orderTrackingId: result.order_tracking_id,
    redirectUrl: result.redirect_url,
  };
}

async function fetchPesapalStatus(
  orderTrackingId: string,
  mockStatus?: string,
) {
  if (
    mockStatus ||
    !process.env.PESAPAL_CONSUMER_KEY ||
    !process.env.PESAPAL_CONSUMER_SECRET
  ) {
    return {
      status: mockStatus ?? "pending",
      providerStatus: mockStatus ?? "pending",
    };
  }

  const baseUrl =
    process.env.PESAPAL_BASE_URL ?? "https://pay.pesapal.com/v3/api";
  const authResponse = await fetch(`${baseUrl}/Auth/RequestToken`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }),
  });
  const auth = (await authResponse.json()) as { token?: string };
  if (!auth.token) {
    throw new Error("Pesapal authentication failed");
  }

  const statusResponse = await fetch(
    `${baseUrl}/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
    { headers: { authorization: `Bearer ${auth.token}` } },
  );
  const status = (await statusResponse.json()) as {
    payment_status_description?: string;
    status_code?: number;
  };
  const description = status.payment_status_description?.toLowerCase();
  if (description === "completed" || status.status_code === 1) {
    return {
      status: "completed",
      providerStatus: status.payment_status_description ?? "completed",
    };
  }
  if (description === "failed" || status.status_code === 2) {
    return {
      status: "failed",
      providerStatus: status.payment_status_description ?? "failed",
    };
  }
  if (description === "cancelled") {
    return {
      status: "cancelled",
      providerStatus: status.payment_status_description,
    };
  }

  return {
    status: "pending",
    providerStatus: status.payment_status_description ?? "pending",
  };
}

export const pesapalRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/initiate",
    { preHandler: requireRoles("customer") },
    async (request, reply) => {
      const parsed = pesapalInitiateSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.badRequest("Invalid Pesapal payment input");
      }

      const invoice = await app.deps.prisma.invoice.findUnique({
        where: { id: parsed.data.invoiceId },
        include: {
          payments: true,
          workOrder: {
            include: {
              vehicle: { include: { customer: { include: { user: true } } } },
            },
          },
        },
      });
      if (!invoice) {
        return reply.notFound("Invoice was not found");
      }
      if (!ownsInvoice(request, invoice)) {
        return reply.forbidden("You cannot pay this invoice");
      }

      const amount = outstandingAmount(invoice);
      if (amount <= 0 || invoice.status === InvoiceStatus.PAID) {
        return reply.badRequest("Invoice is already paid");
      }

      const existing = await app.deps.prisma.pesapalTransaction.findMany({
        where: { invoiceId: invoice.id, status: "pending" },
        take: 1,
      });
      if (existing.length) {
        return {
          status: "pending",
          invoiceId: invoice.id,
          amount: moneyNumber(existing[0].amount),
          redirectUrl: existing[0].redirectUrl,
          orderTrackingId: existing[0].orderTrackingId,
          merchantReference: existing[0].merchantReference,
        };
      }

      const order = await submitPesapalOrder(invoice, amount);
      const transaction = await app.deps.prisma.pesapalTransaction.create({
        data: {
          invoiceId: invoice.id,
          merchantReference: order.merchantReference,
          orderTrackingId: order.orderTrackingId,
          redirectUrl: order.redirectUrl,
          amount,
          status: "pending",
        },
      });

      return reply.code(201).send({
        status: "pending",
        invoiceId: invoice.id,
        amount,
        redirectUrl: transaction.redirectUrl,
        orderTrackingId: transaction.orderTrackingId,
        merchantReference: transaction.merchantReference,
      });
    },
  );
};

export const pesapalIpnRoutes: FastifyPluginAsync = async (app) => {
  app.post("/ipn", async (request, reply) => {
    const parsed = pesapalIpnSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest("Invalid Pesapal IPN input");
    }

    const orderTrackingId =
      parsed.data.OrderTrackingId ?? parsed.data.orderTrackingId;
    const merchantReference =
      parsed.data.OrderMerchantReference ?? parsed.data.orderMerchantReference;
    const transaction = await app.deps.prisma.pesapalTransaction.findUnique({
      where: orderTrackingId ? { orderTrackingId } : { merchantReference },
      include: { invoice: true },
    });
    if (!transaction) {
      return reply.notFound("Pesapal transaction was not found");
    }

    const status = await fetchPesapalStatus(
      transaction.orderTrackingId,
      parsed.data.mockStatus,
    );
    const updated = await app.deps.prisma.pesapalTransaction.update({
      where: { id: transaction.id },
      data: {
        status: status.status,
        providerStatus: status.providerStatus,
      },
    });

    if (status.status === "completed") {
      const existingPayments = await app.deps.prisma.payment.findMany({
        where: { transactionRef: transaction.orderTrackingId },
      });
      if (!existingPayments.length) {
        await app.deps.prisma.payment.create({
          data: {
            invoiceId: transaction.invoiceId,
            amount: transaction.amount,
            method: PaymentMethod.CARD,
            transactionRef: transaction.orderTrackingId,
          },
        });
      }
      await app.deps.prisma.invoice.update({
        where: { id: transaction.invoiceId },
        data: { status: InvoiceStatus.PAID },
      });
    }

    return reply.code(200).send({
      status: updated.status,
      orderTrackingId: transaction.orderTrackingId,
      merchantReference: transaction.merchantReference,
    });
  });
};
