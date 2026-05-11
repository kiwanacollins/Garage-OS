import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";
import { signJwt } from "../lib/jwt.js";

const secrets = {
  jwtSecret: "test-access-secret",
  refreshTokenSecret: "test-refresh-secret",
};

function tokenFor(role: string, id = `${role}-1`) {
  return signJwt(
    { sub: id, email: `${role}@example.com`, role, tokenType: "access" },
    secrets.jwtSecret,
    60,
  );
}

function createPrismaMock() {
  return {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    customerProfile: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    vehicle: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workOrder: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    appointment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    invoice: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    payment: { findMany: vi.fn(), create: vi.fn() },
    pesapalTransaction: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    feedback: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    inspection: { create: vi.fn(), update: vi.fn() },
    labourLog: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    partsRequest: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    expense: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    service: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    supplier: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    purchaseOrder: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    attendance: { findMany: vi.fn(), create: vi.fn() },
    auditLog: { findMany: vi.fn(), create: vi.fn() },
    systemSetting: { findUnique: vi.fn(), upsert: vi.fn() },
    notification: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  };
}

function multipartPayload(input: {
  filename: string;
  mimetype: string;
  content: Buffer;
}) {
  const boundary = "----garageos-upload-test";
  const head = Buffer.from(
    [
      `--${boundary}`,
      `Content-Disposition: form-data; name="file"; filename="${input.filename}"`,
      `Content-Type: ${input.mimetype}`,
      "",
      "",
    ].join("\r\n"),
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);

  return {
    payload: Buffer.concat([head, input.content, tail]),
    headers: {
      "content-type": `multipart/form-data; boundary=${boundary}`,
    },
  };
}

describe("upload routes", () => {
  let app: FastifyInstance;
  let prisma: ReturnType<typeof createPrismaMock>;
  let uploadStorage: { putObject: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    prisma = createPrismaMock();
    uploadStorage = {
      putObject: vi.fn().mockResolvedValue({
        objectKey: "inspection-photo/photo-1.jpg",
        objectUrl: "https://objects.example.com/inspection-photo/photo-1.jpg",
        size: 4,
        mimetype: "image/jpeg",
      }),
    };
    app = await buildApp({
      prisma: prisma as never,
      mailer: { sendMail: vi.fn() },
      uploadStorage,
      uploadMaxBytes: 1024,
      ...secrets,
    });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("accepts JPEG/PNG uploads and stores them through the object storage adapter", async () => {
    const body = multipartPayload({
      filename: "brake.jpg",
      mimetype: "image/jpeg",
      content: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/uploads/inspection-photo",
      headers: {
        authorization: `Bearer ${tokenFor("mechanic")}`,
        ...body.headers,
      },
      payload: body.payload,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().uploads[0]).toMatchObject({
      objectUrl: "https://objects.example.com/inspection-photo/photo-1.jpg",
      mimetype: "image/jpeg",
    });
    expect(response.json().tempFilesDeleted).toBe(true);
    expect(uploadStorage.putObject).toHaveBeenCalledWith(
      expect.objectContaining({
        purpose: "inspection-photo",
        filename: "brake.jpg",
        mimetype: "image/jpeg",
      }),
    );
  });

  it("rejects invalid MIME types and oversized files", async () => {
    const invalid = multipartPayload({
      filename: "notes.txt",
      mimetype: "text/plain",
      content: Buffer.from("not an image"),
    });
    const invalidResponse = await app.inject({
      method: "POST",
      url: "/api/v1/uploads/inspection-photo",
      headers: {
        authorization: `Bearer ${tokenFor("mechanic")}`,
        ...invalid.headers,
      },
      payload: invalid.payload,
    });

    await app.close();
    app = await buildApp({
      prisma: prisma as never,
      mailer: { sendMail: vi.fn() },
      uploadStorage,
      uploadMaxBytes: 4,
      ...secrets,
    });
    await app.ready();

    const oversized = multipartPayload({
      filename: "large.png",
      mimetype: "image/png",
      content: Buffer.from("too large"),
    });
    const oversizedResponse = await app.inject({
      method: "POST",
      url: "/api/v1/uploads/inspection-photo",
      headers: {
        authorization: `Bearer ${tokenFor("mechanic")}`,
        ...oversized.headers,
      },
      payload: oversized.payload,
    });

    expect(invalidResponse.statusCode).toBe(400);
    expect(oversizedResponse.statusCode).toBe(413);
  });

  it("returns 502 when storage fails", async () => {
    uploadStorage.putObject.mockRejectedValueOnce(new Error("storage offline"));
    const body = multipartPayload({
      filename: "bay.png",
      mimetype: "image/png",
      content: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/uploads/check-in-condition",
      headers: {
        authorization: `Bearer ${tokenFor("front_desk")}`,
        ...body.headers,
      },
      payload: body.payload,
    });

    expect(response.statusCode).toBe(502);
  });
});
