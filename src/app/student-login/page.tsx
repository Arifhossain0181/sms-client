import { Suspense } from "react";
import StudentLoginForm from "@/app/modules/student/student-loginform";

export default function StudentLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <StudentLoginForm />
    </Suspense>
  );
}
