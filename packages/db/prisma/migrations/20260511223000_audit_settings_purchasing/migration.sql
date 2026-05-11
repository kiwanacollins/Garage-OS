-- Audit/settings cross-cutting support.

CREATE TABLE "system_settings" (
  "key" VARCHAR(80) NOT NULL,
  "value" JSONB NOT NULL,
  "updated_by" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);
