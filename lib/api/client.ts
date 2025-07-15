// Updated API Client with standardized response handling
import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  DevicesResponse,
  DeviceResponse,
  WhatsAppDevice,
  CreateDeviceRequest,
  UpdateDeviceRequest,
  SendMessageRequest,
  SendMessageResponse,
  PlansResponse,
  CurrentSubscriptionResponse,
  CreateSubscriptionRequest,
  Usage,
  UsageResponse,
  WorkerStatsResponse,
  GetMessagesResponse,
  Message,
  MessageTemplate,
  MessageTemplatesResponse,
  MessageTemplateResponse,
  CreateMessageTemplateRequest,
  UpdateMessageTemplateRequest,
  HealthResponse,
  CurrentUsageResponse,
  PaymentMethodRequest,
  UpdatePaymentMethodResponse,
  BillingHistoryResponse,
} from "./types";
import { ErrorCode } from "./types";
import {
  getAuthToken,
  setAuthToken,
  getRefreshToken,
  setRefreshToken,
  removeAuthTokens,
  isTokenExpiredOrExpiringSoon,
  isRefreshTokenValid,
} from "../cookies";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public details?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Generic API client with standardized response handling
class ApiClient {
  private baseURL: string;
  private isRefreshing = false;
  private refreshPromise: Promise<AuthResponse> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async ensureValidToken(): Promise<void> {
    if (this.isRefreshing && this.refreshPromise) {
      await this.refreshPromise;
      return;
    }

    const refreshTokenValue = getRefreshToken();
    if (!refreshTokenValue || !isRefreshTokenValid()) {
      throw new ApiError(ErrorCode.INVALID_TOKEN, "No valid refresh token available", 401);
    }

    this.isRefreshing = true;
    this.refreshPromise = this.request<AuthResponse>(
      "/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      },
      true,
    );

    try {
      const response = await this.refreshPromise;
      if (response.success && response.data) {
        setAuthToken(response.data.accessToken);
        setRefreshToken(response.data.refreshToken);
        console.log("Token refreshed successfully");
      } else {
        throw new ApiError(ErrorCode.TOKEN_EXPIRED, "Failed to refresh token", 401);
      }
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async request<T extends ApiResponse>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false,
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Check if we need to refresh the token before making the request
    if (endpoint !== "/auth/refresh" && endpoint !== "/auth/login" && endpoint !== "/auth/register") {
      const currentToken = getAuthToken();
      if (isTokenExpiredOrExpiringSoon(currentToken)) {
        try {
          await this.ensureValidToken();
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          removeAuthTokens();
          throw new ApiError(ErrorCode.TOKEN_EXPIRED, "Session expired. Please log in again.", 401);
        }
      }
    }

    const token = getAuthToken();
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        // Try to parse error response
        let errorResponse: ApiResponse;
        try {
          errorResponse = await response.json();
        } catch {
          // Fallback for non-JSON responses
          throw new ApiError(ErrorCode.NETWORK_ERROR, response.statusText || "Network error occurred", response.status);
        }

        // Handle 401 Unauthorized - try to refresh token and retry
        if (
          response.status === 401 &&
          !isRetry &&
          endpoint !== "/auth/refresh" &&
          endpoint !== "/auth/login" &&
          endpoint !== "/auth/register"
        ) {
          try {
            await this.ensureValidToken();
            // Retry the request with the new token
            return this.request<T>(endpoint, options, true);
          } catch (refreshError) {
            console.error("Token refresh retry failed:", refreshError);
            removeAuthTokens();
            throw new ApiError(ErrorCode.TOKEN_EXPIRED, "Session expired. Please log in again.", 401);
          }
        }

        // Throw standardized error
        if (errorResponse.error) {
          throw new ApiError(
            errorResponse.error.code,
            errorResponse.error.message,
            response.status,
            errorResponse.error.details,
          );
        } else {
          throw new ApiError(ErrorCode.NETWORK_ERROR, "An unexpected error occurred", response.status);
        }
      }

      const jsonResponse: T = await response.json();

      // Validate response format
      if (typeof jsonResponse.success !== "boolean") {
        throw new ApiError(ErrorCode.NETWORK_ERROR, "Invalid response format from server", response.status);
      }

      // Check if response indicates an error
      if (!jsonResponse.success && jsonResponse.error) {
        throw new ApiError(
          jsonResponse.error.code,
          jsonResponse.error.message,
          response.status,
          jsonResponse.error.details,
        );
      }

      return jsonResponse;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ApiError(ErrorCode.NETWORK_ERROR, error.message, 0);
      }
      throw new ApiError(ErrorCode.NETWORK_ERROR, "Network error occurred", 0);
    }
  }

  // Health check
  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>("/health");
  }

  // Authentication
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.success && response.data) {
      console.log("API client - About to set tokens");

      // Store tokens
      setAuthToken(response.data.accessToken);
      setRefreshToken(response.data.refreshToken);

      console.log("API client - Tokens should be set now");
    }

    return response;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.success && response.data) {
      // Store tokens
      setAuthToken(response.data.accessToken);
      setRefreshToken(response.data.refreshToken);
    }

    return response;
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshTokenValue = getRefreshToken();
    if (!refreshTokenValue || !isRefreshTokenValid()) {
      throw new ApiError(ErrorCode.INVALID_TOKEN, "No valid refresh token available", 401);
    }

    const response = await this.request<AuthResponse>(
      "/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      },
      true,
    );

    if (response.success && response.data) {
      // Update tokens
      setAuthToken(response.data.accessToken);
      setRefreshToken(response.data.refreshToken);
      console.log("Manual token refresh successful");
    }

    return response;
  }

  // Devices
  async getDevices(page = 1, limit = 10): Promise<DevicesResponse> {
    return this.request<DevicesResponse>(`/devices?page=${page}&limit=${limit}`);
  }

  async getDevice(id: string): Promise<DeviceResponse> {
    return this.request<DeviceResponse>(`/devices/${id}`);
  }

  async createDevice(data: CreateDeviceRequest): Promise<DeviceResponse> {
    return this.request<DeviceResponse>("/devices", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateDevice(id: string, data: UpdateDeviceRequest): Promise<DeviceResponse> {
    return this.request<DeviceResponse>(`/devices/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteDevice(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/devices/${id}`, {
      method: "DELETE",
    });
  }

  async connectDevice(id: string): Promise<ApiResponse<{ qrCode?: string }>> {
    return this.request<ApiResponse<{ qrCode?: string }>>(`/devices/${id}/connect`, {
      method: "POST",
    });
  }

  async disconnectDevice(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/devices/${id}/disconnect`, {
      method: "POST",
    });
  }

  async startDevice(deviceId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/devices/${deviceId}/start`, {
      method: "POST",
    });
  }

  async stopDevice(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/devices/${id}/stop`, {
      method: "POST",
    });
  }

  async restartDevice(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/devices/${id}/restart`, {
      method: "POST",
    });
  }

  async syncDevice(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/devices/${id}/sync`, {
      method: "POST",
    });
  }

  async getDeviceQR(id: string): Promise<ApiResponse<{ qrCode: string }>> {
    return this.request<ApiResponse<{ qrCode: string }>>(`/devices/${id}/qr`);
  }

  // Messages
  async getMessages(
    params: {
      page?: number;
      limit?: number;
      deviceId?: string;
      direction?: "inbound" | "outbound";
      search?: string;
    } = {},
  ): Promise<GetMessagesResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<GetMessagesResponse>(`/messages?${searchParams.toString()}`);
  }

  async sendMessage(data: SendMessageRequest): Promise<SendMessageResponse> {
    return this.request<SendMessageResponse>("/messages/send", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async sendMessageWithBilling(data: SendMessageRequest): Promise<SendMessageResponse> {
    return this.request<SendMessageResponse>("/messages/send-with-billing", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Message Templates
  async getMessageTemplates(): Promise<MessageTemplatesResponse> {
    return this.request<MessageTemplatesResponse>("/messages/templates");
  }

  async getMessageTemplate(id: string): Promise<MessageTemplateResponse> {
    return this.request<MessageTemplateResponse>(`/messages/templates/${id}`);
  }

  async createMessageTemplate(data: CreateMessageTemplateRequest): Promise<MessageTemplateResponse> {
    return this.request<MessageTemplateResponse>("/messages/templates", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateMessageTemplate(id: string, data: UpdateMessageTemplateRequest): Promise<MessageTemplateResponse> {
    return this.request<MessageTemplateResponse>(`/messages/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteMessageTemplate(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/messages/templates/${id}`, {
      method: "DELETE",
    });
  }

  // Subscriptions
  async getPlans(): Promise<PlansResponse> {
    return this.request<PlansResponse>("/subscriptions/plans");
  }

  async getCurrentSubscription(): Promise<CurrentSubscriptionResponse> {
    return this.request<CurrentSubscriptionResponse>("/subscriptions/current");
  }

  async createSubscription(data: CreateSubscriptionRequest): Promise<ApiResponse<{ clientSecret?: string }>> {
    return this.request<ApiResponse<{ clientSecret?: string }>>("/subscriptions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async cancelSubscription(): Promise<ApiResponse> {
    return this.request<ApiResponse>("/subscriptions/cancel", {
      method: "POST",
    });
  }

  // Usage
  async getUsage(period?: string): Promise<UsageResponse> {
    const params = period ? `?period=${period}` : "";
    return this.request<UsageResponse>(`/usage${params}`);
  }

  async getCurrentUsage(): Promise<CurrentUsageResponse> {
    return this.request<CurrentUsageResponse>("/usage/current");
  }

  // Workers
  async getWorkerStats(): Promise<WorkerStatsResponse> {
    return this.request<WorkerStatsResponse>("/workers/stats");
  }

  // Billing methods
  async updatePaymentMethod(data: PaymentMethodRequest): Promise<UpdatePaymentMethodResponse> {
    return this.request<UpdatePaymentMethodResponse>("/billing/payment-method", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getBillingHistory(): Promise<BillingHistoryResponse> {
    return this.request<BillingHistoryResponse>("/billing/history");
  }

  // Worker ping method
  async pingWorkers(): Promise<ApiResponse<Array<{ workerId: string; status: string; latency: number }>>> {
    return this.request<ApiResponse<Array<{ workerId: string; status: string; latency: number }>>>("/workers/ping", {
      method: "POST",
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Re-export types
export type { ApiResponse, ApiError as ApiErrorType };
export { ErrorCode };

// Re-export token management functions for backward compatibility
export { getAuthToken, setAuthToken, getRefreshToken, setRefreshToken, removeAuthTokens };
