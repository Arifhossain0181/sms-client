"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/app/modules/share/navbar";
import Footer from "@/app/modules/share/Footer";

export default function RouteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-24">{children}</main>
      <Footer />
    </>
  );
}
