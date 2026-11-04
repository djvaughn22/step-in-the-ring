import { KIT_CONTACT_EMAIL, KIT_CONTENTS, KIT_NAME, KIT_PAGE_COUNT, KIT_REFUND_DAYS, kitPrice } from "../../kit/kit";
import CheckoutNote from "./CheckoutNote";
import styles from "./ready.module.css";

// The offer. page.tsx renders it only while sales are open (kitSalesOpen), so
// nothing here ever shows a price for something that can't be bought.
// Order on purpose: what it is → what's inside → price and button → what
// happens after you pay.
export default function KitOffer() {
  const price = kitPrice();
  return (
    <section id="kit" className={styles.section} aria-labelledby="kit-heading">
      <div className={styles.sectionIntro}>
        <span className="kicker">The {KIT_NAME}</span>
        <h2 id="kit-heading">The whole path in one workbook, with your own page on this site.</h2>
        <p>The pages here walk you through it one screen at a time. The kit puts every step in one printable workbook, adds setup checklists for Windows, Mac and Linux, and gives you a kit page that keeps your place.</p>
      </div>

      <div className={styles.kitOffer}>
        <div>
          <h3>In the workbook</h3>
          <p className={styles.small}>A {KIT_PAGE_COUNT}-page PDF. Print it, or keep it open next to your editor.</p>
          <ol className={styles.contents}>
            {KIT_CONTENTS.map((c) => (
              <li key={c.title}><strong>{c.title}</strong><span>{c.what}</span></li>
            ))}
          </ol>
        </div>

        <aside className={styles.buyCard} aria-labelledby="buy-heading">
          <h3 id="buy-heading">{KIT_NAME}</h3>
          <p className={styles.price}><strong>{price}</strong><span>one payment</span></p>
          <ul className={styles.includes}>
            <li>The workbook: a {KIT_PAGE_COUNT}-page PDF you download</li>
            <li>Your kit page on this site: download it any time and tick off the six steps</li>
            <li>Updates to the kit, at no extra cost</li>
          </ul>
          <form method="post" action="/api/kit/checkout">
            <button type="submit" className="btn btn-gold btn-big">Buy the kit · {price}</button>
          </form>
          <p className={styles.small}>No subscription and no account. You pay on Stripe&apos;s secure checkout page.</p>
          <CheckoutNote />
        </aside>
      </div>

      <div className={styles.after}>
        <h3>What happens after you pay</h3>
        <ol className={styles.afterSteps}>
          <li><strong>You land on your kit page.</strong> Stripe sends you straight back here, and the download is right there.</li>
          <li><strong>You get your kit link.</strong> Save it or email it to yourself. It opens your kit on any phone or computer, and this browser remembers you for a year.</li>
          <li><strong>You work through the six steps.</strong> Each one links to the page on this site that helps with it. Tick them off as you go.</li>
        </ol>
        <p className={styles.small}>Stripe emails your receipt. Lost your link? Email {KIT_CONTACT_EMAIL} from the address you paid with. If the kit isn&apos;t what you expected, write within {KIT_REFUND_DAYS} days for a full refund. Every tool on this site stays open to everyone, with or without the kit.</p>
      </div>
    </section>
  );
}
