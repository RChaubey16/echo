import { runAfterResponse } from "@/server/after-response";
import { forgetAnalyticsUser } from "@/server/analytics";
import { requireUser } from "@/server/auth";
import { AppError, apiHandler, readJson } from "@/server/http";
import { deleteAccount, revokeGoogleTokens } from "@/server/services/account";
import {
  DELETE_CONFIRMATION,
  accountDeleteSchema,
  isDeleteConfirmed,
} from "@/server/validation/user";

export const dynamic = "force-dynamic";

const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

export const DELETE = apiHandler(async (request) => {
  const user = await requireUser();
  const { confirm } = accountDeleteSchema.parse(await readJson(request));
  if (!isDeleteConfirmed(confirm, user.email)) {
    const message = `Type ${DELETE_CONFIRMATION} to confirm.`;
    throw new AppError("VALIDATION_ERROR", message, undefined, { confirm: [message] });
  }
  const tokens = await deleteAccount(user.id);
  runAfterResponse(() => revokeGoogleTokens(tokens));
  forgetAnalyticsUser(user.id);

  const response = new Response(null, { status: 204 });
  for (const name of SESSION_COOKIES) {
    const secure = name.startsWith("__Secure-") ? "; Secure" : "";
    response.headers.append(
      "set-cookie",
      `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`,
    );
  }
  return response;
});
