import { beforeAll, describe, expect, it } from "vitest";
import { POST as postEcho } from "@/app/api/echoes/route";
import { GET as exportData } from "@/app/api/export/route";
import { CSV_COLUMNS, exportedEchoes } from "@/server/services/export";
import type { EchoDto } from "@/types/echo";
import { makeRequest } from "../helpers/request-context";
import { createTestUser, type TestUser } from "../helpers/session";

const ctx = {} as never;
let user: TestUser;
const created: EchoDto[] = [];

/**
 * Saves an Echo for the test user.
 *
 * @param body - The Echo fields.
 * @returns The created Echo.
 */
async function save(body: Record<string, unknown>): Promise<EchoDto> {
  const response = await postEcho(
    makeRequest("/api/echoes", {
      method: "POST",
      cookie: user.cookie,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    ctx,
  );
  expect(response.status).toBe(201);
  return (await response.json()) as EchoDto;
}

/**
 * Downloads the export in one format.
 *
 * @param format - "json" or "csv".
 * @returns The response.
 */
function download(format: string): Promise<Response> {
  return exportData(makeRequest(`/api/export?format=${format}`, { cookie: user.cookie }), ctx);
}

beforeAll(async () => {
  user = await createTestUser(process.env.DATABASE_URL!, {
    name: "Exporter",
    email: `exporter-${Date.now()}@example.com`,
  });
  created.push(
    await save({
      quote: "Begin anywhere.",
      author: "John Cage",
      reflection: "Maybe I should finally start.",
      tagNames: ["courage"],
      isFavorite: true,
    }),
  );
  created.push(
    await save({
      quote: '=HYPERLINK("http://evil.example","click")',
      author: "+cmd",
      source: "-1+1",
      reflection: '@SUM(A1)\nsecond line, with "quotes"',
    }),
  );
  created.push(await save({ quote: "Third, plain." }));
});

describe("GET /api/export", () => {
  it("rejects an unknown format", async () => {
    expect((await download("pdf")).status).toBe(400);
  });

  it("streams JSON in the spec §54 shape as an attachment", async () => {
    const response = await download("json");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-disposition")).toMatch(
      /^attachment; filename="echo-export-\d{4}-\d{2}-\d{2}\.json"$/,
    );

    const body = (await response.json()) as {
      exportedAt: string;
      account: Record<string, unknown>;
      collections: unknown[];
      tags: string[];
      echoes: Array<Record<string, unknown>>;
    };
    expect(Object.keys(body)).toEqual(["exportedAt", "account", "collections", "tags", "echoes"]);
    expect(body.account).toMatchObject({ email: user.user.email, name: "Exporter" });
    expect(body.tags).toEqual(["courage"]);
    expect(body.echoes.map((echo) => echo.id)).toEqual(created.map((echo) => echo.id));
    expect(Object.keys(body.echoes[0]!)).toMatchInlineSnapshot(`
      [
        "id",
        "quote",
        "author",
        "source",
        "reflection",
        "mood",
        "isFavorite",
        "favoritedAt",
        "tags",
        "collections",
        "revisits",
        "savedAt",
        "updatedAt",
      ]
    `);
    expect(body.echoes[0]).toMatchObject({
      quote: "Begin anywhere.",
      author: "John Cage",
      reflection: "Maybe I should finally start.",
      tags: ["courage"],
      collections: [],
      isFavorite: true,
    });
  });

  it("streams CSV with escaping and formula-injection guards", async () => {
    const response = await download("csv");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    const bytes = new Uint8Array(await response.arrayBuffer());
    // A UTF-8 byte-order mark, so Excel reads the file as UTF-8.
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const text = new TextDecoder().decode(bytes);
    const lines = text.split("\r\n");
    expect(lines[0]).toBe(CSV_COLUMNS.join(","));
    const evil = text.slice(text.indexOf(created[1]!.id));
    expect(evil).toContain(`"'=HYPERLINK(""http://evil.example"",""click"")"`);
    expect(evil).toContain(",'+cmd,'-1+1,");
    expect(evil).toContain(`"'@SUM(A1)\nsecond line, with ""quotes"""`);
    expect(text).toContain(",courage,");
  });

  it("pages through large libraries with a stable cursor", async () => {
    const ids: string[] = [];
    for await (const echo of exportedEchoes(user.user.id, 2)) ids.push(echo.id);
    expect(ids).toEqual(created.map((echo) => echo.id));
  });
});
