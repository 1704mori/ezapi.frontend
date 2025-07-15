import { getCookie, setCookie, deleteCookie } from "cookies-next";

// Cookie names
const AUTH_TOKEN_COOKIE = "auth_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

// Cookie options
const cookieOptions = {
  // secure: process.env.NODE_ENV === 'production',
  sameSite: "lax" as const,
  path: "/",
};

// Token management functions
export const getAuthToken = (): string | null => {
  try {
    const token = getCookie(AUTH_TOKEN_COOKIE);
    return typeof token === "string" ? token : null;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

export const setAuthToken = (token: string): void => {
  try {
    setCookie(AUTH_TOKEN_COOKIE, token, {
      ...cookieOptions,
      maxAge: 60 * 15, // 15 minutes
      httpOnly: false, // Allow JavaScript access
    });
  } catch (error) {
    console.error("Error setting auth token:", error);
  }
};

export const getRefreshToken = (): string | null => {
  try {
    const token = getCookie(REFRESH_TOKEN_COOKIE);
    return typeof token === "string" ? token : null;
  } catch (error) {
    console.error("Error getting refresh token:", error);
    return null;
  }
};

export const setRefreshToken = (token: string): void => {
  try {
    setCookie(REFRESH_TOKEN_COOKIE, token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 90, // 90 days (3 months)
      httpOnly: false, // Allow JavaScript access
    });
  } catch (error) {
    console.error("Error setting refresh token:", error);
  }
};

export const removeAuthTokens = (): void => {
  try {
    deleteCookie(AUTH_TOKEN_COOKIE, { path: "/" });
    deleteCookie(REFRESH_TOKEN_COOKIE, { path: "/" });
  } catch (error) {
    console.error("Error removing auth tokens:", error);
  }
};

// Helper function to check if we're on the client side
export const isClient = (): boolean => {
  return typeof window !== "undefined";
};

// Helper function to decode JWT payload (client-side only, for expiration check)
const decodeJWTPayload = (token: string): any => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
};

// Check if token is expired or will expire soon (within 2 minutes)
export const isTokenExpiredOrExpiringSoon = (token: string | null): boolean => {
  if (!token) return true;

  const payload = decodeJWTPayload(token);
  if (!payload || !payload.exp) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  const bufferTime = 2 * 60; // 2 minutes buffer

  return payload.exp <= currentTime + bufferTime;
};

// Check if refresh token is valid and not expired
export const isRefreshTokenValid = (): boolean => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const payload = decodeJWTPayload(refreshToken);
  if (!payload || !payload.exp) return false;

  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp > currentTime;
};
