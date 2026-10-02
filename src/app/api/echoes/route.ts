import { requireUser } from "@/server/auth";
import { apiHandler, readJson } from "@/server/http";
import { createEcho, listEchoes } from "@/server/services/echoes";
import { echoCreateSchema, echoListQuerySchema } from "@/server/validation/echo";

export const dynamic = "force-dynamic";

export const POST = apiHandler(async (request) => {
  const user = await requireUser();
  const input = echoCreateSchema.parse(await readJson(request));
  const echo = await createEcho(user.id, input);
  return Response.json(echo, { status: 201 });
});

export const GET = apiHandler(async (request) => {
  const user = await requireUser();
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const query = echoListQuerySchema.parse(params);
  return Response.json(await listEchoes(user.id, query));
});
