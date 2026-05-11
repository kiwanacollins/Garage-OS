import type { FastifyPluginAsync } from "fastify";
import multipart from "@fastify/multipart";
import { uploadPurposeSchema } from "@garage-os/validation";
import { requireRoles } from "../middleware/rbac.js";

const allowedImageTypes = new Set(["image/jpeg", "image/png"]);
const uploaderRoles = {
  preHandler: requireRoles("admin", "front_desk", "mechanic"),
};

function canUploadPurpose(role: string | undefined, purpose: string) {
  if (role === "admin") {
    return true;
  }

  if (purpose === "check-in-condition") {
    return role === "front_desk";
  }

  if (purpose === "inspection-photo") {
    return role === "mechanic";
  }

  return false;
}

export const uploadRoutes: FastifyPluginAsync = async (app) => {
  await app.register(multipart, {
    limits: {
      files: 10,
      fileSize: app.deps.uploadMaxBytes,
    },
  });

  app.post("/uploads/:purpose", uploaderRoles, async (request, reply) => {
    const parsed = uploadPurposeSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.badRequest("Invalid upload purpose");
    }
    if (!canUploadPurpose(request.user?.role, parsed.data.purpose)) {
      return reply.forbidden("You cannot upload files for this workflow");
    }

    const uploads = [];

    try {
      for await (const file of request.files()) {
        if (!allowedImageTypes.has(file.mimetype)) {
          file.file.resume();
          return reply.badRequest("Unsupported upload MIME type");
        }

        const buffer = await file.toBuffer();
        if (buffer.byteLength > (app.deps.uploadMaxBytes ?? 10 * 1024 * 1024)) {
          return reply
            .code(413)
            .send({
              statusCode: 413,
              error: "Payload Too Large",
              message: "Upload exceeds configured size limit",
            });
        }

        const uploaded = await app.deps.uploadStorage?.putObject({
          purpose: parsed.data.purpose,
          filename: file.filename,
          mimetype: file.mimetype,
          buffer,
        });
        if (!uploaded) {
          return reply.badGateway("Upload storage adapter is not configured");
        }

        uploads.push(uploaded);
      }
    } catch (error) {
      if ((error as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE") {
        return reply
          .code(413)
          .send({
            statusCode: 413,
            error: "Payload Too Large",
            message: "Upload exceeds configured size limit",
          });
      }

      request.log.error({ err: error }, "Upload storage failed");
      return reply.badGateway("Upload storage failed");
    }

    if (!uploads.length) {
      return reply.badRequest("At least one image file is required");
    }

    return reply.code(201).send({
      uploads,
      tempFilesDeleted: true,
    });
  });
};
