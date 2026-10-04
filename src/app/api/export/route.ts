import { z } from "zod";
import { requireUser } from "@/server/auth";
import { apiHandler } from "@/server/http";
import { EXPORT_FORMATS, exportResponse } from "@/server/services/export";

export const dynamic = "force-dynamic";

const exportQuerySchema = z.object({
  format: z.enum(EXPORT_FORMATS, { error: "Format must be json or csv." }).default("json"),
});

export const GET = apiHandler(
  async (request) => {
    const user = await requireUser();
    const { format } = exportQuerySchema.parse({
      format: new URL(request.url).searchParams.get("format") ?? undefined,
    });
    return exportResponse(user.id, format);
  },
  { rateLimit: "export" },
);
