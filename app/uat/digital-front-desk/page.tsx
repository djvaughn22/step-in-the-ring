import type { Metadata } from "next";
import Link from "next/link";
import RingMark from "../../site/RingMark";
import { isOwnerAuthed } from "../../owner/session";
import { DFD_OPEN_UAT_MODE } from "./lib/openMode";
import styles from "./front-desk.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Overview" };

export default async function DigitalFrontDeskLanding() {
  const owner = await isOwnerAuthed();
  return (
    <main className={styles.overview}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>A Step In The Ring workbench</p>
          <h1>Digital Front Desk</h1>
          <p className={styles.lead}>A clear place to ask.<br />A practical way to follow through.</p>
          <p className={styles.intro}>Customer requests, next steps, and the person taking care of them. Together in one place for small service businesses.</p>
          <Link className="btn btn-primary" href="/uat/digital-front-desk/request">Customer intake <span aria-hidden="true">→</span></Link>
          <p className={styles.caption}>Tell us what you need. No account required.</p>
        </div>
        <div className={styles.workbench} aria-hidden="true">
          <div className={styles.workbenchTop}><RingMark /><span>Room to get things done.</span></div>
          <div className={styles.paper}><span className={styles.eyebrow}>The path of a request</span><strong>Start with what you need.</strong><div><span>01</span> Request received</div><div><span>02</span> A person takes ownership</div><div><span>03</span> A clear next step</div></div>
        </div>
      </section>
      <aside className={styles.privateTools} aria-label="Owner tools">
        <div>
          <h2>Owner tools</h2>
          <p>
            {DFD_OPEN_UAT_MODE
              ? "Normally sign-in required — open for this UAT period."
              : "Private workspace · Sign-in required"}
          </p>
        </div>
        <nav aria-label="Owner tools"><Link href="/uat/digital-front-desk/desk">Owner’s desk →</Link><Link href="/uat/digital-front-desk/onboarding">Onboarding</Link><Link href="/uat/digital-front-desk/admin">Admin controls</Link>{owner && <Link href="/owner">Owner hub</Link>}</nav>
      </aside>
      <p className={styles.testNote}>Product test: requests are temporary. No service is booked and no messages are sent.</p>
    </main>
  );
}
