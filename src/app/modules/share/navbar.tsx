"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, GraduationCap, LogIn, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "Students", href: "/students" },
  { name: "Apply for Admission", href: "/apply-for-admission" },
  { name: "Apply for Teaching", href: "/apply-for-Teaching" },
  { name: "Schedules", href: "/schedules" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [userOpen, setUserOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] border-b border-white/20"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-20">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2">
          <motion.div
            whileHover={{ rotate: -10, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="p-2 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-lg shadow-sky-500/30"
          >
            <GraduationCap size={20} />
          </motion.div>
          <span className="text-xl font-bold bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
            EduCore K-10
          </span>
        </Link>

        {/* Desktop Links */}
        <ul
          className="hidden md:flex items-center gap-2 relative"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {navLinks.map((link, i) => (
            <li
              key={link.name}
              onMouseEnter={() => setHoveredIdx(i)}
              className="relative"
            >
              <Link
                href={link.href}
                className={`relative px-5 py-2 text-sm font-medium transition-colors duration-300 ${
                  scrolled ? "text-slate-700 hover:text-sky-600" : "text-slate-600 hover:text-sky-500"
                }`}
              >
                {hoveredIdx === i && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-sky-50 rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {link.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-slate-700 hover:text-sky-600"
              >
                Register
              </Link>
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/login"
                  className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-sky-500/30 overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-sky-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative">Portal Login</span>
                  <LogIn size={16} className="relative" />
                </Link>
              </motion.div>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setUserOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-bold">
                  {user?.name?.slice(0, 2).toUpperCase() || "U"}
                </span>
                <span className="hidden lg:block">{user?.name || "User"}</span>
                <User size={16} />
              </button>
              <AnimatePresence>
                {userOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-lg"
                  >
                    <div className="px-4 py-3 text-xs text-slate-500">
                      {user?.email}
                    </div>
                    <button
                      onClick={() => {
                        setUserOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50"
                    >
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
          className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden overflow-hidden bg-white/80 backdrop-blur-xl border-t border-white/20"
          >
            <ul className="flex flex-col px-6 py-4 gap-1">
              {navLinks.map((link, i) => (
                <motion.li
                  key={link.name}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 rounded-lg text-slate-700 font-medium hover:bg-sky-50 hover:text-sky-600 transition"
                  >
                    {link.name}
                  </Link>
                </motion.li>
              ))}
              {!isAuthenticated ? (
                <div className="mt-2 flex flex-col gap-2">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-slate-200 bg-white text-slate-700 font-semibold"
                  >
                    Register
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold"
                  >
                    Portal Login <LogIn size={16} />
                  </Link>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-red-500 text-white font-semibold"
                >
                  Logout
                </button>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
