import type { Metadata } from "next";
import { Suspense } from "react";
import "../../starter/starter.css";
import StarterEditor from "../../starter/StarterEditor";

export const metadata: Metadata = {
  title: "Make your website yours",
  description: "Add your details, change the words, colors, fonts, photos and sections, preview on phone and desktop, and download the files.",
  robots: { index: false },
};

export default function EditPage() {
  return (
    <main className="se-page">
      <Suspense fallback={<div className="se-loading">Opening your draft…</div>}>
        <StarterEditor />
      </Suspense>
    </main>
  );
}
