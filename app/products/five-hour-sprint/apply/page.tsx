import type { Metadata } from "next";
import { Suspense } from "react";
import { Sheet, Masthead, Band } from "../../../site/ui";
import SprintApplyForm from "./SprintApplyForm";

export const metadata: Metadata = {
  title: "Apply for a Sprint",
  description: "Tell the owner what you want finished, and when, to ask about a paid Five Hour Sprint.",
};

export default function SprintApplyPage() {
  return (
    <Sheet>
      <Masthead
        kicker="Five Hour Sprint"
        title="Apply for a Sprint"
        lead="No payment today. This sends the owner what you want finished, so the two of you can set up the intake conversation and pick a window."
      />
      <Band title="Tell the owner about it">
        {/* useSearchParams (to pre-fill "team" from ?format=team) needs a
            Suspense boundary so this page can still prerender statically. */}
        <Suspense fallback={null}>
          <SprintApplyForm />
        </Suspense>
      </Band>
    </Sheet>
  );
}
