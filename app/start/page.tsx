import type { Metadata } from "next";
import Link from "next/link";
import "../starter/starter.css";
import ExampleCards from "../starter/ExampleCards";
import ContinueDraft from "../starter/ContinueDraft";
import { BRAND_OWNERSHIP } from "../site/brand";

export const metadata: Metadata = {
  title: "Website starter: choose an example",
  description:
    "Pick the example closest to your business, then add your details and make it yours. Preview it on a phone and a computer, and download the files.",
};

export default function StartPage() {
  return (
    <main className="xs">
      <header className="xs-head">
        <ol className="se-steps" aria-label="Steps">
          <li aria-current="step">1. Choose an example</li>
          <li>2. Add your details and make it yours</li>
        </ol>
        <h1>Which business is closest to yours?</h1>
        <p>
          Each example is a full one-page website with wording written for that kind of work. Pick one,
          then change the words, colors, fonts, photos and sections. Your draft saves in this browser.
        </p>
        <div className="xs-freepaid">
          <span><strong>Free:</strong> making and downloading your site, with no account.</span>
          <span><strong>Optional paid help:</strong> we can finish or publish it for you, by written quote. <Link href="/services">See services</Link>.</span>
        </div>
        <ContinueDraft />
      </header>
      <ExampleCards main="start" />
      <footer className="xs-foot">
        <p>{BRAND_OWNERSHIP}</p>
        <p>
          Don&apos;t see your business? Start from the closest one; every section can change.
        </p>
      </footer>
    </main>
  );
}
