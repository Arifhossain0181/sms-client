"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useLenis } from "@/hooks/useLenis";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/axios";
import {
  UsersRound,
  HeartHandshake,
  ArrowLeft,
  Send,
  Inbox,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const unwrap = <T,>(res: { data: any }) => (res.data?.data ?? res.data) as T;

type ChildDetail = {
  id: string;
  name: string;
  rollNumber?: number;
  class?: { id: string; name: string };
  section?: { id: string; name: string };
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function ParentContactPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const isParent = role === "PARENT";

  const { data: children = [], isLoading: childrenLoading } = useQuery({
    queryKey: ["parents", "children"],
    queryFn: async () => {
      const res = await api.get("/parents/me/children-detailed");
      const payload = unwrap<ChildDetail[]>(res);
      return Array.isArray(payload) ? payload : [];
    },
    enabled: isParent,
  });

  const selectedChild = useMemo(
    () => children[0],
    [children]
  );

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [childName, setChildName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const contactMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/parents/me/contact", {
        subject,
        message,
        childName: childName || undefined,
      });
      return unwrap<{ success: boolean; messageId?: string }>(res);
    },
    onSuccess: () => {
      setSuccess(true);
      setSubject("");
      setMessage("");
      setChildName("");
    },
    onError: () => {
      setLocalError("Failed to send message. Please try again.");
    },
  });

  useEffect(() => {
    if (isParent && children.length > 0) {
      setChildName(children[0].name);
    }
  }, [isParent, children]);

  useEffect(() => {
    if (role && role !== "PARENT") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  if (!isParent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">You do not have permission to view this page.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!subject.trim() || !message.trim()) {
      setLocalError("Subject and message are required.");
      return;
    }
    await contactMutation.mutateAsync();
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contact School</h1>
            <p className="text-sm text-muted-foreground">Send a message to the school administration.</p>
          </div>
          <Link href="/dashboard/parent" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 shadow-soft text-center"
        >
          <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Message Sent Successfully</h2>
          <p className="text-sm text-muted-foreground">
            Thank you for contacting us. We will get back to you as soon as possible.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20"
          >
            Send Another Message
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contact School</h1>
          <p className="text-sm text-muted-foreground">Send a message to the school administration.</p>
        </div>
        <Link href="/dashboard/parent" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>

      {childrenLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="lg:col-span-2 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {localError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  {localError}
                </motion.div>
              )}

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Child (optional)</label>
                <select
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="w-full rounded-lg border border-border/60 bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                >
                  <option value="">General Inquiry</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.name}>
                      {child.name} ({child.class?.name ?? "Class"} - {child.section?.name ?? "Section"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter message subject"
                  className="w-full rounded-lg border border-border/60 bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message here..."
                  rows={6}
                  className="w-full rounded-lg border border-border/60 bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-muted-foreground resize-none"
                />
              </div>

              <motion.button
                type="submit"
                disabled={contactMutation.isPending}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:shadow-violet-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {contactMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Message
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
              <div className="flex items-center gap-2 mb-3">
                <HeartHandshake className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                <h3 className="text-sm font-semibold text-foreground">Contact Information</h3>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>School Administration Office</p>
                <p>Mon - Fri: 8:00 AM - 4:00 PM</p>
                <p>Email: school@example.com</p>
                <p>Phone: +880 1XXX-XXXXXX</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
              <h3 className="text-sm font-semibold text-foreground mb-2">Quick Tips</h3>
              <ul className="space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
                <li>Be specific about your concern</li>
                <li>Include child&apos;s name and class</li>
                <li>Allow 1-2 business days for response</li>
                <li>For emergencies, call the office directly</li>
              </ul>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
