"use client";

// The authenticated shell around Story Partner. Rendered only after the
// server-side session check in page.tsx passes.

import { useRouter } from "next/navigation";
import StoryStudio from "../engines/story/StoryStudio";
import { lockAllVaults } from "../engines/story/db";

const card = { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: 18 } as const;

export default function AuthorRoom() {
  const router = useRouter();

  const leave = async () => {
    await lockAllVaults(); // seal any decrypted vault before the session ends
    try {
      await fetch("/api/author/logout", { method: "POST" });
    } catch {
      // even if the request fails, refresh drops back to the login shell once the cookie expires
    }
    router.refresh();
  };

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "24px 14px 64px" }}>
      <StoryStudio onBack={leave} backLabel="🔒 Lock & leave" card={card} />
    </main>
  );
}
