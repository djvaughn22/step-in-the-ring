"use client";

// One quiet line (or a short list) for someone who already has drafts in
// this browser. Opening one makes it the draft the editor shows.

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { byRecent, draftLabel, loadStore, saveStore, setActive, type DraftStore } from "./drafts";
import { exampleBySlug } from "./examples";

export default function ContinueDraft() {
  const router = useRouter();
  const [store, setStore] = useState<DraftStore | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read this browser's storage once, after mount
    setStore(loadStore(window.localStorage));
  }, []);
  if (!store || !store.drafts.length) return null;
  const list = byRecent(store);
  const open = (id: string) => {
    saveStore(window.localStorage, setActive(store, id));
    router.push("/start/edit");
  };
  if (list.length === 1) {
    return (
      <p className="xc-continue">
        You have a draft for <strong>{draftLabel(list[0].draft)}</strong> in this browser.{" "}
        <button type="button" className="se-linkbtn xc-open" onClick={() => open(list[0].id)}>Keep working on it&nbsp;→</button>
      </p>
    );
  }
  return (
    <div className="xc-continue">
      <p>You have {list.length} drafts in this browser. Pick one to keep working on, or start another below.</p>
      <ul className="xc-drafts">
        {list.slice(0, 5).map((e) => (
          <li key={e.id}>
            <button type="button" className="se-linkbtn xc-open" onClick={() => open(e.id)}>{draftLabel(e.draft)}</button>
            <span>{exampleBySlug(e.draft.example)?.name ?? ""}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
