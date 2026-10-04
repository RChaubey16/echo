import { track } from "@/server/analytics";
import { requireUser } from "@/server/auth";
import { apiHandler } from "@/server/http";
import { searchEchoes } from "@/server/services/search";
import { searchQuerySchema } from "@/server/validation/echo";

export const dynamic = "force-dynamic";

export const GET = apiHandler(
  async (request) => {
    const user = await requireUser();
    const query = searchQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const results = await searchEchoes(user.id, query);
    if (query.q && query.page === 1)
      track(user.id, "search_performed", { resultCount: results.total });
    return Response.json(results);
  },
  { rateLimit: "search" },
);
