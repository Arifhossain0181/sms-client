"use client";

import Admission from "@/app/Pages/Admission";

export default function CreateAdmissionAdminPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-12">
      <div className="max-w-4xl mx-auto pt-8 px-4">
        <Admission isAdmin={true} />
      </div>
    </div>
  );
}
