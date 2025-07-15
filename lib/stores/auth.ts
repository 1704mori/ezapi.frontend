// Authentication store using Zustand
import { create } from "zustand";
import type { User, Organization } from "../api/types";
import { getAuthToken, removeAuthTokens, isTokenExpiredOrExpiringSoon, isRefreshTokenValid } from "../cookies";

interface AuthState {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  setAuth: (user: User, organization: Organization) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState & AuthActions>()((set, get) => ({
  // State
  user: null,
  organization: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Actions
  setAuth: (user, organization) => {
    set({
      user,
      organization,
      isAuthenticated: true,
      error: null,
    });
  },

  clearAuth: () => {
    console.log("clearAuth - Removing auth tokens");
    removeAuthTokens();
    set({
      user: null,
      organization: null,
      isAuthenticated: false,
      error: null,
    });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },

  checkAuth: () => {
    const token = getAuthToken();
    const hasValidRefreshToken = isRefreshTokenValid();

    console.log("checkAuth - token:", token);
    console.log("checkAuth - hasValidRefreshToken:", hasValidRefreshToken);
    console.log("checkAuth - current auth state:", get().isAuthenticated);

    // If we don't have a valid refresh token, we can't maintain the session
    if (!hasValidRefreshToken) {
      console.log("checkAuth - No valid refresh token, clearing auth");
      if (get().isAuthenticated) {
        get().clearAuth();
      }
      return false;
    }

    // If we have a refresh token but no access token, we're still "authenticated"
    // The API client will handle refreshing the access token automatically
    const isAuthenticated = !!token || hasValidRefreshToken;

    if (!isAuthenticated && get().isAuthenticated) {
      console.log("checkAuth - Clearing auth because no valid tokens found");
      get().clearAuth();
    }

    return isAuthenticated;
  },
}));
