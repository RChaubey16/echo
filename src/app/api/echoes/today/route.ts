import { requireUser } from "@/server/auth";
import { apiHandler } from "@/server/http";
import { getTodaysEcho } from "@/server/services/discovery";

export const dynamic = "force-dynamic";

export const GET = apiHandler(async () => {
  const user = await requireUser();
  const today = await getTodaysEcho(user.id, { timeZone: user.timezone ?? "UTC" });
  return Response.json(today ?? { echo: null });
});
