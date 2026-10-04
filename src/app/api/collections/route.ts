import { track } from "@/server/analytics";
import { requireUser } from "@/server/auth";
import { apiHandler, readJson } from "@/server/http";
import { createCollection, listCollections } from "@/server/services/collections";
import { collectionCreateSchema } from "@/server/validation/collection";

export const dynamic = "force-dynamic";

export const GET = apiHandler(async () => {
  const user = await requireUser();
  return Response.json({ items: await listCollections(user.id) });
});

export const POST = apiHandler(async (request) => {
  const user = await requireUser();
  const input = collectionCreateSchema.parse(await readJson(request));
  const collection = await createCollection(user.id, input);
  track(user.id, "collection_created");
  return Response.json(collection, { status: 201 });
});
