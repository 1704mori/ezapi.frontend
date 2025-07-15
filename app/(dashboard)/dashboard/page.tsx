"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  MessageSquare,
  Smartphone,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  Zap,
} from "lucide-react";
import { useDevices, useCurrentSubscription, useCurrentUsage, useWorkerStats, useHealth } from "@/lib/api/hooks";
import { StatsCardSkeleton, UsageChartSkeleton, PageSkeleton } from "@/components/ui/skeletons";
import { useAuthStore } from "@/lib/stores/auth";
import Link from "next/link";

export default function DashboardPage() {
  const { user, organization } = useAuthStore();

  // API Queries
  const { data: devicesData, isLoading: devicesLoading } = useDevices(1, 10);
  const { data: subscriptionData, isLoading: subscriptionLoading } = useCurrentSubscription();
  const { data: usageData, isLoading: usageLoading } = useCurrentUsage();
  const { data: workerStatsData, isLoading: workerStatsLoading } = useWorkerStats();
  const { data: healthData, isLoading: healthLoading } = useHealth();

  const devices = devicesData?.devices || [];
  const subscription = subscriptionData?.subscription;
  const plan = subscriptionData?.planFeatures;
  const usage = usageData;
  const workerStats = workerStatsData?.data;
  const health = healthData;

  // Calculate metrics
  const onlineDevices = devices.filter((d) => d.status === "online").length;
  const totalDevices = devices.length;
  const deviceUptime = totalDevices > 0 ? (onlineDevices / totalDevices) * 100 : 0;

  const messagesUsed = usage?.messagesUsed || 0;
  const messagesLimit = plan?.messagesIncluded || 1000;
  const messageUsagePercent = messagesLimit > 0 ? (messagesUsed / messagesLimit) * 100 : 0;

  const storageUsed = usage?.storageUsedMB || 0;
  const storageLimit = (plan?.storageIncludedGB || 5) * 1024; // Convert GB to MB
  const storageUsagePercent = storageLimit > 0 ? (storageUsed / storageLimit) * 100 : 0;

  // Recent activity data (this would come from an activity API)
  const recentActivity = [
    {
      id: 1,
      type: "message",
      description: "Message sent to +1234567890",
      timestamp: "2 minutes ago",
      status: "success",
    },
    {
      id: 2,
      type: "device",
      description: 'Device "Marketing Device" connected',
      timestamp: "5 minutes ago",
      status: "success",
    },
    {
      id: 3,
      type: "subscription",
      description: "Monthly billing cycle started",
      timestamp: "2 hours ago",
      status: "info",
    },
    {
      id: 4,
      type: "warning",
      description: 'Device "Backup Device" disconnected',
      timestamp: "1 day ago",
      status: "warning",
    },
  ];

  if (devicesLoading && subscriptionLoading && usageLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.firstName || "User"}!</h1>
        <p className="text-muted-foreground">
          Here's what's happening with {organization?.name || "your organization"} today.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Devices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDevices}</div>
            <p className="text-xs text-muted-foreground">
              {onlineDevices} online, {totalDevices - onlineDevices} offline
            </p>
          </CardContent>
        </Card>

        {/* Messages This Month */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages This Month</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messagesUsed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              of {messagesLimit.toLocaleString()} limit ({messageUsagePercent.toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        {/* Worker Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Worker Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workerStats?.activeWorkers || 0}/{workerStats?.totalWorkers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {health?.nats === "connected" ? "Connected" : "Disconnected"}
            </p>
          </CardContent>
        </Card>

        {/* Uptime */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deviceUptime.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days average</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Usage Overview */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Usage Overview</CardTitle>
            <CardDescription>Your current plan usage and limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Plan */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Current Plan</p>
                <p className="text-2xl font-bold capitalize">
                  {subscription?.planType || "Starter"}
                  <Badge variant="outline" className="ml-2 capitalize">
                    {subscription?.status || "Active"}
                  </Badge>
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/billing">Manage Plan</Link>
              </Button>
            </div>

            {/* Messages Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Messages</p>
                <p className="text-sm text-muted-foreground">
                  {messagesUsed.toLocaleString()} / {messagesLimit.toLocaleString()}
                </p>
              </div>
              <Progress value={messageUsagePercent} className="h-2" />
              <div className="flex items-center text-xs text-muted-foreground">
                {messageUsagePercent > 80 && <AlertTriangle className="h-3 w-3 mr-1 text-orange-500" />}
                {messageUsagePercent.toFixed(1)}% used
              </div>
            </div>

            {/* Storage Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Storage</p>
                <p className="text-sm text-muted-foreground">
                  {(storageUsed / 1024).toFixed(2)} GB / {plan?.storageIncludedGB || 5} GB
                </p>
              </div>
              <Progress value={storageUsagePercent} className="h-2" />
              <div className="flex items-center text-xs text-muted-foreground">
                {storageUsagePercent > 80 && <AlertTriangle className="h-3 w-3 mr-1 text-orange-500" />}
                {storageUsagePercent.toFixed(1)}% used
              </div>
            </div>

            {/* Devices Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Devices</p>
                <p className="text-sm text-muted-foreground">
                  {totalDevices} / {plan?.devicesIncluded || 1}
                </p>
              </div>
              <Progress
                value={plan?.devicesIncluded ? (totalDevices / plan.devicesIncluded) * 100 : 0}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest events and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="mt-1">
                    {activity.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {activity.status === "warning" && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                    {activity.status === "info" && <Activity className="h-4 w-4 text-blue-500" />}
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/activity">View All Activity</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Device Status</CardTitle>
              <CardDescription>Overview of your WhatsApp devices</CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/devices">Manage Devices</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {devicesLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <StatsCardSkeleton key={i} />
              ))}
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-8">
              <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No devices connected</h3>
              <p className="text-muted-foreground mb-4">Add your first WhatsApp Business device to get started.</p>
              <Button asChild>
                <Link href="/devices">Add Device</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {devices.slice(0, 6).map((device) => (
                <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        device.status === "online"
                          ? "bg-green-500"
                          : device.status === "offline"
                            ? "bg-red-500"
                            : "bg-yellow-500"
                      }`}
                    />
                    <div>
                      <p className="font-medium">{device.name}</p>
                      <p className="text-sm text-muted-foreground">{device.phoneNumber || "Not connected"}</p>
                    </div>
                  </div>
                  <Badge variant={device.status === "online" ? "default" : "secondary"}>{device.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
