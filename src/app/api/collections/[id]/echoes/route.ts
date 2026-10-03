import { requireUser } from "@/server/auth";
import { apiHandler, readJson } from "@/server/http";
import { addEchoToCollection } from "@/server/services/collections";
import { collectionEchoSchema } from "@/server/validation/collection";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export const POST = apiHandler<Context>(async (request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const { echoId } = collectionEchoSchema.parse(await readJson(request));
  return Response.json(await addEchoToCollection(user.id, id, echoId));
});
