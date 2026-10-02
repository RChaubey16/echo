import { describe, expect, it } from "vitest";
import { pgPoolConfig } from "@/server/db-config";

const CA = "-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----\n";

describe("pgPoolConfig", () => {
  it("leaves a local URL without sslmode untouched and without TLS", () => {
    const config = pgPoolConfig("postgresql://echo:echo@localhost:5432/echo", CA);
    expect(config).toEqual({ connectionString: "postgresql://echo:echo@localhost:5432/echo" });
  });

  it("verifies the server against the given CA when sslmode asks for TLS", () => {
    const config = pgPoolConfig(
      "postgresql://u:p@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require",
      CA,
    );
    expect(config.ssl).toEqual({ ca: CA, rejectUnauthorized: true });
    // pg lets URL params override `ssl`, so sslmode must be removed from the string.
    expect(config.connectionString).not.toContain("sslmode");
  });

  it("maps Supabase's connection_limit to the pool size and drops pgbouncer", () => {
    const config = pgPoolConfig(
      "postgresql://u:p@host:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require",
      CA,
    );
    expect(config.max).toBe(1);
    expect(config.connectionString).toBe("postgresql://u:p@host:6543/postgres");
  });

  it("does not enable TLS for sslmode=disable", () => {
    const config = pgPoolConfig("postgresql://u:p@db:5432/echo?sslmode=disable", CA);
    expect(config.ssl).toBeUndefined();
    expect(config.connectionString).toBe("postgresql://u:p@db:5432/echo");
  });
});
