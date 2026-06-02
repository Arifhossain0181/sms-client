"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, cubicBezier } from "framer-motion";
import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { ArrowRight, Sparkles } from "lucide-react";

const stats = [
  { value: "100", label: "Awards &\nAchievements", align: "left" },
  { value: "50+", label: "Experienced\nteacher", align: "center" },
  { value: "30", label: "Years of\nGrowth", align: "center" },
  { value: "14", label: "Industry &\nUniversity Partners", align: "right" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: cubicBezier(0.22, 1, 0.36, 1), delay: i * 0.08 },
  }),
};

export default function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  // Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, smoothWheel: true });
    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden bg-[#f7f5f0]"
    >
      {/* Soft blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute top-20 right-0 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-10 sm:pt-24">
        {/* Eyebrow */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mx-auto flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 backdrop-blur"
        >
          <Sparkles size={14} className="text-emerald-600" />
          Excellence in Education
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={fadeUp}
          custom={1}
          initial="hidden"
          animate="show"
          className="mx-auto mt-6 max-w-3xl text-center text-4xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
        >
          Leading in achievements
          <br />
          shaping <span className="italic font-serif text-emerald-700">excellence</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          custom={2}
          initial="hidden"
          animate="show"
          className="mx-auto mt-5 max-w-xl text-center text-base text-slate-600"
        >
          Our school is committed to developing outstanding students through
          comprehensive education programs.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp}
          custom={3}
          initial="hidden"
          animate="show"
          className="mt-7 flex flex-wrap justify-center gap-3"
        >
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
          >
            Register Now
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-900"
          >
            View School Programs
          </Link>
        </motion.div>

        {/* Stats — staggered like reference */}
        <div className="relative mt-14 grid grid-cols-2 gap-y-10 sm:grid-cols-4 sm:gap-y-0">
          {stats.map((s, i) => (
            <motion.div
              key={s.value}
              variants={fadeUp}
              custom={4 + i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.5 }}
              className={`text-center ${
                i === 1 ? "sm:translate-y-10" : ""
              } ${i === 2 ? "sm:translate-y-10" : ""}`}
            >
              <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {s.value}
              </p>
              <p className="mt-1 whitespace-pre-line text-xs font-medium text-slate-500 sm:text-sm">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Hero image with parallax */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: cubicBezier(0.22, 1, 0.36, 1), delay: 0.4 }}
        className="relative mx-auto mt-6 max-w-6xl px-6 pb-20"
      >
        <div className="relative h-[420px] overflow-hidden rounded-3xl shadow-2xl shadow-slate-900/20 sm:h-[520px]">
          <motion.div style={{ y: imageY, scale: imageScale }} className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1920&q=80"
              alt="School campus"
              fill
              priority
              className="object-cover"
            />
          </motion.div>
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-900/30 to-transparent" />
        </div>
      </motion.div>
    </section>
  );
}
