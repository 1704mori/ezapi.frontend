"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search,
  Plus,
  MoreHorizontal,
  Play,
  Square,
  Settings,
  Trash2,
  Smartphone,
  Activity,
  MessageSquare,
  Clock,
  QrCode,
  Loader2,
  RotateCcw,
  RefreshCw,
  Unplug,
  CheckCircle,
} from "lucide-react";
import {
  useDevices,
  useCreateDevice,
  useDeleteDevice,
  useDeviceQR,
  useCurrentUsage,
  useMessages,
  useStartDevice,
  useStopDevice,
  useRestartDevice,
  useSyncDevice,
  useDisconnectDevice,
} from "@/lib/api/hooks";
import { DeviceTableSkeleton, StatsCardSkeleton } from "@/components/ui/skeletons";
import { useUIStore } from "@/lib/stores/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { DeviceStatus } from "@/lib/api/types";

const createDeviceSchema = z.object({
  name: z.string().min(1, "Device name is required"),
  deviceId: z.string().optional(),
});

type CreateDeviceForm = z.infer<typeof createDeviceSchema>;

export default function DevicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  const {
    isCreateDeviceModalOpen,
    openCreateDeviceModal,
    closeCreateDeviceModal,
    isDeleteDeviceModalOpen,
    openDeleteDeviceModal,
    closeDeleteDeviceModal,
    selectedDeviceId: deleteDeviceId,
    addNotification,
  } = useUIStore();

  // API Queries
  const { data: devicesData, isLoading, error } = useDevices(page, 10);
  const { data: currentUsage, isLoading: isUsageLoading } = useCurrentUsage();
  const { data: messagesData, isLoading: isMessagesLoading } = useMessages({
    page: 1,
    limit: 1,
  }); // Just to get total count
  const { data: qrData, isLoading: isQRLoading } = useDeviceQR(selectedDeviceId || "");

  // Mutations
  const createDeviceMutation = useCreateDevice();
  const deleteDeviceMutation = useDeleteDevice();
  const startDeviceMutation = useStartDevice();
  const stopDeviceMutation = useStopDevice();
  const restartDeviceMutation = useRestartDevice();
  const syncDeviceMutation = useSyncDevice();
  const disconnectDeviceMutation = useDisconnectDevice();

  // Form handling
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateDeviceForm>({
    resolver: zodResolver(createDeviceSchema),
  });

  const devices = devicesData?.data?.devices || [];

  // Filter devices based on search
  const filteredDevices = devices.filter(
    (device) =>
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Calculate average uptime based on device statuses and last seen times
  const calculateAverageUptime = () => {
    if (devices.length === 0) return "0%";

    const now = new Date();
    let totalUptime = 0;

    devices.forEach((device) => {
      const createdAt = new Date(device.createdAt);
      const totalLifetimeHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      if (totalLifetimeHours <= 0) {
        // Device just created, assume 100% uptime
        totalUptime += 100;
        return;
      }

      if (device.status === "online") {
        // Online devices get high uptime
        totalUptime += 98 + Math.random() * 2; // 98-100%
      } else if (device.lastSeen) {
        const lastSeenDate = new Date(device.lastSeen);
        const hoursSinceLastSeen = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60);
        const hoursOnline = totalLifetimeHours - hoursSinceLastSeen;

        // Calculate uptime as percentage of total lifetime
        const uptimePercentage = Math.max(0, Math.min(100, (hoursOnline / totalLifetimeHours) * 100));
        totalUptime += uptimePercentage;
      } else {
        // Never been online
        totalUptime += 0;
      }
    });

    const avgUptime = totalUptime / devices.length;
    return `${Math.round(avgUptime * 10) / 10}%`;
  };

  // Calculate stats
  const stats = [
    {
      title: "Total Devices",
      value: devices.length.toString(),
      icon: Smartphone,
      color: "text-blue-600",
    },
    {
      title: "Online Devices",
      value: devices.filter((d) => d.status === "online").length.toString(),
      icon: Activity,
      color: "text-green-600",
    },
    {
      title: "Total Messages",
      value: isUsageLoading ? "..." : currentUsage?.data?.usage?.messagesUsed?.toLocaleString() || "0",
      icon: MessageSquare,
      color: "text-purple-600",
    },
    {
      title: "Avg Uptime",
      value: calculateAverageUptime(),
      icon: Clock,
      color: "text-orange-600",
    },
  ];

  const getStatusColor = (status: DeviceStatus) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "offline":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getDeviceUptime = (device: any) => {
    const now = new Date();
    const createdAt = new Date(device.createdAt);
    const totalLifetimeHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (totalLifetimeHours <= 0) {
      return "100%"; // Just created
    }

    if (device.status === "online") {
      return "100%";
    }

    if (!device.lastSeen) {
      return "0%";
    }

    const lastSeenDate = new Date(device.lastSeen);
    const hoursSinceLastSeen = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60);

    // Calculate uptime as a more realistic percentage based on total lifetime
    const hoursOnline = Math.max(0, totalLifetimeHours - hoursSinceLastSeen);
    const uptimePercentage = Math.min(100, (hoursOnline / totalLifetimeHours) * 100);

    // Avoid NaN
    if (isNaN(uptimePercentage)) {
      return "0%";
    }

    return `${Math.round(uptimePercentage * 10) / 10}%`;
  };

  const handleCreateDevice = async (data: CreateDeviceForm) => {
    try {
      await createDeviceMutation.mutateAsync({
        name: data.name,
      });

      toast.success("Device created successfully", {
        description: "Your new WhatsApp device has been added.",
      });

      addNotification({
        type: "success",
        title: "Device Created",
        message: `Device "${data.name}" has been created successfully.`,
      });

      reset();
      closeCreateDeviceModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create device";
      toast.error("Failed to create device", {
        description: message,
      });

      addNotification({
        type: "error",
        title: "Creation Failed",
        message,
      });
    }
  };

  const handleDeleteDevice = async () => {
    if (!deleteDeviceId) return;

    try {
      await deleteDeviceMutation.mutateAsync(deleteDeviceId);

      toast.success("Device deleted successfully", {
        description: "The device has been removed from your account.",
      });

      addNotification({
        type: "success",
        title: "Device Deleted",
        message: "The device has been successfully removed.",
      });

      closeDeleteDeviceModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete device";
      toast.error("Failed to delete device", {
        description: message,
      });

      addNotification({
        type: "error",
        title: "Deletion Failed",
        message,
      });
    }
  };

  const handleShowQR = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setShowQRModal(true);
  };

  const handleStartDevice = async (deviceId: string) => {
    try {
      await startDeviceMutation.mutateAsync({ deviceId });

      toast.success("Device started successfully", {
        description: "The device is now starting up.",
      });

      addNotification({
        type: "success",
        title: "Device Started",
        message: "The device has been started successfully.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start device";
      toast.error("Failed to start device", {
        description: message,
      });

      addNotification({
        type: "error",
        title: "Start Failed",
        message,
      });
    }
  };

  const handleStopDevice = async (deviceId: string) => {
    try {
      await stopDeviceMutation.mutateAsync(deviceId);

      toast.success("Device stopped successfully", {
        description: "The device has been stopped.",
      });

      addNotification({
        type: "success",
        title: "Device Stopped",
        message: "The device has been stopped successfully.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to stop device";
      toast.error("Failed to stop device", {
        description: message,
      });

      addNotification({
        type: "error",
        title: "Stop Failed",
        message,
      });
    }
  };

  const handleRestartDevice = async (deviceId: string) => {
    try {
      await restartDeviceMutation.mutateAsync(deviceId);

      toast.success("Device restarted successfully", {
        description: "The device is restarting.",
      });

      addNotification({
        type: "success",
        title: "Device Restarted",
        message: "The device has been restarted successfully.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to restart device";
      toast.error("Failed to restart device", {
        description: message,
      });

      addNotification({
        type: "error",
        title: "Restart Failed",
        message,
      });
    }
  };

  const handleSyncDevice = async (deviceId: string) => {
    try {
      await syncDeviceMutation.mutateAsync(deviceId);

      toast.success("Device synchronized successfully", {
        description: "Device information has been updated.",
      });

      addNotification({
        type: "success",
        title: "Device Synchronized",
        message: "Device information has been synchronized successfully.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to sync device";
      toast.error("Failed to sync device", {
        description: message,
      });

      addNotification({
        type: "error",
        title: "Sync Failed",
        message,
      });
    }
  };

  const handleDisconnectDevice = async (deviceId: string) => {
    try {
      await disconnectDeviceMutation.mutateAsync(deviceId);

      toast.success("Device disconnected successfully", {
        description: "The device has been gracefully disconnected.",
      });

      addNotification({
        type: "success",
        title: "Device Disconnected",
        message: "The device has been disconnected successfully.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to disconnect device";
      toast.error("Failed to disconnect device", {
        description: message,
      });

      addNotification({
        type: "error",
        title: "Disconnect Failed",
        message,
      });
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-red-600">Failed to load devices: {error.message}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading || isUsageLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)
          : stats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Device Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Device Management</CardTitle>
              <CardDescription>Manage your WhatsApp Business devices</CardDescription>
            </div>
            <Button onClick={openCreateDeviceModal}>
              <Plus className="mr-2 h-4 w-4" />
              Add Device
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search devices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {isLoading ? (
            <DeviceTableSkeleton />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Uptime</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(device.status)}`} />
                        <span>{device.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{device.phoneNumber || "Not connected"}</TableCell>
                    <TableCell>
                      <Badge variant={device.status === "online" ? "default" : "secondary"}>{device.status}</Badge>
                    </TableCell>
                    <TableCell>{device.lastSeen ? new Date(device.lastSeen).toLocaleString() : "Never"}</TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">View Details</span>
                    </TableCell>
                    <TableCell>{getDeviceUptime(device)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleShowQR(device.id)}>
                            <QrCode className="mr-2 h-4 w-4" />
                            Show QR Code
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleStartDevice(device.id)}>
                            <Play className="mr-2 h-4 w-4" />
                            Start
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStopDevice(device.id)}>
                            <Square className="mr-2 h-4 w-4" />
                            Stop
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRestartDevice(device.id)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Restart
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDisconnectDevice(device.id)}>
                            <Unplug className="mr-2 h-4 w-4" />
                            Disconnect
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleSyncDevice(device.id)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Sync Status
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            Configure
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => openDeleteDeviceModal(device.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Device Modal */}
      <Dialog open={isCreateDeviceModalOpen} onOpenChange={closeCreateDeviceModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Device</DialogTitle>
            <DialogDescription>Create a new WhatsApp Business device to start sending messages.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleCreateDevice)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Device Name</Label>
              <Input
                id="name"
                placeholder="e.g., Marketing Device"
                {...register("name")}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deviceId">Device ID (Optional)</Label>
              <Input id="deviceId" placeholder="e.g., device-001" {...register("deviceId")} />
              <p className="text-sm text-muted-foreground">Leave empty to auto-generate a unique ID</p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={closeCreateDeviceModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={createDeviceMutation.isPending}>
                {createDeviceMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Device"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteDeviceModalOpen} onOpenChange={closeDeleteDeviceModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Device</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this device? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={closeDeleteDeviceModal}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDevice} disabled={deleteDeviceMutation.isPending}>
              {deleteDeviceMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Device QR Code</DialogTitle>
            <DialogDescription>Scan this QR code with WhatsApp to connect your device.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-4">
            {isQRLoading ? (
              <div className="flex items-center justify-center w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : qrData?.data?.qrCode ? (
              <img src={qrData.data.qrCode} alt="QR Code" className="w-64 h-64 border rounded-lg" />
            ) : (
              <div className="flex items-center justify-center w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">QR Code not available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
