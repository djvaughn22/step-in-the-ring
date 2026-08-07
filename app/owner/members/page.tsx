import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isOwnerAuthed } from "../session";
import { getMemberStore } from "../../members/store";
import MembersPanel from "./MembersPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage Members — Owner",
  robots: { index: false, follow: false, nocache: true },
};

export default async function MembersPage() {
  if (!(await isOwnerAuthed())) {
    redirect("/owner");
  }

  const store = await getMemberStore();
  if (!store) {
    return (
      <main>
        <div className="page">
          <div style={{ textAlign: "center", padding: 40 }}>
            <p>Member store not configured.</p>
          </div>
        </div>
      </main>
    );
  }

  return <MembersPanel store={store} />;
}
