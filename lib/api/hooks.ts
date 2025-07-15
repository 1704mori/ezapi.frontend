// Updated API hooks with standardized response handling
"use client";

import { useMutation, useQuery, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { apiClient, ApiError, type ApiResponse } from "./client";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  DevicesResponse,
  DeviceResponse,
  CreateDeviceRequest,
  UpdateDeviceRequest,
  SendMessageRequest,
  SendMessageResponse,
  PlansResponse,
  CurrentSubscriptionResponse,
  CreateSubscriptionRequest,
  UsageResponse,
  WorkerStatsResponse,
  GetMessagesResponse,
  MessageTemplatesResponse,
  MessageTemplateResponse,
  CreateMessageTemplateRequest,
  UpdateMessageTemplateRequest,
  HealthResponse,
  CurrentUsageResponse,
  BillingHistoryResponse,
  UpdatePaymentMethodResponse,
  PaymentMethodRequest,
} from "./types";

// Query Keys
export const queryKeys = {
  health: ["health"] as const,
  devices: ["devices"] as const,
  device: (id: string) => ["devices", id] as const,
  deviceQR: (id: string) => ["devices", id, "qr"] as const,
  messages: (params?: Record<string, any>) => ["messages", params] as const,
  messageTemplates: ["message-templates"] as const,
  messageTemplate: (id: string) => ["message-templates", id] as const,
  plans: ["plans"] as const,
  subscription: ["subscription"] as const,
  usage: (period?: string) => ["usage", period] as const,
  currentUsage: ["usage", "current"] as const,
  billingHistory: ["billing", "history"] as const,
  workers: ["workers"] as const,
};

// Health
export function useHealth(): UseQueryResult<HealthResponse, ApiError> {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: async () => await apiClient.health(),
    staleTime: 30000, // 30 seconds
  });
}

// Authentication hooks
export function useLogin(): UseMutationResult<AuthResponse, ApiError, LoginRequest> {
  return useMutation({
    mutationFn: async (data: LoginRequest) => await apiClient.login(data),
  });
}

export function useRegister(): UseMutationResult<AuthResponse, ApiError, RegisterRequest> {
  return useMutation({
    mutationFn: async (data: RegisterRequest) => await apiClient.register(data),
  });
}

export function useRefreshToken(): UseMutationResult<AuthResponse, ApiError, void> {
  return useMutation({
    mutationFn: async () => await apiClient.refreshToken(),
  });
}

// Device hooks
export function useDevices(page = 1, limit = 10): UseQueryResult<DevicesResponse, ApiError> {
  return useQuery({
    queryKey: [...queryKeys.devices, { page, limit }],
    queryFn: async () => await apiClient.getDevices(page, limit),
  });
}

export function useDevice(id: string): UseQueryResult<DeviceResponse, ApiError> {
  return useQuery({
    queryKey: queryKeys.device(id),
    queryFn: async () => await apiClient.getDevice(id),
    enabled: !!id,
  });
}

export function useCreateDevice(): UseMutationResult<DeviceResponse, ApiError, CreateDeviceRequest> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDeviceRequest) => await apiClient.createDevice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices });
    },
  });
}

export function useUpdateDevice(id: string): UseMutationResult<DeviceResponse, ApiError, UpdateDeviceRequest> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateDeviceRequest) => await apiClient.updateDevice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices });
      queryClient.invalidateQueries({ queryKey: queryKeys.device(id) });
    },
  });
}

export function useDeleteDevice(): UseMutationResult<ApiResponse["data"], ApiError, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.deleteDevice(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices });
    },
  });
}

export function useConnectDevice(): UseMutationResult<ApiResponse<{ qrCode?: string }>, ApiError, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => await apiClient.connectDevice(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.device(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.devices });
    },
  });
}

export function useDisconnectDevice(): UseMutationResult<ApiResponse["data"], ApiError, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.disconnectDevice(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.device(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.devices });
    },
  });
}

export function useStartDevice(): UseMutationResult<ApiResponse["data"], ApiError, { deviceId: string }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deviceId }: { deviceId: string }) => {
      const response = await apiClient.startDevice(deviceId);
      return response.data;
    },
    onSuccess: (_, { deviceId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.device(deviceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.devices });
    },
  });
}

export function useStopDevice(): UseMutationResult<ApiResponse["data"], ApiError, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.stopDevice(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.device(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.devices });
    },
  });
}

export function useRestartDevice(): UseMutationResult<ApiResponse["data"], ApiError, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.restartDevice(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.device(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.devices });
    },
  });
}

export function useSyncDevice(): UseMutationResult<ApiResponse["data"], ApiError, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.syncDevice(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.device(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.devices });
    },
  });
}

export function useDeviceQR(id: string): UseQueryResult<ApiResponse<{ qrCode: string }>, ApiError> {
  return useQuery({
    queryKey: queryKeys.deviceQR(id),
    queryFn: async () => await apiClient.getDeviceQR(id),
    enabled: !!id,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}

// Message hooks
export function useMessages(
  params: {
    page?: number;
    limit?: number;
    deviceId?: string;
    direction?: "inbound" | "outbound";
    search?: string;
  } = {},
): UseQueryResult<GetMessagesResponse, ApiError> {
  return useQuery({
    queryKey: queryKeys.messages(params),
    queryFn: async () => await apiClient.getMessages(params),
  });
}

export function useSendMessage(): UseMutationResult<SendMessageResponse, ApiError, SendMessageRequest> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendMessageRequest) => await apiClient.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages() });
      queryClient.invalidateQueries({ queryKey: queryKeys.usage() });
    },
  });
}

export function useSendMessageWithBilling(): UseMutationResult<SendMessageResponse, ApiError, SendMessageRequest> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendMessageRequest) => await apiClient.sendMessageWithBilling(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages() });
      queryClient.invalidateQueries({ queryKey: queryKeys.usage() });
    },
  });
}

// Message Template hooks
export function useMessageTemplates(): UseQueryResult<MessageTemplatesResponse, ApiError> {
  return useQuery({
    queryKey: queryKeys.messageTemplates,
    queryFn: async () => await apiClient.getMessageTemplates(),
  });
}

export function useMessageTemplate(id: string): UseQueryResult<MessageTemplateResponse, ApiError> {
  return useQuery({
    queryKey: queryKeys.messageTemplate(id),
    queryFn: async () => await apiClient.getMessageTemplate(id),
    enabled: !!id,
  });
}

export function useCreateMessageTemplate(): UseMutationResult<
  MessageTemplateResponse,
  ApiError,
  CreateMessageTemplateRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMessageTemplateRequest) => await apiClient.createMessageTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messageTemplates });
    },
  });
}

export function useUpdateMessageTemplate(
  id: string,
): UseMutationResult<MessageTemplateResponse, ApiError, UpdateMessageTemplateRequest> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateMessageTemplateRequest) => await apiClient.updateMessageTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messageTemplates });
      queryClient.invalidateQueries({ queryKey: queryKeys.messageTemplate(id) });
    },
  });
}

export function useDeleteMessageTemplate(): UseMutationResult<ApiResponse["data"], ApiError, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.deleteMessageTemplate(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messageTemplates });
    },
  });
}

// Subscription hooks
export function usePlans(): UseQueryResult<PlansResponse, ApiError> {
  return useQuery({
    queryKey: queryKeys.plans,
    queryFn: async () => await apiClient.getPlans(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCurrentSubscription(): UseQueryResult<CurrentSubscriptionResponse, ApiError> {
  return useQuery({
    queryKey: queryKeys.subscription,
    queryFn: async () => await apiClient.getCurrentSubscription(),
  });
}

export function useCreateSubscription(): UseMutationResult<
  ApiResponse<{ clientSecret?: string }>,
  ApiError,
  CreateSubscriptionRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSubscriptionRequest) => await apiClient.createSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription });
    },
  });
}

export function useCancelSubscription(): UseMutationResult<ApiResponse["data"], ApiError, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.cancelSubscription();
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription });
    },
  });
}

// Usage hooks
export function useUsage(
  params: { page?: number; limit?: number; period?: string } = {},
): UseQueryResult<UsageResponse, ApiError> {
  return useQuery({
    queryKey: queryKeys.usage(params.period),
    queryFn: async () => await apiClient.getUsage(params.period),
  });
}

export function useCurrentUsage(): UseQueryResult<CurrentUsageResponse, ApiError> {
  return useQuery({
    queryKey: queryKeys.currentUsage,
    queryFn: async () => await apiClient.getCurrentUsage(),
    refetchInterval: 60000, // Refetch every minute
  });
}

// Worker stats
export function useWorkerStats(): UseQueryResult<WorkerStatsResponse, ApiError> {
  return useQuery({
    queryKey: queryKeys.workers,
    queryFn: async () => await apiClient.getWorkerStats(),
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

// Billing & Payment hooks
export function useUpdatePaymentMethod(): UseMutationResult<
  any,
  ApiError,
  {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvc: string;
    cardholderName: string;
  }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => apiClient.updatePaymentMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["billing-history"] });
    },
  });
}

export function useBillingHistory(): UseQueryResult<any, ApiError> {
  return useQuery({
    queryKey: ["billing-history"],
    queryFn: () => apiClient.getBillingHistory(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Error handling utilities
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

export function getErrorCode(error: unknown): string | undefined {
  if (isApiError(error)) {
    return error.code;
  }
  return undefined;
}
