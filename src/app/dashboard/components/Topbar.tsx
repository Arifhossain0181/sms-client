import { Bell, Menu, Search, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";

interface TopbarProps {
  onToggleSidebar: () => void;
}

export const Topbar = ({ onToggleSidebar }: TopbarProps) => {
  const { theme, toggle } = useTheme();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-30 glass flex items-center justify-between gap-4 px-6 lg:px-10 py-4"
    >
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary hover:bg-secondary/70"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="relative w-full max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search records, students, or faculty..."
          className="w-full pl-11 pr-4 py-2.5 rounded-full bg-secondary/60 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
        />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={toggle}
          className="relative w-10 h-10 rounded-full bg-secondary hover:bg-secondary/70 flex items-center justify-center transition-colors"
          aria-label="Toggle theme"
        >
          <motion.div
            key={theme}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-10 h-10 rounded-full bg-secondary hover:bg-secondary/70 flex items-center justify-center"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive animate-pulse-glow" />
        </motion.button>

        <div className="ml-2 flex items-center gap-3 pl-3 border-l border-border/60">
          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold shadow-elegant">
            AD
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold leading-tight">Admin Dey</p>
            <p className="text-xs text-muted-foreground">Principal</p>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
