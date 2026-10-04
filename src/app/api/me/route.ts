import { requireUser } from "@/server/auth";
import { apiHandler, readJson } from "@/server/http";
import { updateMe } from "@/server/services/users";
import { userUpdateSchema } from "@/server/validation/user";

export const dynamic = "force-dynamic";

export const GET = apiHandler(async () => {
  const user = await requireUser();
  return Response.json({ user });
});

export const PATCH = apiHandler(async (request) => {
  const user = await requireUser();
  const patch = userUpdateSchema.parse(await readJson(request));
  return Response.json(await updateMe(user.id, patch));
});
