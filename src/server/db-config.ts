import type { PoolConfig } from "pg";

/**
 * Builds node-postgres pool options from a connection URL, verifying TLS against a pinned CA.
 *
 * pg lets URL parameters override the `ssl` option, and treats `sslmode=require` as full
 * verification against Node's default roots, so `sslmode` is moved out of the URL and into an
 * explicit `ssl` config. Supabase's `connection_limit` becomes the pool size; `pgbouncer` is
 * dropped because the driver adapter already uses unnamed statements.
 *
 * @param connectionString - The database URL, e.g. DATABASE_URL.
 * @param ca - The PEM certificate authority used to verify the server when TLS is requested.
 * @returns Options for a pg Pool.
 */
export function pgPoolConfig(connectionString: string, ca: string): PoolConfig {
  const url = new URL(connectionString);
  const sslmode = url.searchParams.get("sslmode");
  const connectionLimit = url.searchParams.get("connection_limit");
  for (const param of ["sslmode", "pgbouncer", "connection_limit"]) url.searchParams.delete(param);

  const config: PoolConfig = { connectionString: url.toString() };
  if (sslmode && sslmode !== "disable") config.ssl = { ca, rejectUnauthorized: true };
  if (connectionLimit) config.max = Number.parseInt(connectionLimit, 10);
  return config;
}
