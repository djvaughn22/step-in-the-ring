import { Suspense } from "react";
import SignupContent from "./SignupContent";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <SignupContent />
    </Suspense>
  );
}
