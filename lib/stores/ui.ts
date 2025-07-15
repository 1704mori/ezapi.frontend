// UI state management using Zustand
import { create } from "zustand";

interface UIState {
  // Sidebar
  isSidebarOpen: boolean;

  // Modals
  isCreateDeviceModalOpen: boolean;
  isDeleteDeviceModalOpen: boolean;
  selectedDeviceId: string | null;

  // Loading states
  isPageLoading: boolean;

  // Notifications
  notifications: Array<{
    id: string;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message?: string;
    timestamp: number;
  }>;
}

interface UIActions {
  // Sidebar
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Modals
  openCreateDeviceModal: () => void;
  closeCreateDeviceModal: () => void;
  openDeleteDeviceModal: (deviceId: string) => void;
  closeDeleteDeviceModal: () => void;

  // Loading
  setPageLoading: (loading: boolean) => void;

  // Notifications
  addNotification: (notification: Omit<UIState["notifications"][0], "id" | "timestamp">) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState & UIActions>()((set, get) => ({
  // State
  isSidebarOpen: true,
  isCreateDeviceModalOpen: false,
  isDeleteDeviceModalOpen: false,
  selectedDeviceId: null,
  isPageLoading: false,
  notifications: [],

  // Actions
  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  setSidebarOpen: (open) => {
    set({ isSidebarOpen: open });
  },

  openCreateDeviceModal: () => {
    set({ isCreateDeviceModalOpen: true });
  },

  closeCreateDeviceModal: () => {
    set({ isCreateDeviceModalOpen: false });
  },

  openDeleteDeviceModal: (deviceId) => {
    set({ isDeleteDeviceModalOpen: true, selectedDeviceId: deviceId });
  },

  closeDeleteDeviceModal: () => {
    set({ isDeleteDeviceModalOpen: false, selectedDeviceId: null });
  },

  setPageLoading: (loading) => {
    set({ isPageLoading: loading });
  },

  addNotification: (notification) => {
    const id = Math.random().toString(36).substr(2, 9);
    const timestamp = Date.now();

    set((state) => ({
      notifications: [...state.notifications, { ...notification, id, timestamp }],
    }));

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      get().removeNotification(id);
    }, 5000);
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },
}));
