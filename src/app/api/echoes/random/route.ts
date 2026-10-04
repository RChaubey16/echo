import { requireUser } from "@/server/auth";
import { apiHandler } from "@/server/http";
import { getRandomEcho } from "@/server/services/discovery";
import { randomQuerySchema } from "@/server/validation/echo";

export const dynamic = "force-dynamic";

export const GET = apiHandler(async (request) => {
  const user = await requireUser();
  const { exclude } = randomQuerySchema.parse({
    exclude: new URL(request.url).searchParams.get("exclude") ?? undefined,
  });
  return Response.json({ echo: await getRandomEcho(user.id, { exclude }) });
});
