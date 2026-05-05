import { useAuthStore } from "@/store/authstore";
import { authService } from "@/service/auth.service";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useAuth = () => {
  const { user, setUser, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authService.logout();
      logout();
      toast.success("Logout সফল!");
      router.push("/login");
    } catch {
      toast.error("Logout failed");
    }
  };

  return {
    user,
    setUser,
    logout: handleLogout,
    isAuthenticated: !!user,
    role: user?.role ?? null,
  };
};