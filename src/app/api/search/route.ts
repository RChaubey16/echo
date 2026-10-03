import { requireUser } from "@/server/auth";
import { apiHandler } from "@/server/http";
import { searchEchoes } from "@/server/services/search";
import { searchQuerySchema } from "@/server/validation/echo";

export const dynamic = "force-dynamic";

export const GET = apiHandler(async (request) => {
  const user = await requireUser();
  const query = searchQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return Response.json(await searchEchoes(user.id, query));
});
