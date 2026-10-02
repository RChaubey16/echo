-- CreateTable
CREATE TABLE "echoes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "quote" TEXT NOT NULL,
    "author" VARCHAR(500),
    "source" VARCHAR(1000),
    "reflection" TEXT,
    "mood" VARCHAR(100),
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "favorited_at" TIMESTAMP(3),
    "last_surfaced_at" TIMESTAMP(3),
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "echoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "echoes_user_id_deleted_at_saved_at_idx" ON "echoes"("user_id", "deleted_at", "saved_at");

-- CreateIndex
CREATE INDEX "echoes_user_id_deleted_at_updated_at_idx" ON "echoes"("user_id", "deleted_at", "updated_at");

-- CreateIndex
CREATE INDEX "echoes_user_id_is_favorite_idx" ON "echoes"("user_id", "is_favorite");

-- AddForeignKey
ALTER TABLE "echoes" ADD CONSTRAINT "echoes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- No policies: Supabase's Data API roles (anon, authenticated) must see zero rows.
ALTER TABLE "echoes" ENABLE ROW LEVEL SECURITY;
