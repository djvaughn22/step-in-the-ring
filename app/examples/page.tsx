import type { Metadata } from "next";
import Link from "next/link";
import "../starter/starter.css";
import "../starter/home2.css";
import ExampleCards from "../starter/ExampleCards";
import { EXAMPLES } from "../starter/examples";

export const metadata: Metadata = {
  title: "Website examples for small service businesses",
  description: `${EXAMPLES.length} example websites, one for each kind of small service business, from Pilates instructors to appliance repair. See one, then start from it.`,
};

export default function ExamplesPage() {
  return (
    <main className="xs h2">
      <header className="xs-head">
        <h1>{EXAMPLES.length} example websites</h1>
        <p>
          One for each kind of business, with sections and wording that fit the work. Look around, then
          start from the one that&apos;s closest to yours. Names, phone numbers and details in the
          examples are made up.
        </p>
        <p><Link className="btn btn-gold" href="/start">Choose your example</Link></p>
      </header>
      <ExampleCards main="view" />
    </main>
  );
}
