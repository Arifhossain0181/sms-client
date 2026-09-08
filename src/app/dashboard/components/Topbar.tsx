import { Menu, Search, Sun, Moon, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";

interface TopbarProps {
  onToggleSidebar: () => void;
}

export const Topbar = ({ onToggleSidebar }: TopbarProps) => {
  const { theme, toggle } = useTheme();
  const { user, role, logout } = useAuth();
  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    SCHOOL_ADMIN: "School Admin",
    ACCOUNTANT: "Accountant",
    TEACHER: "Teacher",
    STUDENT: "Student",
    PARENT: "Parent",
    EXAM_CONTROLLER: "Exam Controller",
    HR: "HR",
  };
  const displayName = user?.name || "User";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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

        <div className="ml-2 flex items-center gap-3 pl-3 border-l border-border/60">
          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold shadow-elegant">
            {initials || "U"}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold leading-tight">{displayName}</p>
            <p className="text-xs text-muted-foreground">{role ? roleLabels[role] ?? role : "User"}</p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-red-50 px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-600 hover:text-white dark:bg-red-500/15 dark:text-red-300 dark:hover:bg-red-500 dark:hover:text-white"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </div>
    </motion.header>
  );
};
