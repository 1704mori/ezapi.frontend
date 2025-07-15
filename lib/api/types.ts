// Updated API Types with standardized response format

// Standard API Response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// Error codes enum matching backend
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INVALID_TOKEN = "INVALID_TOKEN",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",

  // Validation
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  REQUIRED_FIELD_MISSING = "REQUIRED_FIELD_MISSING",

  // Resources
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  RESOURCE_CONFLICT = "RESOURCE_CONFLICT",

  // Business Logic
  SUBSCRIPTION_REQUIRED = "SUBSCRIPTION_REQUIRED",
  SUBSCRIPTION_LIMIT_EXCEEDED = "SUBSCRIPTION_LIMIT_EXCEEDED",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",

  // System
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",

  // Network/Connection
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  stripeCustomerId: string;
  createdAt: string;
  updatedAt: string;
}

export type PlanType = "starter" | "professional" | "enterprise";
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "past_due"
  | "paused"
  | "trialing"
  | "unpaid";
export type DeviceStatus = "online" | "offline" | "connecting";

export interface Subscription {
  id: string;
  organizationId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  planType: PlanType;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  canceledAt?: string;
  trialStart?: string;
  trialEnd?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PlanFeatures {
  id: string;
  planType: PlanType;
  messagesIncluded: number;
  devicesIncluded: number;
  storageIncludedGB: number;
  pricePerMessage?: string;
  monthlyPrice: string;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppDevice {
  id: string;
  organizationId: string;
  name: string;
  phoneNumber?: string;
  status: DeviceStatus;
  qrCode?: string;
  lastSeen?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  organizationId: string;
  deviceId: string;
  messageId: string;
  direction: "inbound" | "outbound";
  fromNumber: string;
  toNumber: string;
  messageType: "text" | "image" | "video" | "audio" | "document";
  content?: string;
  mediaUrl?: string;
  mediaSizeMB?: string;
  timestamp: string;
  createdAt: string;
  // Extended properties for outbound messages
  to?: string;
  from?: string;
  type?: "text" | "image" | "video" | "document";
  status?: "pending" | "sent" | "delivered" | "read" | "failed";
  updatedAt?: string;
  mediaType?: string;
  errorMessage?: string;

  device?: WhatsAppDevice;
}

export interface Usage {
  id: string;
  organizationId: string;
  subscriptionId: string;
  period: string; // YYYY-MM format
  messagesUsed: number;
  storageUsedMB: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerStats {
  id: string;
  endpoint: string;
  status: "available" | "busy" | "error" | "offline";
  lastPing: string;
  currentLoad: number;
  maxCapacity: number;
  healthScore: number;
  metadata?: Record<string, unknown>;
}

export interface MessageTemplate {
  id: string;
  organizationId: string;
  name: string;
  content: string;
  variables: string[];
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingHistory {
  id: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed";
  description: string;
  invoiceUrl?: string;
  createdAt: string;
}

export interface PaymentMethodRequest {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  cardholderName: string;
}

// Request interfaces
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

export interface CreateDeviceRequest {
  name: string;
}

export interface UpdateDeviceRequest {
  name?: string;
}

export interface SendMessageRequest {
  deviceId: string;
  to: string;
  message: string;
  type?: "text" | "image" | "document" | "audio" | "video";
  media?: string;
}

export interface CreateSubscriptionRequest {
  planType: PlanType;
  paymentMethodId?: string;
}

export interface CreateMessageTemplateRequest {
  name: string;
  content: string;
  variables: string[];
  category?: string;
}

export interface UpdateMessageTemplateRequest {
  name?: string;
  content?: string;
  variables?: string[];
  category?: string;
}

// Response type aliases using standardized format
export type AuthResponse = ApiResponse<{
  user: User;
  organization: Organization;
  accessToken: string;
  refreshToken: string;
}>;

export type DevicesResponse = ApiResponse<{
  devices: WhatsAppDevice[];
}>;

export type DeviceResponse = ApiResponse<{
  device: WhatsAppDevice;
}>;

export type GetMessagesResponse = ApiResponse<{
  messages: Message[];
}>;

export type SendMessageResponse = ApiResponse<{
  messageId: string;
  status: string;
  message?: string;
}>;

export type PlansResponse = ApiResponse<{
  plans: PlanFeatures[];
}>;

export type CurrentSubscriptionResponse = ApiResponse<{
  subscription?: Subscription;
  planFeatures?: PlanFeatures;
}>;

export type UsageResponse = ApiResponse<{
  usage: Usage;
}>;

export type WorkerStatsResponse = ApiResponse<{
  workers: WorkerStats[];
}>;

export type MessageTemplatesResponse = ApiResponse<{
  templates: MessageTemplate[];
}>;

export type MessageTemplateResponse = ApiResponse<{
  template: MessageTemplate;
}>;

// Legacy interface for backwards compatibility during migration
export interface ApiError {
  error: string;
  message: string;
  status?: number;
}

// Health check response
export type HealthResponse = ApiResponse<{
  status: string;
  timestamp: string;
  version: string;
  nats: string;
}>;

// Response types for billing
export type CurrentUsageResponse = ApiResponse<{
  usage: Usage;
}>;

export type BillingHistoryResponse = ApiResponse<{
  history: BillingHistory[];
}>;

export type UpdatePaymentMethodResponse = ApiResponse<{
  success: boolean;
}>;
