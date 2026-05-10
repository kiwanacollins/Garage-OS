-- Admin analytics, reporting, service catalogue, expenses, and attendance.

ALTER TABLE "users" ADD COLUMN "shift" VARCHAR(100);

CREATE TABLE "expenses" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "category" VARCHAR(100) NOT NULL,
  "description" VARCHAR(500),
  "amount" DECIMAL(12, 2) NOT NULL,
  "incurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "services" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(160) NOT NULL,
  "category" VARCHAR(100) NOT NULL,
  "price" DECIMAL(12, 2) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attendance" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "status" VARCHAR(30) NOT NULL,
  "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "expenses_category_idx" ON "expenses"("category");
CREATE INDEX "expenses_incurred_at_idx" ON "expenses"("incurred_at");
CREATE INDEX "services_category_idx" ON "services"("category");
CREATE INDEX "attendance_user_id_logged_at_idx" ON "attendance"("user_id", "logged_at");

ALTER TABLE "attendance"
  ADD CONSTRAINT "attendance_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
