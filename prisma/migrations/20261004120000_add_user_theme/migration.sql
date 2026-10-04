-- AlterTable: additive and nullable, so older deployments keep working (expand only).
ALTER TABLE "users" ADD COLUMN "theme" VARCHAR(8);

-- Only the two saved choices are valid; NULL means "follow the system setting".
ALTER TABLE "users" ADD CONSTRAINT "users_theme_check" CHECK ("theme" IN ('light', 'dark'));
