import type { Metadata } from "next";
import "../starter/starter.css";
import "../starter/home2.css";
import ExampleCards from "../starter/ExampleCards";
import ContinueDraft from "../starter/ContinueDraft";
import { BRAND_OWNERSHIP } from "../site/brand";

export const metadata: Metadata = {
  title: "Website starter: choose an example",
  description:
    "Find the example closest to your business, club or event, then add your details and make it yours. Preview it on a phone and a computer, and download the files.",
};

export default function StartPage() {
  return (
    <main className="xs h2">
      <header className="xs-head">
        <ol className="se-steps" aria-label="Steps">
          <li aria-current="step">1. Choose an example</li>
          <li>2. Make it yours</li>
          <li>3. Check and download</li>
        </ol>
        <h1>Which example is closest to yours?</h1>
        <p>
          Each one is a full one-page website, written for that kind of work. Pick one and change
          anything: words, colors, fonts, photos and sections.
        </p>
        {/* Owner, 2026-11-12: free first. Paid help is offered later, once there's a draft. */}
        <p className="xs-free"><strong>Free</strong> to make and download. No account, no coding.</p>
        <ContinueDraft />
      </header>
      <ExampleCards main="start" />
      <footer className="xs-foot">
        <p>Never made a website? That&apos;s fine. You change words and pick colors; the layout is done for you. Your drafts save in this browser.</p>
        <p>{BRAND_OWNERSHIP}</p>
        <p>
          Don&apos;t see your kind of work? Start from the closest one. Every word, color and section can change.
        </p>
      </footer>
    </main>
  );
}
