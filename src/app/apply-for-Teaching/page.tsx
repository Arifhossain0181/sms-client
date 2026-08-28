import { Suspense } from "react";
import ApplyForTeaching from "@/app/Pages/ApplyForTeaching";

export default function ApplyForTeachingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ApplyForTeaching />
    </Suspense>
  );
}
