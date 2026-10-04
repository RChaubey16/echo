import { requireUser } from "@/server/auth";
import { apiHandler, readJson } from "@/server/http";
import { createRevisit, listRevisits } from "@/server/services/revisits";
import { revisitCreateSchema, revisitListQuerySchema } from "@/server/validation/revisit";

export const dynamic = "force-dynamic";

export const POST = apiHandler(async (request) => {
  const user = await requireUser();
  const input = revisitCreateSchema.parse(await readJson(request));
  return Response.json(await createRevisit(user.id, input), { status: 201 });
});

export const GET = apiHandler(async (request) => {
  const user = await requireUser();
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const { status } = revisitListQuerySchema.parse(params);
  return Response.json({ items: await listRevisits(user.id, status) });
});
