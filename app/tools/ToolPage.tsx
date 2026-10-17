// The frame every free tool shares: a way back to the list, the title, one
// line on what it does, and the same plain privacy note. Server component.

import Link from "next/link";
import type { ReactNode } from "react";
import { Masthead } from "../site/ui";

export default function ToolPage({
  title,
  lead,
  children,
  next,
}: {
  title: string;
  lead: string;
  children: ReactNode;
  /** One honest "what to do after this" line. */
  next?: ReactNode;
}) {
  return (
    <main>
      <div className="page" style={{ maxWidth: 820 }}>
        <Link className="breadcrumb" href="/tools">← Tools</Link>
        <Masthead kicker="Tool" title={title} lead={lead} />
        <p className="ft-privacy">
          No account needed. What you type stays in this browser and is never sent anywhere.
        </p>
        {children}
        {next ? <div className="ft-next">{next}</div> : null}
      </div>
    </main>
  );
}
