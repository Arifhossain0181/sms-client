"use client";

import { NOTICE_TARGETS } from "@/app/modules/notice/notice.target.meta";

interface RoleTargetSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RoleTargetSelect({ value, onChange }: RoleTargetSelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800/60 py-2.5 pl-4 pr-10 text-sm text-slate-900 dark:text-white outline-none transition focus:border-indigo-500 dark:focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-400/30"
      >
        <option value="">Select target</option>
        {NOTICE_TARGETS.map((target) => (
          <option key={target.value} value={target.value}>
            {target.label}
          </option>
        ))}
      </select>
    </div>
  );
}
