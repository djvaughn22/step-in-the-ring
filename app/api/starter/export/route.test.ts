// The website files are a deliverable: only the signed-in owner gets them.
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../owner/session", () => ({ isOwnerRequest: vi.fn(() => false) }));
import { isOwnerRequest } from "../../../owner/session";
import { POST } from "./route";
import { draftFromExample } from "../../../starter/draft";
import { EXAMPLES } from "../../../starter/examples";

const req = (body: unknown) =>
  ({ json: async () => body, cookies: { get: () => undefined } }) as unknown as Parameters<typeof POST>[0];

describe("POST /api/starter/export", () => {
  it("refuses anyone who isn't the owner", async () => {
    vi.mocked(isOwnerRequest).mockReturnValue(false);
    const res = await POST(req({ draft: draftFromExample(EXAMPLES[0]) }));
    expect(res.status).toBe(401);
  });

  it("gives the owner a zip of the draft", async () => {
    vi.mocked(isOwnerRequest).mockReturnValue(true);
    const res = await POST(req({ draft: draftFromExample(EXAMPLES[0]) }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/zip");
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(bytes[0]).toBe(0x50); // "PK"
    expect(bytes[1]).toBe(0x4b);
  });

  it("rejects something that isn't a draft", async () => {
    vi.mocked(isOwnerRequest).mockReturnValue(true);
    const res = await POST(req({ draft: { nope: true } }));
    expect(res.status).toBe(400);
  });
});
