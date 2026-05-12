-- Customer portal online payment tracking for Pesapal.

CREATE TABLE "pesapal_transactions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "invoice_id" UUID NOT NULL,
  "merchant_reference" VARCHAR(120) NOT NULL,
  "order_tracking_id" VARCHAR(120) NOT NULL,
  "redirect_url" TEXT NOT NULL,
  "amount" DECIMAL(12, 2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'UGX',
  "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
  "provider_status" VARCHAR(100),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "pesapal_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pesapal_transactions_merchant_reference_key"
  ON "pesapal_transactions"("merchant_reference");

CREATE UNIQUE INDEX "pesapal_transactions_order_tracking_id_key"
  ON "pesapal_transactions"("order_tracking_id");

CREATE INDEX "pesapal_transactions_invoice_id_status_idx"
  ON "pesapal_transactions"("invoice_id", "status");

ALTER TABLE "pesapal_transactions"
  ADD CONSTRAINT "pesapal_transactions_invoice_id_fkey"
  FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable (moved here from 20260511213054 since the table is created in this migration)
ALTER TABLE "pesapal_transactions" ALTER COLUMN "id" DROP DEFAULT;
