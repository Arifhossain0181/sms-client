"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import { motion } from "framer-motion";
import { Settings, Save, Calendar, BookOpen } from "lucide-react";
import type { Role } from "@/tyPes/auth.tyPes";

type SettingsData = Record<string, string>;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

export default function SettingsPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [settings, setSettings] = useState<SettingsData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ academicYear: "", gradingScale: "" });

  useEffect(() => {
    if (role && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get("/super-admin/settings");
        const payload = res.data?.data ?? res.data;
        setSettings(payload ?? {});
        setForm({
          academicYear: payload?.academicYear ?? "",
          gradingScale: payload?.gradingScale ?? "",
        });
      } catch {
        setSettings({});
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async (key: string, value: string) => {
    setSaving(true);
    setMessage(null);
    try {
      await api.put(`/super-admin/settings/${key}`, { value });
      setSettings((prev) => ({ ...prev, [key]: value }));
      setMessage("Setting saved.");
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage("Failed to save setting.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground mt-1">Global configuration for all schools.</p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm ${message.includes("saved") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible" className="rounded-2xl border border-border/60 bg-card/80 shadow-soft">
          <div className="p-6 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Academic Year</h3>
                <p className="text-xs text-muted-foreground">Default academic year across schools</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Current Academic Year</label>
              <input
                type="text"
                value={form.academicYear}
                onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                placeholder="e.g. 2024-2025"
                className="w-full px-3 py-2 rounded-xl bg-secondary/60 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <button
              onClick={() => handleSave("academicYear", form.academicYear)}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-medium shadow-elegant hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </motion.div>

        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible" className="rounded-2xl border border-border/60 bg-card/80 shadow-soft">
          <div className="p-6 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Grading Scale</h3>
                <p className="text-xs text-muted-foreground">Default grading scale configuration</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Grading Scale</label>
              <input
                type="text"
                value={form.gradingScale}
                onChange={(e) => setForm({ ...form, gradingScale: e.target.value })}
                placeholder="e.g. A+, A, B, C, D, F"
                className="w-full px-3 py-2 rounded-xl bg-secondary/60 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <button
              onClick={() => handleSave("gradingScale", form.gradingScale)}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-medium shadow-elegant hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </motion.div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 shadow-soft">
        <div className="p-6 border-b border-border/60">
          <h3 className="text-lg font-semibold">All System Settings</h3>
        </div>
        <div className="p-6">
          {Object.keys(settings).length === 0 ? (
            <p className="text-xs text-muted-foreground">No settings configured yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(settings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40">
                  <div>
                    <p className="text-sm font-medium">{key}</p>
                    <p className="text-xs text-muted-foreground">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
