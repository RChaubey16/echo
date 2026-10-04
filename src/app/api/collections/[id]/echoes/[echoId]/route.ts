import { requireUser } from "@/server/auth";
import { apiHandler } from "@/server/http";
import { removeEchoFromCollection } from "@/server/services/collections";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string; echoId: string }> };

export const DELETE = apiHandler<Context>(async (_request, { params }) => {
  const user = await requireUser();
  const { id, echoId } = await params;
  return Response.json(await removeEchoFromCollection(user.id, id, echoId));
});
