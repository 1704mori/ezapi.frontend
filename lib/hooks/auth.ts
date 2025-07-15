// Authentication hooks using cookies-next
"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "../stores/auth";
import { isTokenExpiredOrExpiringSoon, getAuthToken, isRefreshTokenValid } from "../cookies";
import { apiClient } from "../api/client";

/**
 * Hook to initialize auth state from cookies on app startup
 */
export const useAuthInitializer = () => {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check authentication status on mount
    checkAuth();

    // Set up periodic token validation (every 5 minutes)
    const validateTokens = async () => {
      try {
        const currentToken = getAuthToken();
        console.log("Proactively refreshing token...");

        // If access token is expired or expiring soon, and we have a valid refresh token
        if (isTokenExpiredOrExpiringSoon(currentToken) && isRefreshTokenValid()) {
          console.log("Proactively refreshing token...");
          // The API client will handle the refresh automatically on next request
          // We can trigger a lightweight request to force refresh
          await apiClient.health();
        } else if (!isRefreshTokenValid()) {
          console.log("Refresh token invalid, logging out...");
          clearAuth();
        }
      } catch (error) {
        console.error("Token validation error:", error);
        // Don't clear auth here as the error might be temporary
      }
    };

    intervalRef.current = setInterval(validateTokens, 5 * 60 * 1000); // Every 5 minutes

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkAuth, clearAuth]);
};
