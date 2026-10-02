import { db } from "@/server/db";
import { apiHandler } from "@/server/http";

export const dynamic = "force-dynamic";

export const GET = apiHandler(async () => {
  await db.$queryRaw`SELECT 1`;
  return Response.json({ ok: true });
});
