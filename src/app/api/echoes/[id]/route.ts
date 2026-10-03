import { requireUser } from "@/server/auth";
import { apiHandler, readJson } from "@/server/http";
import { getEcho, softDeleteEcho, updateEcho } from "@/server/services/echoes";
import { echoUpdateSchema } from "@/server/validation/echo";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export const GET = apiHandler<Context>(async (_request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  return Response.json(await getEcho(user.id, id));
});

export const PATCH = apiHandler<Context>(async (request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const patch = echoUpdateSchema.parse(await readJson(request));
  return Response.json(await updateEcho(user.id, id, patch));
});

export const DELETE = apiHandler<Context>(async (_request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  await softDeleteEcho(user.id, id);
  return new Response(null, { status: 204 });
});
