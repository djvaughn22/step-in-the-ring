import type { Metadata } from "next";
import Link from "next/link";
import { Masthead, Sheet } from "../site/ui";
import RequestForm from "./RequestForm";

export const metadata: Metadata = {
  title: "Request a project",
  description:
    "Tell us about the website or web app you have in mind. We reply by email with questions or a written quote. Nothing is booked or charged until you approve.",
};

export default function RequestPage() {
  return (
    <Sheet>
      <Masthead
        kicker="Build it with us"
        title="Request a project"
        lead="Tell us what you have in mind. We'll reply by email, usually within two business days, with questions or a written quote."
      />
      <ol className="rq-steps" aria-label="What happens next">
        <li><strong>You send this.</strong> A few sentences is enough.</li>
        <li><strong>We reply.</strong> Questions, or a written scope and fixed price.</li>
        <li><strong>You decide.</strong> Work starts only after you approve and pay the deposit.</li>
      </ol>
      <RequestForm />
      <p className="rq-after">
        Rather write? <a href="mailto:ask@openmirrorllc.com?subject=Project%20request">ask@openmirrorllc.com</a>.
        Want to see what&apos;s included first? <Link href="/services">Services and prices</Link>.
      </p>
    </Sheet>
  );
}
