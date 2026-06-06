/**
 * Debug utility to check token state
 * Use: console.log(debugToken())
 */
export const debugToken = () => {
  if (typeof window === "undefined") {
    return { error: "Window not available" };
  }

  const getCookie = (name: string) => {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? match[2] : null;
  };

  const accessTokenCookie = getCookie("accessToken");
  const refreshTokenCookie = getCookie("refreshToken");
  const accessTokenStorage = localStorage.getItem("accessToken");
  const refreshTokenStorage = localStorage.getItem("refreshToken");
  const authUser = localStorage.getItem("auth-user");

  return {
    timestamp: new Date().toISOString(),
    cookies: {
      accessToken: accessTokenCookie ? `Present (${accessTokenCookie.length} chars)` : "Missing",
      refreshToken: refreshTokenCookie ? `Present (${refreshTokenCookie.length} chars)` : "Missing",
    },
    localStorage: {
      accessToken: accessTokenStorage ? `Present (${accessTokenStorage.length} chars)` : "Missing",
      refreshToken: refreshTokenStorage ? `Present (${refreshTokenStorage.length} chars)` : "Missing",
    },
    authUser: authUser ? JSON.parse(authUser) : "Missing",
    hasValidToken: !!(accessTokenCookie || accessTokenStorage),
  };
};
