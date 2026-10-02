import { requireUser } from "@/server/auth";
import { apiHandler } from "@/server/http";

export const dynamic = "force-dynamic";

export const GET = apiHandler(async () => {
  const user = await requireUser();
  return Response.json({ user });
});
