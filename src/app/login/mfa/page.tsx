import { Suspense } from "react";
import { MfaForm } from "./mfa-form";

export default function MfaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <MfaForm />
    </Suspense>
  );
}
