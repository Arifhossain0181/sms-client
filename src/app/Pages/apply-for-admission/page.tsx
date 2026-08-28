import { Suspense } from "react";
import Admission from "@/app/Pages/Admission";

export default function ApplyForAdmissionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <Admission />
    </Suspense>
  );
}
