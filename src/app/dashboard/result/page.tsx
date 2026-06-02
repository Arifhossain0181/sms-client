"use client";

import { useState } from "react";
import ResultTable from "@/app/modules/result/ResultTable";
import MarksBySubjectForm from "@/app/modules/result/MarksBySubjectForm";

export default function ResultsPage() {
  const [activeTab, setActiveTab] = useState<"single" | "multi">("multi");

  return (
    <div>
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex gap-1 px-6 pt-6">
          <button
            onClick={() => setActiveTab("multi")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === "multi"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800"
            }`}
          >
            Mark by Subject
          </button>
          <button
            onClick={() => setActiveTab("single")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === "single"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800"
            }`}
          >
            Single Exam Marks
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "multi" && <MarksBySubjectForm />}
      {activeTab === "single" && <ResultTable />}
    </div>
  );
}