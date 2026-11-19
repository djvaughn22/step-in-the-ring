import type { Metadata } from "next";
import Link from "next/link";
import "../starter/starter.css";
import "../starter/home2.css";
import ExampleCards from "../starter/ExampleCards";
import { EXAMPLES } from "../starter/examples";

export const metadata: Metadata = {
  title: "Website examples for small businesses, makers and groups",
  description: `${EXAMPLES.length} example websites, from Pilates instructors and appliance repair to food trucks, potters, walking clubs and family reunions. See one, then start from it.`,
};

export default function ExamplesPage() {
  return (
    <main className="xs h2">
      <header className="xs-head">
        <h1>{EXAMPLES.length} example websites</h1>
        <p>
          For small businesses, makers, clubs and family events, with sections and wording that fit each
          one. Look around, then start from the one closest to yours. Names, phone numbers and details in
          the examples are made up.
        </p>
        <p><Link className="btn btn-gold" href="/start">Choose your example</Link></p>
      </header>
      <ExampleCards main="view" />
    </main>
  );
}
