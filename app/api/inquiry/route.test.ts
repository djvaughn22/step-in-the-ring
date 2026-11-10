import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { MemoryMemberStore } from "../../members/store";
import { resetRateLimits } from "../../lib/rateLimit";

const store = new MemoryMemberStore();
const sent: { to: string; subject: string; text: string }[] = [];
let haveStore = true;
vi.mock("../../members/store", async (orig) => ({
  ...(await orig<typeof import("../../members/store")>()),
  getMemberStore: async () => (haveStore ? store : null),
}));
vi.mock("../../members/login-notification", async (orig) => ({
  ...(await orig<typeof import("../../members/login-notification")>()),
  resendSender: () => async (m: { to: string; subject: string; text: string }) => void sent.push(m),
}));

const { POST } = await import("./route");

const body = {
  name: "Pat Example",
  email: "pat@example.com",
  projectType: "new-site",
  service: "starter",
  description: "A three page site for a small bakery, with hours and a menu.",
  timeline: "soon",
  budget: "",
  elapsedMs: 15_000,
};
const post = (b: unknown, headers: Record<string, string> = { "content-type": "application/json" }) =>
  POST(new NextRequest("http://localhost/api/inquiry", { method: "POST", headers: { "x-forwarded-for": `10.0.0.${Math.random()}`, ...headers }, body: typeof b === "string" ? b : JSON.stringify(b) }));

describe("POST /api/inquiry", () => {
  beforeEach(() => {
    store.projectInquiries.clear();
    sent.length = 0;
    haveStore = true;
    resetRateLimits();
  });

  it("saves the request, then emails the owner, and only then says ok", async () => {
    const res = await post(body);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect((await store.listProjectInquiries())[0].email).toBe("pat@example.com");
    await vi.waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0].text).toContain("A three page site for a small bakery");
  });

  it("returns field errors and saves nothing", async () => {
    const res = await post({ ...body, email: "nope" });
    expect(res.status).toBe(422);
    expect((await res.json()).fields.email).toBeTruthy();
    expect(await store.listProjectInquiries()).toHaveLength(0);
  });

  it("is honest when nothing can receive the request", async () => {
    haveStore = false;
    const res = await post(body);
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain("ask@openmirrorllc.com");
  });

  it("works as a plain form without the page script", async () => {
    const form = new URLSearchParams(Object.entries(body).map(([k, v]) => [k, String(v)])).toString();
    const res = await post(form, { "content-type": "application/x-www-form-urlencoded" });
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("We have your request");
    expect(await store.listProjectInquiries()).toHaveLength(1);
  });

  it("slows down a flood from one address", async () => {
    const h = { "content-type": "application/json", "x-forwarded-for": "10.9.9.9" };
    const codes: number[] = [];
    for (let i = 0; i < 5; i++) codes.push((await POST(new NextRequest("http://localhost/api/inquiry", { method: "POST", headers: h, body: JSON.stringify(body) }))).status);
    expect(codes).toEqual([200, 200, 200, 200, 429]);
  });
});
