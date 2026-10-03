-- Full-text search over Echoes. Prisma can't express tsvector columns, so this migration is
-- hand-written; the schema declares the column as Unsupported("tsvector").
--
-- The column is kept up to date by a trigger rather than GENERATED ALWAYS AS: Prisma can't model
-- generated columns and would emit a broken "DROP DEFAULT" in every later migration.
-- 'simple' config: quotes can be in any language, and English stemming would hurt recall.
ALTER TABLE "echoes" ADD COLUMN "search_vector" tsvector;

CREATE FUNCTION "echoes_search_vector_update"() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  NEW."search_vector" :=
    setweight(to_tsvector('simple', coalesce(NEW."quote", '')),      'A') ||
    setweight(to_tsvector('simple', coalesce(NEW."author", '')),     'B') ||
    setweight(to_tsvector('simple', coalesce(NEW."source", '')),     'C') ||
    setweight(to_tsvector('simple', coalesce(NEW."reflection", '')), 'B');
  RETURN NEW;
END $$;

CREATE TRIGGER "echoes_search_vector_trigger"
  BEFORE INSERT OR UPDATE OF "quote", "author", "source", "reflection" ON "echoes"
  FOR EACH ROW EXECUTE FUNCTION "echoes_search_vector_update"();

-- Backfill existing rows (the trigger fires because "quote" is in the SET list).
UPDATE "echoes" SET "quote" = "quote";

CREATE INDEX "echoes_search_idx" ON "echoes" USING GIN ("search_vector");

-- Partial-word / typo-tolerant fallback, also used for tag and collection names.
-- On Supabase pg_trgm may already live in the `extensions` schema, which is on the search_path.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "tags_name_trgm_idx" ON "tags" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "collections_name_trgm_idx" ON "collections" USING GIN ("name" gin_trgm_ops);
