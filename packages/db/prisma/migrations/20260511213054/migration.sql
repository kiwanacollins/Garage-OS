-- AlterTable
ALTER TABLE "appointments" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "attendance" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "audit_logs" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "customer_profiles" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "expenses" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "feedbacks" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "inspections" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "labour_logs" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "notifications" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "parts_requests" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "purchase_orders" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "services" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "suppliers" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "vehicles" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "work_orders" ALTER COLUMN "id" DROP DEFAULT;
