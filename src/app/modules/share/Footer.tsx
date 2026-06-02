"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence,cubicBezier } from "framer-motion";
import {
  GraduationCap,
  Globe,
  MessageSquare,
  Mail,
  ArrowUpRight,
  Send,
  Check,
  Sparkles,
} from "lucide-react";

const footerLinks = {
  Resources: [
    { label: "Staff Directory", href: "/staff" },
    { label: "Academic Calendar", href: "/calendar" },
    { label: "Help Center", href: "/help" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Data Compliance", href: "/compliance" },
    { label: "Terms of Use", href: "/terms" },
  ],
  Support: [
    { label: "Contact Support", href: "/contact" },
    { label: "Technical Status", href: "/status" },
    { label: "API Docs", href: "/docs" },
  ],
};

const socialIcons = [
  { Icon: Globe, label: "Website", href: "#" },
  { Icon: MessageSquare, label: "Chat", href: "#" },
  { Icon: Mail, label: "Email", href: "mailto:hello@educore.edu" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: cubicBezier(0.22, 1, 0.36, 1) },
  }),
};

export default function Footer() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail("");
      }, 2500);
    }
  };

  return (
    <footer
      ref={ref}
      className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-50/50 border-t border-slate-200/60"
    >
      {/* Subtle animated background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-gradient-to-br from-sky-300/25 to-indigo-400/15 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-violet-300/25 to-fuchsia-400/15 blur-3xl"
        />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-6">
        {/* Top section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Brand block */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate={isInView ? "show" : "hidden"}
            custom={0}
            className="lg:col-span-5 space-y-4"
          >
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <motion.div
                whileHover={{ rotate: -8, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30"
              >
                <GraduationCap className="h-4.5 w-4.5" />
              </motion.div>
              <span className="text-lg font-extrabold bg-gradient-to-r from-slate-900 via-indigo-700 to-violet-700 bg-clip-text text-transparent tracking-tight">
                EduCore Institutional
              </span>
            </Link>

            <p className="max-w-md text-xs leading-relaxed text-slate-600">
              Advancing K-10 education through robust digital ecosystems and
              data-driven administrative clarity. Trusted by{" "}
              <span className="font-semibold text-indigo-700">200+ districts</span>{" "}
              worldwide.
            </p>

            {/* Newsletter */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-indigo-500" />
                <h4 className="text-[10px] font-bold tracking-[0.18em] text-slate-700 uppercase">
                  Stay Updated
                </h4>
              </div>
              <form onSubmit={handleSubscribe} className="relative max-w-sm">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.edu"
                  className="w-full rounded-full border border-white/80 bg-white/70 px-4 py-2 pr-11 text-xs text-slate-700 placeholder:text-slate-400 backdrop-blur-md outline-none transition-all focus:border-indigo-400 focus:bg-white focus:shadow-md focus:shadow-indigo-500/10"
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 grid place-items-center h-8 w-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-600/30"
                >
                  <AnimatePresence mode="wait">
                    {subscribed ? (
                      <motion.span
                        key="check"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="send"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </form>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-2 pt-1">
              {socialIcons.map(({ Icon, label, href }) => (
                <motion.a
                  key={label}
                  href={href}
                  aria-label={label}
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="group relative grid place-items-center h-9 w-9 rounded-full border border-slate-200 bg-white/70 backdrop-blur text-slate-600 hover:text-white overflow-hidden"
                >
                  <span className="absolute inset-0 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600" />
                  <Icon className="relative h-3.5 w-3.5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Link columns */}
          <div className="lg:col-span-7 grid grid-cols-3 gap-6">
            {Object.entries(footerLinks).map(([category, links], colIdx) => (
              <motion.div
                key={category}
                variants={fadeUp}
                initial="hidden"
                animate={isInView ? "show" : "hidden"}
                custom={colIdx + 1}
              >
                <h4 className="text-[10px] font-bold tracking-[0.18em] text-slate-700 uppercase mb-3">
                  {category}
                </h4>
                <ul className="space-y-2">
                  {links.map((link) => {
                    const id = `${category}-${link.label}`;
                    const active = hoveredLink === id;
                    return (
                      <li
                        key={link.label}
                        onMouseEnter={() => setHoveredLink(id)}
                        onMouseLeave={() => setHoveredLink(null)}
                      >
                        <Link
                          href={link.href}
                          className="group inline-flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-700 transition-colors"
                        >
                          <span className="relative">
                            {link.label}
                            <motion.span
                              initial={false}
                              animate={{ scaleX: active ? 1 : 0 }}
                              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                              style={{ originX: 0 }}
                              className="absolute -bottom-0.5 left-0 right-0 h-[1.5px] bg-gradient-to-r from-indigo-500 to-violet-500"
                            />
                          </span>
                          <motion.span
                            animate={{
                              x: active ? 2 : 0,
                              y: active ? -2 : 0,
                              opacity: active ? 1 : 0.4,
                            }}
                            transition={{ duration: 0.2 }}
                          >
                            <ArrowUpRight className="h-3 w-3" />
                          </motion.span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Divider with shimmer */}
        <div className="relative my-6 h-px overflow-hidden bg-slate-200/70">
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent"
          />
        </div>

        {/* Bottom bar */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          custom={5}
          className="flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <p className="text-[11px] text-slate-500">
            © 2024 <span className="font-semibold text-slate-700">EduCore Institutional Systems</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 backdrop-blur px-2.5 py-1 text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              v2.4.0
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-2.5 py-1 text-white font-semibold">
              Institutional Authority
            </span>
          </div>
        </motion.div>
      </div>

      {/* Slim watermark */}
      <div className="pointer-events-none relative overflow-hidden -mt-2">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center text-[7vw] font-black leading-[0.85] tracking-tighter bg-gradient-to-b from-slate-200/60 via-indigo-200/30 to-transparent bg-clip-text text-transparent select-none"
        >
          EDUCORE
        </motion.h2>
      </div>
    </footer>
  );
}
