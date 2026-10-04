-- AlterTable
ALTER TABLE "users" ADD COLUMN     "onboarded_at" TIMESTAMP(3),
ADD COLUMN     "timezone" VARCHAR(64);

-- CreateTable
CREATE TABLE "revisits" (
    "id" UUID NOT NULL,
    "echo_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revisits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_echoes" (
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "echo_id" UUID NOT NULL,

    CONSTRAINT "daily_echoes_pkey" PRIMARY KEY ("user_id","date")
);

-- CreateIndex
CREATE INDEX "revisits_user_id_completed_at_scheduled_for_idx" ON "revisits"("user_id", "completed_at", "scheduled_for");

-- CreateIndex
CREATE INDEX "revisits_echo_id_idx" ON "revisits"("echo_id");

-- CreateIndex
CREATE INDEX "daily_echoes_echo_id_idx" ON "daily_echoes"("echo_id");

-- AddForeignKey
ALTER TABLE "revisits" ADD CONSTRAINT "revisits_echo_id_fkey" FOREIGN KEY ("echo_id") REFERENCES "echoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisits" ADD CONSTRAINT "revisits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_echoes" ADD CONSTRAINT "daily_echoes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_echoes" ADD CONSTRAINT "daily_echoes_echo_id_fkey" FOREIGN KEY ("echo_id") REFERENCES "echoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- At most one pending Revisit per Echo; scheduling a new one replaces the pending one.
CREATE UNIQUE INDEX "revisits_echo_id_pending_key" ON "revisits"("echo_id") WHERE "completed_at" IS NULL;

-- No policies: Supabase's Data API roles (anon, authenticated) must see zero rows.
ALTER TABLE "revisits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "daily_echoes" ENABLE ROW LEVEL SECURITY;
