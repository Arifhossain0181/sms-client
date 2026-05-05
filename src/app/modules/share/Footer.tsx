"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Globe,
  MessageSquare,
  Mail,
  ArrowUpRight,
  Send,
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

export default function Footer() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
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
    <motion.footer
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8 }}
      className="relative overflow-hidden bg-gradient-to-b from-transparent via-blue-50/40 to-blue-100/60 backdrop-blur-xl border-t border-white/30"
    >
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8">
        {/* Top section: Brand + Newsletter + Links */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Brand block */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-5"
          >
            <Link href="/" className="group inline-flex items-center gap-2.5">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 p-2 shadow-lg shadow-blue-500/30"
              >
                <GraduationCap className="h-5 w-5 text-white" />
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                EduCore Institutional
              </span>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-600">
              Advancing K-10 education through robust digital ecosystems and
              data-driven administrative clarity. Trusted by 200+ districts
              worldwide.
            </p>

            {/* Newsletter */}
            <form onSubmit={handleSubscribe} className="mt-8 max-w-sm">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Stay Updated
              </label>
              <div className="relative mt-3 flex items-center">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.edu"
                  className="w-full rounded-full border border-white/60 bg-white/50 px-5 py-3 pr-14 text-sm text-slate-700 placeholder:text-slate-400 backdrop-blur-md outline-none transition-all focus:border-blue-400 focus:bg-white/80 focus:shadow-lg focus:shadow-blue-500/10"
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute right-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/30"
                >
                  <AnimatePresence mode="wait">
                    {subscribed ? (
                      <motion.span
                        key="check"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                      >
                        ✓
                      </motion.span>
                    ) : (
                      <motion.span
                        key="send"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Send className="h-4 w-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </form>

            {/* Social icons with ripple hover */}
            <div className="mt-8 flex gap-3">
              {socialIcons.map(({ Icon, label, href }, i) => (
                <motion.a
                  key={label}
                  href={href}
                  aria-label={label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                  whileHover="hover"
                  className="group relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/60 bg-white/50 backdrop-blur-md transition-colors hover:border-blue-400"
                >
                  <motion.span
                    variants={{
                      hover: { scale: 2.5, opacity: 0 },
                    }}
                    initial={{ scale: 0, opacity: 0.4 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 m-auto h-6 w-6 rounded-full bg-blue-400"
                  />
                  <Icon className="relative h-4 w-4 text-slate-600 transition-colors group-hover:text-blue-700" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            {Object.entries(footerLinks).map(([category, links], colIdx) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + colIdx * 0.1 }}
              >
                <h3 className="text-xs font-bold uppercase tracking-widest text-blue-700">
                  {category}
                </h3>
                <ul className="mt-5 space-y-3">
                  {links.map((link) => {
                    const id = `${category}-${link.label}`;
                    return (
                      <li
                        key={link.label}
                        onMouseEnter={() => setHoveredLink(id)}
                        onMouseLeave={() => setHoveredLink(null)}
                        className="relative"
                      >
                        <Link
                          href={link.href}
                          className="group relative inline-flex items-center gap-1 text-sm text-slate-600 transition-colors hover:text-blue-700"
                        >
                          <span className="relative">
                            {link.label}
                            {hoveredLink === id && (
                              <motion.span
                                layoutId="footer-underline"
                                className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                                transition={{
                                  type: "spring",
                                  stiffness: 380,
                                  damping: 30,
                                }}
                              />
                            )}
                          </span>
                          <ArrowUpRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
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
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="my-12 h-px origin-left bg-gradient-to-r from-transparent via-blue-300/60 to-transparent"
        />

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-col items-center justify-between gap-4 text-xs text-slate-500 sm:flex-row"
        >
          <p className="uppercase tracking-wider">
            © 2024 EduCore Institutional Systems. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/version"
              className="relative uppercase tracking-wider hover:text-blue-700 transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-blue-700 after:scale-x-100"
            >
              System Version 2.4.0
            </Link>
            <Link
              href="/authority"
              className="uppercase tracking-wider hover:text-blue-700 transition-colors"
            >
              Institutional Authority
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Giant watermark text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 0.04 } : {}}
        transition={{ duration: 1.5, delay: 0.8 }}
        className="pointer-events-none select-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[12rem] font-black tracking-tighter text-blue-900"
      >
        EDUCORE
      </motion.div>
    </motion.footer>
  );
}
