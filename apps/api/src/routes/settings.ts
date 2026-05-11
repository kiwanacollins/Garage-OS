import type { FastifyPluginAsync } from "fastify";
import {
  systemSettingsSchema,
  updateSystemSettingsSchema,
} from "@garage-os/validation";
import type { SystemSettingsInput } from "@garage-os/validation";
import { requireRoles } from "../middleware/rbac.js";

const adminOnly = { preHandler: requireRoles("admin") };
const settingsKey = "garage-os";

export const defaultSystemSettings: SystemSettingsInput = {
  garage: {
    name: "GarageOS Service Centre",
    phone: "+256700000000",
    email: "frontdesk@garageos.local",
    address: "Kampala, Uganda",
    logoUrl: undefined,
  },
  tax: {
    vatRate: 18,
    tin: "",
    invoicePrefix: "GOS",
  },
  notifications: {
    appointmentReminders: true,
    invoiceAlerts: true,
    preferredChannels: ["in_app", "sms"],
  },
  backups: {
    enabled: true,
    retentionDays: 30,
    runAt: "02:00",
  },
};

function mergeSettings(
  update: unknown,
  current: SystemSettingsInput = defaultSystemSettings,
) {
  const parsed = updateSystemSettingsSchema.parse(update);
  return systemSettingsSchema.parse({
    garage: { ...current.garage, ...parsed.garage },
    tax: { ...current.tax, ...parsed.tax },
    notifications: { ...current.notifications, ...parsed.notifications },
    backups: { ...current.backups, ...parsed.backups },
  });
}

export const settingsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/settings", adminOnly, async () => {
    const row = await app.deps.prisma.systemSetting.findUnique({
      where: { key: settingsKey },
    });
    const settings = row?.value
      ? systemSettingsSchema.parse(row.value)
      : defaultSystemSettings;

    return { settings };
  });

  app.patch("/settings", adminOnly, async (request, reply) => {
    const parsed = updateSystemSettingsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest("Invalid system settings input");
    }

    const currentRow = await app.deps.prisma.systemSetting.findUnique({
      where: { key: settingsKey },
    });
    const current = currentRow?.value
      ? systemSettingsSchema.parse(currentRow.value)
      : defaultSystemSettings;
    const settings = mergeSettings(parsed.data, current);
    const row = await app.deps.prisma.systemSetting.upsert({
      where: { key: settingsKey },
      create: {
        key: settingsKey,
        value: settings,
        updatedById: request.user?.id,
      },
      update: { value: settings, updatedById: request.user?.id },
    });

    return { settings: row.value ?? settings };
  });
};
