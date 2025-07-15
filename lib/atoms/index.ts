// Jotai atoms for component-level state management
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { WhatsAppDevice, PlanType } from "../api/types";

// Theme and preferences
export const themeAtom = atomWithStorage<"light" | "dark" | "system">("theme", "system");

// Device management
export const selectedDeviceAtom = atom<WhatsAppDevice | null>(null);
export const deviceFiltersAtom = atom({
  search: "",
  status: "all" as "all" | "online" | "offline" | "connecting",
  sortBy: "name" as "name" | "status" | "lastSeen" | "messages",
  sortOrder: "asc" as "asc" | "desc",
});

// Message sending
export const messageFormAtom = atom({
  deviceId: "",
  to: "",
  message: "",
  type: "text" as "text" | "image" | "document" | "audio" | "video",
  media: "",
});

// Subscription and billing
export const selectedPlanAtom = atom<PlanType | null>(null);
export const billingPreferencesAtom = atomWithStorage("billing-preferences", {
  autoRenew: true,
  invoiceEmail: "",
  paymentMethod: "",
});

// Usage tracking preferences
export const usagePreferencesAtom = atomWithStorage("usage-preferences", {
  alertThreshold: 0.8, // Alert when 80% of quota is used
  showDailyUsage: true,
  showWeeklyReports: true,
});

// Dashboard preferences
export const dashboardPreferencesAtom = atomWithStorage("dashboard-preferences", {
  refreshInterval: 30000, // 30 seconds
  showSystemHealth: true,
  showRecentMessages: true,
  messagesPerPage: 10,
  devicesPerPage: 10,
});

// Form states
export const deviceFormAtom = atom({
  name: "",
  deviceId: "",
  isEditing: false,
  editingDeviceId: "",
});

export const loginFormAtom = atom({
  email: "",
  password: "",
  rememberMe: false,
});

export const registerFormAtom = atom({
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  organizationName: "",
  acceptTerms: false,
});

// Search and filters
export const globalSearchAtom = atom("");
export const messageFiltersAtom = atom({
  search: "",
  type: "all" as "all" | "text" | "image" | "video" | "audio" | "document",
  direction: "all" as "all" | "inbound" | "outbound",
  dateRange: "today" as "today" | "week" | "month" | "custom",
  customDateStart: "",
  customDateEnd: "",
});

// Notification preferences
export const notificationPreferencesAtom = atomWithStorage("notification-preferences", {
  emailNotifications: true,
  pushNotifications: true,
  messageDeliveryStatus: true,
  deviceConnectionStatus: true,
  billingAlerts: true,
  usageAlerts: true,
  systemMaintenanceAlerts: true,
});

// Quick actions
export const quickActionsAtom = atom({
  recentDevices: [] as string[], // Device IDs
  favoriteContacts: [] as string[], // Phone numbers
  messageTemplates: [] as Array<{ name: string; content: string; category: string }>,
});

// Performance monitoring
export const performanceAtom = atom({
  apiResponseTimes: [] as number[],
  lastApiCall: null as Date | null,
  errorCount: 0,
  lastError: null as string | null,
});

// Derived atoms
export const filteredDevicesAtom = atom((get) => {
  const filters = get(deviceFiltersAtom);
  // This would be used with the actual devices data
  return filters;
});

export const unreadNotificationsCountAtom = atom((get) => {
  // This would calculate unread notifications based on actual data
  return 0;
});

export const currentUsagePercentageAtom = atom((get) => {
  // This would calculate usage percentage based on actual usage data
  return 0;
});
