// The Build API, exercised through real sessions and a real store.
//
// Nothing here mocks authentication. A request is authenticated the same way
// a browser authenticates: a session token issued by app/members/auth.ts,
// presented as the member cookie. That is the only way these tests can prove
// what they claim to prove — that a stranger gets nothing, and that one
// member can never touch another member's Build.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { issueSession, MEMBER_SESSION_COOKIE } from "../../members/auth";
import { MemoryMemberStore } from "../../members/store";
import { BUILD_ENGINE_ID } from "../../vnext/capabilities";
import { parseBuild } from "../../vnext/build";

let store: MemoryMemberStore;

vi.mock("../../members/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../members/store")>();
  return { ...actual, getMemberStore: async () => store };
});

const { GET, POST } = await import("./route");
const { POST: ACTION } = await import("./[id]/route");

const GAME =
  "A game where you dodge falling tacos and try to beat your friend's score. " +
  "One player, a score counter, and it gets faster the longer you last.";

beforeEach(() => {
  store = new MemoryMemberStore();
});

/** A member with live access and a real session token. */
async function member(email: string, status = "tester") {
  const now = new Date().toISOString();
  // A tester's access is live only while the period runs — same rule the
  // real entitlement resolver applies, so the fixture must honour it.
  const periodEnd = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  const user = {
    id: `user-${email}`,
    email,
    passwordHash: "not-used-by-these-tests",
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
    deletionRequestedAt: null,
  };
  await store.createUser(user);
  await store.upsertEntitlement({
    userId: user.id,
    status: status as never,
    source: "beta-password",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    currentPeriodEnd: status === "revoked" ? null : periodEnd,
    testerCodeId: null,
    revokedAt: null,
    adminNotes: "",
    createdAt: now,
    updatedAt: now,
  });
  const { sessionToken } = await issueSession(store, user.id, new Date());
  return { user, sessionToken };
}

function req(
  path: string,
  opts: { method?: string; token?: string; body?: unknown } = {},
): NextRequest {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.token) headers.cookie = `${MEMBER_SESSION_COOKIE}=${opts.token}`;
  return new NextRequest(`http://localhost${path}`, {
    method: opts.method ?? "GET",
    headers,
    ...(opts.body === undefined ? {} : { body: JSON.stringify(opts.body) }),
  });
}

const params = (id: string) => ({ params: Promise.resolve({ id }) });

async function createBuild(token: string, intent = GAME) {
  const res = await POST(req("/api/builds", { method: "POST", token, body: { intent } }));
  const data = await res.json();
  return { res, build: data.build, data };
}

describe("a stranger gets nothing", () => {
  it("refuses to list builds without a session", async () => {
    const res = await GET(req("/api/builds"));
    expect(res.status).toBe(401);
  });

  it("refuses to create a build without a session", async () => {
    const res = await POST(req("/api/builds", { method: "POST", body: { intent: GAME } }));
    expect(res.status).toBe(401);
    expect((await res.json()).ok).toBe(false);
  });

  it("refuses to change a build without a session", async () => {
    const { sessionToken } = await member("owner@example.com");
    const { build } = await createBuild(sessionToken);

    const res = await ACTION(
      req(`/api/builds/${build.id}`, { method: "POST", body: { action: { type: "advance", stage: "live" } } }),
      params(build.id),
    );
    expect(res.status).toBe(401);
  });

  it("refuses a made-up session token", async () => {
    const res = await GET(req("/api/builds", { token: "not-a-real-token" }));
    expect(res.status).toBe(401);
  });
});

describe("creating a build", () => {
  it("takes only the person's words and shapes the rest on the server", async () => {
    const { sessionToken } = await member("maker@example.com");
    const { res, build } = await createBuild(sessionToken);

    expect(res.status).toBe(201);
    expect(build.intent).toBe(GAME);
    expect(build.stage).toBe("bring");
    // Derived here, from those words — not sent by the browser.
    expect(build.reading).toBeTruthy();
    expect(build.versionOne.length).toBeGreaterThan(0);
    expect(build.currentAction).toBeTruthy();
    expect(build.id).toBeTruthy();
  });

  it("ignores anything the client tries to assert about the build", async () => {
    const { sessionToken } = await member("liar@example.com");
    const res = await POST(
      req("/api/builds", {
        method: "POST",
        token: sessionToken,
        body: {
          intent: GAME,
          // All of this is noise. None of it is read.
          stage: "live",
          title: "Shipped and profitable",
          reading: "A wildly successful product",
          versionOne: ["already done"],
          history: [{ at: "2020-01-01T00:00:00.000Z", note: "Launched." }],
        },
      }),
    );
    const { build } = await res.json();

    expect(build.stage).toBe("bring");
    expect(build.title).not.toBe("Shipped and profitable");
    expect(build.reading).not.toBe("A wildly successful product");
    expect(build.versionOne).not.toContain("already done");
    expect(build.history).toHaveLength(1);
    expect(build.history[0].note).toBe("You stepped in.");
  });

  it("refuses an empty or oversized intent", async () => {
    const { sessionToken } = await member("brief@example.com");
    for (const intent of ["", "   ", "x".repeat(2001), 42, null]) {
      const res = await POST(req("/api/builds", { method: "POST", token: sessionToken, body: { intent } }));
      expect(res.status).toBe(422);
    }
  });

  it("refuses a body that isn't JSON", async () => {
    const { sessionToken } = await member("bad@example.com");
    const res = await POST(
      new NextRequest("http://localhost/api/builds", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `${MEMBER_SESSION_COOKIE}=${sessionToken}` },
        body: "{not json",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("refuses to save for an account without live access", async () => {
    const { sessionToken } = await member("revoked@example.com", "revoked");
    const res = await POST(req("/api/builds", { method: "POST", token: sessionToken, body: { intent: GAME } }));
    expect(res.status).toBe(403);
  });

  it("stores a build that reads back complete", async () => {
    const { user, sessionToken } = await member("round@example.com");
    const { build } = await createBuild(sessionToken);

    const rows = await store.listProjects(user.id);
    expect(rows).toHaveLength(1);
    const stored = parseBuild(rows[0].content)!;
    expect(stored.intent).toBe(GAME);
    expect(stored.reading).toBe(build.reading);
    expect(rows[0].engineId).toBe(BUILD_ENGINE_ID);
  });
});

describe("one member's builds are their own", () => {
  it("lists only your builds, never anybody else's", async () => {
    const a = await member("a@example.com");
    const b = await member("b@example.com");
    await createBuild(a.sessionToken, "A thing A is making");
    await createBuild(b.sessionToken, "A thing B is making");

    const list = await (await GET(req("/api/builds", { token: a.sessionToken }))).json();
    expect(list.builds).toHaveLength(1);
    expect(list.builds[0].intent).toBe("A thing A is making");
  });

  it("will not let another member change your build, and does not admit it exists", async () => {
    const a = await member("owner2@example.com");
    const b = await member("stranger@example.com");
    const { build } = await createBuild(a.sessionToken);

    const res = await ACTION(
      req(`/api/builds/${build.id}`, {
        method: "POST",
        token: b.sessionToken,
        body: { action: { type: "advance", stage: "live" } },
      }),
      params(build.id),
    );

    expect(res.status).toBe(404);
    // And the build is untouched.
    const list = await (await GET(req("/api/builds", { token: a.sessionToken }))).json();
    expect(list.builds[0].stage).toBe("bring");
  });

  it("will not let another member read your build through the action route", async () => {
    const a = await member("owner3@example.com");
    const b = await member("nosy@example.com");
    const { build } = await createBuild(a.sessionToken);

    const res = await ACTION(
      req(`/api/builds/${build.id}`, {
        method: "POST",
        token: b.sessionToken,
        body: { action: { type: "note", note: "hello" } },
      }),
      params(build.id),
    );
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(JSON.stringify(body)).not.toContain("tacos");
  });
});

describe("the action route stays a state machine", () => {
  it("refuses an action it does not recognize", async () => {
    const { sessionToken } = await member("actor@example.com");
    const { build } = await createBuild(sessionToken);

    for (const action of [{ type: "delete-everything" }, { type: "advance", stage: "shipped" }, "advance", null]) {
      const res = await ACTION(
        req(`/api/builds/${build.id}`, { method: "POST", token: sessionToken, body: { action } }),
        params(build.id),
      );
      expect(res.status).toBe(422);
    }
  });

  it("records every move it does make", async () => {
    const { sessionToken } = await member("mover@example.com");
    const { build } = await createBuild(sessionToken);

    const res = await ACTION(
      req(`/api/builds/${build.id}`, {
        method: "POST",
        token: sessionToken,
        body: { action: { type: "advance", stage: "build" } },
      }),
      params(build.id),
    );
    const { build: moved } = await res.json();
    expect(moved.stage).toBe("build");
    expect(moved.history).toHaveLength(2);
    // The words are still theirs.
    expect(moved.intent).toBe(GAME);
  });

  it("refuses to rewrite a project that is not a build", async () => {
    const { user, sessionToken } = await member("engineer@example.com");
    const engineProject = {
      id: "engine-project-1",
      userId: user.id,
      title: "A song I made",
      engineId: "music",
      content: JSON.stringify({ lyrics: "mine" }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await store.createProject(engineProject);

    const res = await ACTION(
      req(`/api/builds/${engineProject.id}`, {
        method: "POST",
        token: sessionToken,
        body: { action: { type: "advance", stage: "live" } },
      }),
      params(engineProject.id),
    );

    expect(res.status).toBe(404);
    // Untouched: an engine project is somebody's work, not a Build to move.
    const rows = await store.listProjects(user.id);
    expect(rows[0].content).toBe(JSON.stringify({ lyrics: "mine" }));
  });
});
