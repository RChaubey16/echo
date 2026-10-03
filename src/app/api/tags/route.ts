import { requireUser } from "@/server/auth";
import { apiHandler, readJson } from "@/server/http";
import { createTag, listTags } from "@/server/services/tags";
import { tagCreateSchema } from "@/server/validation/tag";

export const dynamic = "force-dynamic";

export const GET = apiHandler(async () => {
  const user = await requireUser();
  return Response.json({ items: await listTags(user.id) });
});

export const POST = apiHandler(async (request) => {
  const user = await requireUser();
  const { name } = tagCreateSchema.parse(await readJson(request));
  return Response.json(await createTag(user.id, name), { status: 201 });
});
