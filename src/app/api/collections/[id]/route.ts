import { requireUser } from "@/server/auth";
import { apiHandler, readJson } from "@/server/http";
import { deleteCollection, getCollection, updateCollection } from "@/server/services/collections";
import { collectionUpdateSchema } from "@/server/validation/collection";
import { echoListQuerySchema } from "@/server/validation/echo";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export const GET = apiHandler<Context>(async (request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const { page, limit, sort } = echoListQuerySchema.parse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  return Response.json(await getCollection(user.id, id, { page, limit, sort }));
});

export const PATCH = apiHandler<Context>(async (request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const patch = collectionUpdateSchema.parse(await readJson(request));
  return Response.json(await updateCollection(user.id, id, patch));
});

export const DELETE = apiHandler<Context>(async (_request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  await deleteCollection(user.id, id);
  return new Response(null, { status: 204 });
});
