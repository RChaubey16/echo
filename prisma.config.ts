import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// The CLI (migrate, studio) uses DIRECT_URL. Locally it is Docker Postgres;
// in CI and production it is the Supabase session pooler. The app itself
// connects through the driver adapter in src/server/db.ts using DATABASE_URL.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
