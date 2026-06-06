import { useEffect, useState } from "react";

/**
 * Hook to ensure Next.js hydration is complete before running effects
 * This prevents SSR/client mismatch issues with localStorage/cookies
 */
export const useHydration = () => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    console.log(`[HYDRATION] ✅ Client hydrated`);
  }, []);

  return isHydrated;
};
