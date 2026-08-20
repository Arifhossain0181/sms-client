"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
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
  Sparkles,
  Phone,
  Mail,
  Clock,
  Lightbulb,
} from "lucide-react";

const unwrap = <T,>(res: { data: any }) => (res.data?.data ?? res.data) as T;

type ChildDetail = {
  id: string;
  name: string;
  rollNumber?: number;
  class?: { id: string; name: string };
  section?: { id: string; name: string };
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
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
      <div className="relative min-h-screen overflow-hidden bg-slate-50/50 dark:bg-slate-950">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 -left-32 w-[500px] h-[500px] bg-sky-300/20 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 -right-32 w-[600px] h-[600px] bg-violet-300/20 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="relative w-full p-4 sm:p-6"
        >
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
            <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
              <motion.div
                animate={{ x: [0, 100, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
              />
              <div className="relative flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.08, rotate: 4 }}
                    className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 shadow-lg shadow-indigo-500/30 flex items-center justify-center"
                  >
                    <HeartHandshake className="w-6 h-6 text-white" />
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-white/40 dark:border-white/20"
                      animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2.4, repeat: Infinity }}
                    />
                  </motion.div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      Contact School
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      Send a message to the school administration.
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/parent" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                  Back to dashboard
                </Link>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-emerald-200/60 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/5 backdrop-blur-sm p-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Message Sent Successfully</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Thank you for contacting us. We will get back to you as soon as possible.
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSuccess(false)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
                >
                  <Send className="h-4 w-4" />
                  Send Another Message
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50/50 dark:bg-slate-950">
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 -left-32 w-[500px] h-[500px] bg-sky-300/20 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 -right-32 w-[600px] h-[600px] bg-violet-300/20 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-300/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="relative w-full p-4 sm:p-6 space-y-6"
      >
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          {/* Header */}
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.08, rotate: 4 }}
                  className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 shadow-lg shadow-indigo-500/30 flex items-center justify-center"
                >
                  <HeartHandshake className="w-6 h-6 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/40 dark:border-white/20"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Contact School
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Send a message to the school administration.
                  </p>
                </div>
              </div>
              <Link href="/dashboard/parent" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Link>
            </div>
          </div>

          {childrenLoading ? (
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full rounded-xl" />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div variants={container} initial="hidden" animate="show" className="lg:col-span-2 rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {localError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50/80 dark:bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 flex items-center gap-2"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      {localError}
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Child (optional)</label>
                    <select
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      className="w-full rounded-xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400/40 backdrop-blur-sm"
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
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Enter message subject"
                      className="w-full rounded-xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400/40 backdrop-blur-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your message here..."
                      rows={6}
                      className="w-full rounded-xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400/40 backdrop-blur-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={contactMutation.isPending}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                <motion.div variants={item} className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Contact Information</h3>
                  </div>
                  <div className="space-y-2.5 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                      <span>school@example.com</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                      <span>+880 1XXX-XXXXXX</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                      <span>Mon - Fri: 8:00 AM - 4:00 PM</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={item} className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Quick Tips</h3>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-500 mt-1.5 shrink-0" />
                      Be specific about your concern
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-500 mt-1.5 shrink-0" />
                      Include child&apos;s name and class
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-500 mt-1.5 shrink-0" />
                      Allow 1-2 business days for response
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-500 mt-1.5 shrink-0" />
                      For emergencies, call the office directly
                    </li>
                  </ul>
                </motion.div>
              </motion.div>
            </div>
          )}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
        >
          EduCore Parent Panel
        </motion.p>
      </motion.div>
    </div>
  );
}
