import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { DELETE as deleteEcho, PATCH as patchEcho } from "@/app/api/echoes/[id]/route";
import { GET as randomEcho } from "@/app/api/echoes/random/route";
import { POST as postEcho } from "@/app/api/echoes/route";
import { GET as todayEcho } from "@/app/api/echoes/today/route";
import { PATCH as patchMe } from "@/app/api/me/route";
import { DELETE as deleteRevisit, PATCH as patchRevisit } from "@/app/api/revisits/[id]/route";
import { GET as listRevisitsRoute, POST as postRevisit } from "@/app/api/revisits/route";
import { db } from "@/server/db";
import {
  getFromThePast,
  getLibraryCounts,
  getRandomEcho,
  getTodaysEcho,
} from "@/server/services/discovery";
import { listRevisits, updateRevisit } from "@/server/services/revisits";
import { shouldPromptFirstReflection } from "@/server/services/users";
import type { EchoDto, RevisitDto, RevisitWithEchoDto, TodaysEchoDto } from "@/types/echo";
import { makeRequest } from "../helpers/request-context";
import { createTestUser, type TestUser } from "../helpers/session";

const SECRET_QUOTE = "a quote only the discovery test should see, 9e1f";
const DAY = 24 * 60 * 60 * 1000;

const logLines: string[] = [];
const ctx = {} as never;
const idCtx = (id: string) => ({ params: Promise.resolve({ id }) });

function json(body: unknown, cookie: string, method = "POST"): RequestInit & { cookie: string } {
  return {
    method,
    cookie,
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  };
}

async function errorCode(response: Response): Promise<string> {
  return ((await response.json()) as { error: { code: string } }).error.code;
}

async function createEcho(user: TestUser, body: Record<string, unknown>): Promise<EchoDto> {
  const response = await postEcho(makeRequest("/api/echoes", json(body, user.cookie)), ctx);
  expect(response.status).toBe(201);
  return (await response.json()) as EchoDto;
}

/** Creates Echoes and back-dates them so each was saved `daysAgo` days before now. */
async function seedEchoes(user: TestUser, daysAgo: number[]): Promise<EchoDto[]> {
  const echoes: EchoDto[] = [];
  for (const [i, days] of daysAgo.entries()) {
    const echo = await createEcho(user, { quote: `Seeded ${i}` });
    await db.echo.update({
      where: { id: echo.id },
      data: { savedAt: new Date(Date.now() - days * DAY) },
    });
    echoes.push(echo);
  }
  return echoes;
}

async function getToday(user: TestUser): Promise<TodaysEchoDto | { echo: null }> {
  const response = await todayEcho(makeRequest("/api/echoes/today", { cookie: user.cookie }), ctx);
  expect(response.status).toBe(200);
  return (await response.json()) as TodaysEchoDto | { echo: null };
}

async function getRandom(user: TestUser, exclude: string[] = []): Promise<EchoDto | null> {
  const query = exclude.length ? `?exclude=${exclude.join(",")}` : "";
  const response = await randomEcho(
    makeRequest(`/api/echoes/random${query}`, { cookie: user.cookie }),
    ctx,
  );
  expect(response.status).toBe(200);
  return ((await response.json()) as { echo: EchoDto | null }).echo;
}

function inDays(days: number): string {
  return new Date(Date.now() + days * DAY).toISOString();
}

async function scheduleRevisit(user: TestUser, echoId: string, scheduledFor: string) {
  return postRevisit(
    makeRequest("/api/revisits", json({ echoId, scheduledFor }, user.cookie)),
    ctx,
  );
}

let alice: TestUser;
let bob: TestUser;

beforeAll(async () => {
  for (const method of ["info", "warn", "error"] as const) {
    vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
      logLines.push(args.map(String).join(" "));
    });
  }
  alice = await createTestUser(process.env.DATABASE_URL!, { name: "Alice" });
  bob = await createTestUser(process.env.DATABASE_URL!, { name: "Bob" });
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe("Today's Echo", () => {
  it("returns null for a user with no Echoes", async () => {
    const empty = await createTestUser(process.env.DATABASE_URL!);
    expect((await getToday(empty)).echo).toBeNull();
  });

  it("pins the day's Echo, even when Echoes are added during the day", async () => {
    const user = await createTestUser(process.env.DATABASE_URL!);
    await seedEchoes(user, [40, 30, 20]);
    const first = (await getToday(user)) as TodaysEchoDto;
    expect(first.echo).not.toBeNull();
    expect(first.savedAgo).toMatch(/^Saved /);

    for (let i = 0; i < 5; i++) await createEcho(user, { quote: `Added later ${i}` });
    const again = (await getToday(user)) as TodaysEchoDto;
    expect(again.echo.id).toBe(first.echo.id);
    expect(again.date).toBe(first.date);
  });

  it("gives a different, seeded pick on other dates", async () => {
    const user = await createTestUser(process.env.DATABASE_URL!);
    await seedEchoes(user, [60, 50, 40, 30, 20, 15, 12, 10, 9, 8]);
    const picks = new Set<string>();
    for (let day = 1; day <= 10; day++) {
      const now = new Date(`2026-11-${String(day).padStart(2, "0")}T12:00:00Z`);
      const today = await getTodaysEcho(user.user.id, { now, timeZone: "UTC" });
      expect(today?.date).toBe(now.toISOString().slice(0, 10));
      picks.add(today!.echo.id);
      // Repeat calls on the same date return the pinned pick.
      expect((await getTodaysEcho(user.user.id, { now, timeZone: "UTC" }))?.echo.id).toBe(
        today!.echo.id,
      );
    }
    expect(picks.size).toBeGreaterThan(1);
  });

  it("prefers Echoes older than a week once there are more than ten", async () => {
    const user = await createTestUser(process.env.DATABASE_URL!);
    const old = await seedEchoes(user, [30]);
    await seedEchoes(user, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
    // Step the clock back, so the recent Echoes stay younger than a week on every date.
    for (let day = 0; day < 5; day++) {
      const today = await getTodaysEcho(user.user.id, {
        now: new Date(Date.now() - day * DAY),
        timeZone: "UTC",
      });
      expect(today?.echo.id).toBe(old[0]!.id);
    }
  });

  it("re-picks when the pinned Echo is deleted, and never returns someone else's Echo", async () => {
    const user = await createTestUser(process.env.DATABASE_URL!);
    await seedEchoes(user, [10, 9]);
    await createEcho(bob, { quote: SECRET_QUOTE });
    const first = (await getToday(user)) as TodaysEchoDto;
    const response = await deleteEcho(
      makeRequest(`/api/echoes/${first.echo.id}`, { method: "DELETE", cookie: user.cookie }),
      idCtx(first.echo.id),
    );
    expect(response.status).toBe(204);
    const next = (await getToday(user)) as TodaysEchoDto;
    expect(next.echo.id).not.toBe(first.echo.id);
    expect(next.echo.quote).not.toBe(SECRET_QUOTE);
  });

  it("uses the stored time zone to decide the date", async () => {
    const user = await createTestUser(process.env.DATABASE_URL!);
    await seedEchoes(user, [10]);
    const response = await patchMe(
      makeRequest("/api/me", json({ timezone: "Asia/Kolkata" }, user.cookie, "PATCH")),
      ctx,
    );
    expect(response.status).toBe(200);
    const lateUtc = new Date("2026-10-01T23:30:00Z");
    expect((await getTodaysEcho(user.user.id, { now: lateUtc }))?.date).toBe("2026-10-02");

    const bad = await patchMe(
      makeRequest("/api/me", json({ timezone: "Mars/Olympus" }, user.cookie, "PATCH")),
      ctx,
    );
    expect(bad.status).toBe(400);
  });
});

describe("Echo Me Something", () => {
  it("returns null with no Echoes", async () => {
    const empty = await createTestUser(process.env.DATABASE_URL!);
    expect(await getRandom(empty)).toBeNull();
  });

  it("honours exclusions, then drops them when nothing else is left", async () => {
    const user = await createTestUser(process.env.DATABASE_URL!);
    const [a, b] = await seedEchoes(user, [5, 4]);
    for (let i = 0; i < 5; i++) {
      expect((await getRandom(user, [a!.id]))?.id).toBe(b!.id);
    }
    // Everything excluded: it still shows something rather than nothing.
    const fallback = await getRandom(user, [a!.id, b!.id]);
    expect([a!.id, b!.id]).toContain(fallback?.id);
  });

  it("marks the Echo as surfaced and avoids it for a day when others exist", async () => {
    const user = await createTestUser(process.env.DATABASE_URL!);
    const [a, b, c] = await seedEchoes(user, [5, 4, 3]);
    const now = new Date();
    const before = await db.echo.findUniqueOrThrow({ where: { id: a!.id } });
    const first = await getRandomEcho(user.user.id, { now, random: () => 0 });
    expect(first?.id).toBe(a!.id);
    const row = await db.echo.findUniqueOrThrow({ where: { id: a!.id } });
    expect(row.lastSurfacedAt?.getTime()).toBe(now.getTime());
    expect(row.updatedAt.getTime()).toBe(before.updatedAt.getTime());

    const second = await getRandomEcho(user.user.id, { now, random: () => 0 });
    expect(second?.id).toBe(b!.id);
    const third = await getRandomEcho(user.user.id, { now, random: () => 0 });
    expect(third?.id).toBe(c!.id);
    // All three were surfaced in the last day, so it falls back to the full set.
    expect((await getRandomEcho(user.user.id, { now, random: () => 0 }))?.id).toBe(a!.id);
    // A day later, they are all fresh again.
    const later = new Date(now.getTime() + DAY + 1);
    expect(await getRandomEcho(user.user.id, { now: later, random: () => 0.99 })).not.toBeNull();
  });

  it("never returns deleted Echoes or another user's Echoes", async () => {
    const user = await createTestUser(process.env.DATABASE_URL!);
    const [keep, gone] = await seedEchoes(user, [5, 4]);
    await db.echo.update({ where: { id: gone!.id }, data: { deletedAt: new Date() } });
    const foreign = await createEcho(bob, { quote: SECRET_QUOTE });
    for (let i = 0; i < 10; i++) {
      // Excluding the only live Echo still can't reach the deleted or foreign ones.
      const echo = await getRandom(user, [keep!.id, foreign.id]);
      expect(echo?.id).toBe(keep!.id);
    }
  });
});

describe("Revisits", () => {
  it("goes from upcoming to due to completed as the clock moves", async () => {
    const echo = await createEcho(alice, { quote: "Come back to this." });
    const response = await scheduleRevisit(alice, echo.id, inDays(30));
    expect(response.status).toBe(201);
    const revisit = (await response.json()) as RevisitDto;

    const upcoming = await listRevisitsRoute(
      makeRequest("/api/revisits?status=upcoming", { cookie: alice.cookie }),
      ctx,
    );
    const items = ((await upcoming.json()) as { items: RevisitWithEchoDto[] }).items;
    expect(items.map((item) => item.id)).toContain(revisit.id);
    expect(items.find((item) => item.id === revisit.id)?.echo.quote).toBe("Come back to this.");

    const later = new Date(Date.now() + 31 * DAY);
    const due = await listRevisits(alice.user.id, "due", { now: later });
    expect(due.map((item) => item.id)).toContain(revisit.id);
    expect(
      (await listRevisits(alice.user.id, "upcoming", { now: later })).map((r) => r.id),
    ).not.toContain(revisit.id);
    expect((await getLibraryCounts(alice.user.id, later)).revisitsDue).toBeGreaterThanOrEqual(1);

    const done = await updateRevisit(alice.user.id, revisit.id, { completed: true }, later);
    expect(done.completedAt).toBe(later.toISOString());
    expect(
      (await listRevisits(alice.user.id, "due", { now: later })).map((r) => r.id),
    ).not.toContain(revisit.id);
    expect(
      (await listRevisits(alice.user.id, "completed", { now: later })).map((r) => r.id),
    ).toContain(revisit.id);
  });

  it("keeps one pending Revisit per Echo", async () => {
    const echo = await createEcho(alice, { quote: "Only one pending." });
    const first = (await (await scheduleRevisit(alice, echo.id, inDays(30))).json()) as RevisitDto;
    const second = (await (await scheduleRevisit(alice, echo.id, inDays(60))).json()) as RevisitDto;
    const pending = await db.revisit.findMany({ where: { echoId: echo.id, completedAt: null } });
    expect(pending.map((row) => row.id)).toEqual([second.id]);
    expect(first.id).not.toBe(second.id);
  });

  it("rejects past dates and dates more than ten years away", async () => {
    const echo = await createEcho(alice, { quote: "Date rules." });
    const past = await scheduleRevisit(alice, echo.id, inDays(-1));
    expect(past.status).toBe(400);
    const far = await scheduleRevisit(alice, echo.id, inDays(11 * 365));
    expect(far.status).toBe(400);
    const malformed = await scheduleRevisit(alice, echo.id, "next spring");
    expect(malformed.status).toBe(400);
  });

  it("moves and cancels a Revisit", async () => {
    const echo = await createEcho(alice, { quote: "Move me." });
    const revisit = (await (
      await scheduleRevisit(alice, echo.id, inDays(10))
    ).json()) as RevisitDto;
    const moved = await patchRevisit(
      makeRequest(
        `/api/revisits/${revisit.id}`,
        json({ scheduledFor: inDays(90) }, alice.cookie, "PATCH"),
      ),
      idCtx(revisit.id),
    );
    expect(moved.status).toBe(200);
    expect(new Date(((await moved.json()) as RevisitDto).scheduledFor).getTime()).toBeGreaterThan(
      Date.now() + 80 * DAY,
    );
    const cancelled = await deleteRevisit(
      makeRequest(`/api/revisits/${revisit.id}`, { method: "DELETE", cookie: alice.cookie }),
      idCtx(revisit.id),
    );
    expect(cancelled.status).toBe(204);
    expect(await db.revisit.count({ where: { id: revisit.id } })).toBe(0);
  });

  it("schedules, replaces and cancels a Revisit from the Echo form", async () => {
    const echo = await createEcho(alice, { quote: "From the form.", revisitAt: inDays(30) });
    expect(await db.revisit.count({ where: { echoId: echo.id, completedAt: null } })).toBe(1);

    const replaced = await patchEcho(
      makeRequest(
        `/api/echoes/${echo.id}`,
        json({ revisitAt: inDays(200) }, alice.cookie, "PATCH"),
      ),
      idCtx(echo.id),
    );
    expect(replaced.status).toBe(200);
    const pending = await db.revisit.findMany({ where: { echoId: echo.id, completedAt: null } });
    expect(pending).toHaveLength(1);
    expect(pending[0]!.scheduledFor.getTime()).toBeGreaterThan(Date.now() + 190 * DAY);

    const cleared = await patchEcho(
      makeRequest(`/api/echoes/${echo.id}`, json({ revisitAt: null }, alice.cookie, "PATCH")),
      idCtx(echo.id),
    );
    expect(cleared.status).toBe(200);
    expect(await db.revisit.count({ where: { echoId: echo.id, completedAt: null } })).toBe(0);

    const badDate = await postEcho(
      makeRequest("/api/echoes", json({ quote: "Bad date", revisitAt: inDays(-2) }, alice.cookie)),
      ctx,
    );
    expect(badDate.status).toBe(400);
    expect(await db.echo.count({ where: { quote: "Bad date" } })).toBe(0);
  });

  it("hides Revisits of deleted Echoes", async () => {
    const echo = await createEcho(alice, { quote: "Deleted later." });
    const revisit = (await (await scheduleRevisit(alice, echo.id, inDays(5))).json()) as RevisitDto;
    await db.echo.update({ where: { id: echo.id }, data: { deletedAt: new Date() } });
    const upcoming = await listRevisits(alice.user.id, "upcoming");
    expect(upcoming.map((item) => item.id)).not.toContain(revisit.id);
    const response = await patchRevisit(
      makeRequest(`/api/revisits/${revisit.id}`, json({ completed: true }, alice.cookie, "PATCH")),
      idCtx(revisit.id),
    );
    expect(response.status).toBe(404);
  });

  describe("authorization", () => {
    let bobsEcho: EchoDto;
    let bobsRevisit: RevisitDto;

    beforeAll(async () => {
      bobsEcho = await createEcho(bob, { quote: SECRET_QUOTE });
      bobsRevisit = (await (
        await scheduleRevisit(bob, bobsEcho.id, inDays(3))
      ).json()) as RevisitDto;
    });

    it("404s when A schedules a Revisit on B's Echo", async () => {
      const response = await scheduleRevisit(alice, bobsEcho.id, inDays(3));
      expect(response.status).toBe(404);
      expect(await errorCode(response)).toBe("ECHO_NOT_FOUND");
    });

    it("404s when A edits or deletes B's Revisit", async () => {
      const complete = await patchRevisit(
        makeRequest(
          `/api/revisits/${bobsRevisit.id}`,
          json({ completed: true }, alice.cookie, "PATCH"),
        ),
        idCtx(bobsRevisit.id),
      );
      expect(complete.status).toBe(404);
      expect(await errorCode(complete)).toBe("REVISIT_NOT_FOUND");

      const move = await patchRevisit(
        makeRequest(
          `/api/revisits/${bobsRevisit.id}`,
          json({ scheduledFor: inDays(9) }, alice.cookie, "PATCH"),
        ),
        idCtx(bobsRevisit.id),
      );
      expect(move.status).toBe(404);

      const remove = await deleteRevisit(
        makeRequest(`/api/revisits/${bobsRevisit.id}`, { method: "DELETE", cookie: alice.cookie }),
        idCtx(bobsRevisit.id),
      );
      expect(remove.status).toBe(404);

      const untouched = await db.revisit.findUniqueOrThrow({ where: { id: bobsRevisit.id } });
      expect(untouched.completedAt).toBeNull();
    });

    it("never lists B's Revisits for A", async () => {
      const later = new Date(Date.now() + 10 * DAY);
      for (const status of ["due", "upcoming", "completed"] as const) {
        const items = await listRevisits(alice.user.id, status, { now: later });
        expect(items.map((item) => item.id)).not.toContain(bobsRevisit.id);
      }
    });

    it("404s for malformed IDs", async () => {
      const response = await deleteRevisit(
        makeRequest("/api/revisits/not-a-uuid", { method: "DELETE", cookie: alice.cookie }),
        idCtx("not-a-uuid"),
      );
      expect(response.status).toBe(404);
    });

    it("requires a session", async () => {
      const response = await listRevisitsRoute(makeRequest("/api/revisits"), ctx);
      expect(response.status).toBe(401);
      expect((await todayEcho(makeRequest("/api/echoes/today"), ctx)).status).toBe(401);
      expect((await randomEcho(makeRequest("/api/echoes/random"), ctx)).status).toBe(401);
    });
  });
});

describe("From the past", () => {
  it("finds an Echo saved about a year ago, and nothing otherwise", async () => {
    const user = await createTestUser(process.env.DATABASE_URL!);
    await seedEchoes(user, [3, 100]);
    expect(await getFromThePast(user.user.id)).toBeNull();
    const [yearOld] = await seedEchoes(user, [368]);
    const past = await getFromThePast(user.user.id);
    expect(past?.echo.id).toBe(yearOld!.id);
    expect(past?.label).toBe("one year ago");
  });
});

describe("onboarding", () => {
  it("prompts for a reflection only on the first Echo, until onboarding is done", async () => {
    const user = await createTestUser(process.env.DATABASE_URL!);
    const first = await createEcho(user, { quote: "My first Echo." });
    expect(await shouldPromptFirstReflection(user.user.id, first, null)).toBe(true);
    expect(
      await shouldPromptFirstReflection(user.user.id, { ...first, reflection: "Because." }, null),
    ).toBe(false);

    const response = await patchMe(
      makeRequest("/api/me", json({ onboarded: true }, user.cookie, "PATCH")),
      ctx,
    );
    const body = (await response.json()) as { onboardedAt: string };
    expect(body.onboardedAt).not.toBeNull();
    expect(await shouldPromptFirstReflection(user.user.id, first, new Date(body.onboardedAt))).toBe(
      false,
    );

    // Marking it again keeps the first timestamp.
    const again = await patchMe(
      makeRequest("/api/me", json({ onboarded: true }, user.cookie, "PATCH")),
      ctx,
    );
    expect(((await again.json()) as { onboardedAt: string }).onboardedAt).toBe(body.onboardedAt);
  });
});

describe("logging", () => {
  it("never logs quote text", () => {
    expect(logLines.join("\n")).not.toContain(SECRET_QUOTE);
  });
});
