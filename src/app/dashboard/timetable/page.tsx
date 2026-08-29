"use client";

import { useLenis } from "@/hooks/useLenis";
import { useAuth } from "@/hooks/useAuth";
import TimetableGrid from "../../modules/timetable/TimetableGrid";

export default function TimetablePage() {
  useLenis();
  const { role } = useAuth();

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Timetable</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {role === "TEACHER"
              ? "Your assigned classes routine"
              : role === "STUDENT"
              ? "Your class weekly routine"
              : "Weekly routine by class"}
          </p>
        </div>
      </div>
      <TimetableGrid />
    </div>
  );
}
