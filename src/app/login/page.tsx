import { Suspense } from "react";
import LoginForm from "@/app/modules/auth/loginform";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginForm />
    </Suspense>
  );
}
