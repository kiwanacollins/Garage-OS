import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  ObjectStorageAdapter,
  UploadedObject,
  UploadObjectInput,
} from "../types.js";

function safeExtension(filename: string, mimetype: string) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg" || ext === ".png") {
    return ext;
  }

  return mimetype === "image/png" ? ".png" : ".jpg";
}

export function createLocalObjectStorageAdapter(): ObjectStorageAdapter {
  const storageRoot =
    process.env.UPLOAD_STORAGE_DIR ??
    path.join(process.cwd(), "tmp", "uploads");
  const publicBaseUrl = process.env.UPLOAD_PUBLIC_BASE_URL ?? "/uploads";

  return {
    async putObject(input: UploadObjectInput): Promise<UploadedObject> {
      const ext = safeExtension(input.filename, input.mimetype);
      const objectKey = `${input.purpose}/${randomUUID()}${ext}`;
      const target = path.join(storageRoot, objectKey);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, input.buffer);

      return {
        objectKey,
        objectUrl: `${publicBaseUrl.replace(/\/$/, "")}/${objectKey}`,
        size: input.buffer.byteLength,
        mimetype: input.mimetype,
      };
    },
  };
}
