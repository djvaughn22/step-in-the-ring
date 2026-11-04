import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Band, Masthead } from "../site/ui";
import { KIT_CONTACT_EMAIL, KIT_NAME, KIT_PAGE_COUNT, KIT_REFUND_DAYS, KIT_STEPS } from "./kit";
import { checkKitAccessFromEnv, KIT_COOKIE, kitLinkFor, readKitConfig } from "./kitStripe";
import { getKitFileSource, type KitFileInfo } from "./kitFile";
import { KitLinkBox, KitSteps } from "./KitClient";
import styles from "./kit.module.css";

// The buyer's page. Anyone can open it; only a browser holding a kit cookie
// whose purchase Stripe confirms sees the kit. Everyone else gets the way in.
export const metadata: Metadata = {
  title: "Your kit",
  description: "For people who bought the Ready to Build Kit: download it, follow the six steps, and open it on another device.",
  robots: { index: false, follow: false },
};

const DOOR_NOTES: Record<string, string> = {
  invalid: "That kit link didn't open a kit. Check that you copied all of it.",
  refunded: "This purchase was refunded, so the kit no longer opens from this link.",
  unavailable: "We couldn't check your kit just now. Try again in a minute.",
  busy: "That was a lot of tries at once. Wait a few minutes, then open your kit link again.",
};

function fileLine(info: KitFileInfo): string {
  const mb = info.byteLength / (1024 * 1024);
  const size = mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(info.byteLength / 1024))} KB`;
  const added = info.uploadedAt
    ? new Date(info.uploadedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/Chicago" })
    : "";
  return [`Version ${info.version}`, `PDF, ${KIT_PAGE_COUNT} pages`, size, added ? `added ${added}` : ""].filter(Boolean).join(" · ");
}

async function fileInfo(): Promise<KitFileInfo | null> {
  try {
    return (await (await getKitFileSource())?.info()) ?? null;
  } catch {
    return null;
  }
}

export default async function KitPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const one = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : "");
  const sessionId = (await cookies()).get(KIT_COOKIE)?.value;
  const access = sessionId ? await checkKitAccessFromEnv(sessionId) : null;
  const appUrl = readKitConfig().appUrl ?? "https://stepinthering.com";

  if (access?.state === "paid" || access?.state === "processing") {
    const link = kitLinkFor(appUrl, access.sessionId);
    const paid = access.state === "paid";
    const info = paid ? await fileInfo() : null;
    return (
      <main>
        <div className="page" style={{ maxWidth: 820 }}>
          <Masthead
            kicker={KIT_NAME}
            title="Your kit"
            lead="Download the workbook, then work through the six steps. Each step links to the pages on this site that help with it."
          />

          {paid && one("welcome") ? (
            <p className={styles.notice} role="status">
              You&apos;re all set. Thank you for buying the kit. Download it below, and save your kit link so you can get back here.
            </p>
          ) : null}
          {!paid ? (
            <p className={styles.notice} role="status">
              Your payment is still going through. Open this page again in a few minutes. Your kit link below will work once it clears.
            </p>
          ) : null}

          {paid ? (
            <section className={styles.download} aria-labelledby="download-heading">
              <h2 id="download-heading">The workbook</h2>
              {info && one("file") !== "missing" ? (
                <>
                  <p>Print it or keep it on screen. Every page is a checklist or a worksheet you fill in as you go.</p>
                  <a className="btn btn-gold btn-big" href="/kit/download">Download the kit (PDF)</a>
                  <p className="tiny">{fileLine(info)}</p>
                </>
              ) : (
                <p>
                  The file isn&apos;t ready to download yet. Email <a href={`mailto:${KIT_CONTACT_EMAIL}?subject=Ready%20to%20Build%20Kit%20download`}>{KIT_CONTACT_EMAIL}</a> and we&apos;ll send it to you. Your purchase is safe; this page will have it too.
                </p>
              )}
            </section>
          ) : null}

          <Band title="Your kit link" note="Open it on any phone or computer to get back to this page. This browser remembers you for a year.">
            <KitLinkBox link={link} />
          </Band>

          <Band title="The six steps" note="Tick each step off as you finish it. Your ticks stay in this browser.">
            <KitSteps steps={KIT_STEPS} />
          </Band>

          <Band title="Updates and help">
            <ul className={styles.facts}>
              <li><strong>Updates are included.</strong> When the kit is improved, the newest version is the one you download here. There is nothing more to pay.</li>
              <li><strong>The site stays open.</strong> Every tool here works for everyone, with or without the kit.</li>
              <li><strong>Need a hand?</strong> Email <a href={`mailto:${KIT_CONTACT_EMAIL}?subject=Ready%20to%20Build%20Kit`}>{KIT_CONTACT_EMAIL}</a>. If the kit isn&apos;t what you expected, write within {KIT_REFUND_DAYS} days of buying and you&apos;ll get your money back.</li>
            </ul>
          </Band>
        </div>
      </main>
    );
  }

  const note = DOOR_NOTES[one("state")] ?? (access ? DOOR_NOTES[access.state] : undefined);
  return (
    <main>
      <div className="page" style={{ maxWidth: 760 }}>
        <Masthead kicker={KIT_NAME} title="Your kit" lead="This page is for people who bought the Ready to Build Kit." />
        {note ? <p className={styles.notice} role="status">{note}</p> : null}
        <Band title="Bought the kit?">
          <ul className={styles.facts}>
            <li>Open your kit link on this device. It starts with <code>stepinthering.com/kit/open</code> and was on this page right after you paid.</li>
            <li>Lost it? Email <a href={`mailto:${KIT_CONTACT_EMAIL}?subject=My%20Ready%20to%20Build%20Kit%20link`}>{KIT_CONTACT_EMAIL}</a> from the address you paid with, and we&apos;ll send it again.</li>
          </ul>
        </Band>
        <Band title="Haven't got it?">
          <ul className={styles.facts}>
            <li><Link href="/products/ready-to-build#kit">See what&apos;s in the kit</Link> before you decide.</li>
            <li>Everything else here stays open to everyone, no account needed. <Link href="/tools">Start with the tools</Link>.</li>
          </ul>
        </Band>
      </div>
    </main>
  );
}
