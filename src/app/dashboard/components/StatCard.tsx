import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  icon: LucideIcon;
  label: string;
  value: string;
  numeric: number;
  prefix?: string;
  suffix?: string;
  trend: number;
  trendLabel?: string;
  delay?: number;
}

export const StatCard = ({
  icon: Icon,
  label,
  numeric,
  prefix = "",
  suffix = "",
  trend,
  trendLabel,
  delay = 0,
}: Props) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const dur = 1400;
    let raf = 0;

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(numeric * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [numeric]);

  const positive = trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6 }}
      className="group relative overflow-hidden rounded-2xl gradient-card border border-border/60 p-6 shadow-soft hover:shadow-elegant transition-all duration-300"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative flex items-start justify-between mb-6">
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-elegant group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
            positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          }`}
        >
          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {positive ? "+" : ""}
          {trend}%
        </div>
      </div>

      <p className="relative text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
        {label}
      </p>
      <h3 className="relative text-3xl font-bold tracking-tight">
        {prefix}{count.toLocaleString()}{suffix}
      </h3>
      {trendLabel && <p className="relative text-xs text-muted-foreground mt-2">{trendLabel}</p>}

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary overflow-hidden">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          transition={{ delay: delay + 0.3, duration: 1, ease: "easeOut" }}
          className="h-full gradient-primary"
        />
      </div>
    </motion.div>
  );
};
