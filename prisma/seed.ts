import "dotenv/config";

// Seeding is local-only. Refuse to run against anything but a local database.
const url = new URL(process.env.DATABASE_URL ?? "");
if (!["localhost", "127.0.0.1"].includes(url.hostname)) {
  throw new Error("db:seed only runs against a local database.");
}

// Phase 1 has no domain data to seed yet.
console.info("Nothing to seed in Phase 1.");
