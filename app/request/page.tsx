import type { Metadata } from "next";
import Link from "next/link";
import { Masthead, Sheet } from "../site/ui";
import RequestForm from "./RequestForm";
import { PAID_HELP_OPEN, PAUSED_LINE, PAUSED_TITLE } from "../site/paidHelp";

export const metadata: Metadata = !PAID_HELP_OPEN ? { title: "Paid help is paused", description: PAUSED_LINE, robots: { index: false } } : {
  title: "Request a project",
  description:
    "Ask for help publishing your draft, finishing it, or building a site. We reply by email with questions or a written quote. Nothing is booked or charged until you approve.",
};

export default function RequestPage() {
  if (!PAID_HELP_OPEN) return <Paused />;
  return (
    <Sheet>
      <Masthead
        kicker="Optional help"
        title="Request a project"
        lead="Tell us what you need: help publishing a draft you made here, finishing it, or a site built with you. We'll reply by email, usually within two business days, with questions or a written quote."
      />
      <ol className="rq-steps" aria-label="What happens next">
        <li><strong>You send this.</strong> A few sentences is enough.</li>
        <li><strong>We reply.</strong> Questions, or a written scope and fixed price.</li>
        <li><strong>You decide.</strong> Work starts only after you approve the written quote.</li>
      </ol>
      <RequestForm />
      <p className="rq-after">
        Rather write? <a href="mailto:ask@openmirrorllc.com?subject=Project%20request">ask@openmirrorllc.com</a>.
        Want to see what&apos;s included first? <Link href="/services">Services and prices</Link>.
      </p>
    </Sheet>
  );
}

/** While paid help is on hold (paidHelp.ts): no prices, no request, just the free way. */
function Paused() {
  return (
    <Sheet>
      <Masthead kicker="Paid help" title={PAUSED_TITLE} lead={PAUSED_LINE}>
        <div className="svc-mast-go">
          <Link className="btn btn-gold" href="/start">Start your website</Link>
          <Link className="text-link" href="/examples">See the examples&nbsp; →</Link>
        </div>
      </Masthead>
    </Sheet>
  );
}
