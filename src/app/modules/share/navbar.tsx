"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X, GraduationCap, LogIn, User, ChevronDown, LogOut, Sparkles, Briefcase, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ThemeProvider";
import api from "@/lib/axios";

const BASE_NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "Students", href: "/students" },
  { name: "Careers", href: "/careers" },
  { name: "Apply for Admission", href: "/apply-for-admission" },
  { name: "Schedules", href: "/schedules" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [userOpen, setUserOpen] = useState(false);
  const [latestJobId, setLatestJobId] = useState<string | null>(null);
  const [openJobs, setOpenJobs] = useState<{ id: string; title: string; designation: string; department?: { name: string } }[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, logout, role } = useAuth();
  const { theme, toggle } = useTheme();

  const teachingHref = latestJobId ? `/apply-for-Teaching?jobId=${latestJobId}` : "/apply-for-Teaching";

  const navLinks = [
    ...BASE_NAV_LINKS.slice(0, 3),
    { name: "Careers", href: "/careers" },
    { name: "Apply for Admission", href: "/apply-for-admission" },
    { name: "Apply for Teaching", href: teachingHref },
    { name: "Schedules", href: "/schedules" },
  ];

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const id = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadOpenJobs = async () => {
      setJobsLoading(true);
      try {
        const res = await api.get("/recruitment/jobs/public");
        const payload = res.data?.data ?? res.data;
        const postings = payload.postings ?? [];
        if (!cancelled) {
          setOpenJobs(
            postings.map((p: any) => ({
              id: p.id,
              title: p.title,
              designation: p.designation,
              department: p.department,
            }))
          );
          if (postings.length > 0) {
            setLatestJobId(postings[0].id);
          }
        }
      } catch {
        if (!cancelled) {
          setOpenJobs([]);
        }
      } finally {
        if (!cancelled) setJobsLoading(false);
      }
    };
    loadOpenJobs();
    return () => { cancelled = true; };
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/70 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          : "bg-transparent"
      }`}
    >
      {/* Gradient top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/60 to-transparent" />

      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <motion.div
            whileHover={{ rotate: -8, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="relative grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25"
          >
            <GraduationCap className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
          </motion.div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-extrabold bg-gradient-to-r from-slate-900 via-indigo-700 to-violet-700 bg-clip-text text-transparent tracking-tight">
              EduCore
            </span>
            <span className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
              K – 10 Academy
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div
          className="hidden md:flex items-center gap-1 rounded-full border border-slate-200/70 bg-white/60 backdrop-blur-md px-2 py-1.5 shadow-sm"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {navLinks.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              onMouseEnter={() => setHoveredIdx(i)}
              className="relative px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              {hoveredIdx === i && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-100 via-indigo-100 to-violet-100"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{link.name}</span>
            </Link>
          )          )}
          <Link
            href={teachingHref}
            onMouseEnter={() => setHoveredIdx(navLinks.length - 1)}
            className="relative inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 rounded-full shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span className="relative z-10">Apply Now</span>
          </Link>
        </div>

        {/* Theme Toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={toggle}
          className="hidden md:inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 bg-white/80 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
          aria-label="Toggle theme"
        >
          <motion.span
            key={theme}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="block"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </motion.span>
        </motion.button>

        {/* Open Jobs Dropdown */}
        {openJobs.length > 0 && (
          <div className="hidden lg:block ml-2">
            <div className="group relative">
              <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold text-slate-700 bg-white/70 border border-slate-200 rounded-full hover:border-indigo-300 transition">
                <Briefcase className="h-3.5 w-3.5 text-indigo-500" />
                Open Positions ({openJobs.length})
              </button>
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Open Positions</p>
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {jobsLoading ? (
                    <div className="px-4 py-3 text-xs text-slate-500">Loading positions...</div>
                  ) : (
                    openJobs.map((job) => (
                      <Link
                        key={job.id}
                        href={`/apply-for-Teaching?jobId=${job.id}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gradient-to-r hover:from-sky-50 hover:to-indigo-50 transition group/item"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate group-hover/item:text-indigo-700 transition-colors">{job.title}</p>
                          <p className="text-xs text-slate-500 truncate">{job.designation}{job.department?.name ? ` · ${job.department.name}` : ''}</p>
                        </div>
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white px-2.5 py-1 text-xs font-semibold shadow-sm group-hover/item:shadow-md transition-all">
                          Apply
                        </span>
                      </Link>
                    ))
                  )}
                </div>
                <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60">
                  <Link href="/careers" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition">
                    View all careers →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="hidden md:flex items-center gap-2">
          {!isAuthenticated ? (
            <>
              <Link
                href="/register"
                className="group relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-500 group-hover:rotate-12 transition-transform" />
                Register
              </Link>
              <Link
                href="/login"
                className="group relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-slate-900 to-indigo-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/20 hover:shadow-indigo-900/40 transition-all hover:-translate-y-0.5"
              >
                <LogIn className="h-4 w-4" />
                Portal Login
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-400/0 via-sky-400/30 to-violet-400/0 opacity-0 group-hover:opacity-100 blur-md transition-opacity -z-10" />
              </Link>
            </>
          ) : (
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 backdrop-blur px-2 py-1.5 pr-3 text-sm font-semibold text-slate-700 shadow-sm hover:shadow-md transition"
              >
                <span className="grid place-items-center h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs">
                  {user?.name?.slice(0, 2).toUpperCase() || "U"}
                </span>
                <span className="max-w-[100px] truncate">{user?.name || "User"}</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${userOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {userOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-gradient-to-br from-sky-50 via-indigo-50 to-violet-50 border-b border-slate-100">
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-800 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setUserOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition"
          aria-label="Toggle menu"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={mobileOpen ? "x" : "m"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="block"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden bg-white/95 backdrop-blur-xl border-t border-slate-200"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 rounded-xl text-slate-700 font-medium hover:bg-gradient-to-r hover:from-sky-50 hover:to-indigo-50 hover:text-indigo-600 transition"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              )              )}
              {openJobs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.05 + 0.05 }}
                  className="space-y-1"
                >
                  <p className="px-4 pt-2 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">Open Positions</p>
                  {openJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/apply-for-Teaching?jobId=${job.id}`}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-indigo-100"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{job.title}</p>
                        <p className="text-xs text-slate-500 truncate">{job.designation}{job.department?.name ? ` · ${job.department.name}` : ''}</p>
                      </div>
                      <span className="shrink-0 inline-flex items-center rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white px-2.5 py-1 text-xs font-semibold">
                        Apply
                      </span>
                    </Link>
                  ))}
                </motion.div>
              )}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navLinks.length * 0.05 }}
              >
                <Link
                  href={teachingHref}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white font-semibold shadow-lg shadow-indigo-500/20"
                >
                  <Briefcase className="h-4 w-4" />
                  Apply for Teaching
                </Link>
              </motion.div>
              <div className="pt-3 border-t border-slate-100 mt-3">
                {!isAuthenticated ? (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                    >
                      <Sparkles className="h-4 w-4 text-indigo-500" />
                      Register
                    </Link>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-900 text-white font-semibold shadow-lg shadow-indigo-900/20"
                    >
                      <LogIn className="h-4 w-4" />
                      Portal Login
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-500 text-white font-semibold shadow-lg shadow-red-500/20"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
