"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard,
  Check,
  Zap,
  Star,
  Download,
  Calendar,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  FileText,
} from "lucide-react";
import {
  useCurrentSubscription,
  useCurrentUsage,
  usePlans,
  useCreateSubscription,
  useCancelSubscription,
  useUpdatePaymentMethod,
  useBillingHistory,
} from "@/lib/api/hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { StatsCardSkeleton, UsageChartSkeleton } from "@/components/ui/skeletons";

// Form schemas
const paymentMethodSchema = z.object({
  cardNumber: z.string().min(1, "Card number is required"),
  expiryMonth: z.string().min(1, "Expiry month is required"),
  expiryYear: z.string().min(1, "Expiry year is required"),
  cvc: z.string().min(3, "CVC is required"),
  name: z.string().min(1, "Cardholder name is required"),
});

type PaymentMethodData = z.infer<typeof paymentMethodSchema>;

export default function BillingPage() {
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // API Queries
  const { data: subscriptionData, isLoading: subscriptionLoading } = useCurrentSubscription();
  const { data: usageData, isLoading: usageLoading } = useCurrentUsage();
  const { data: plansData, isLoading: plansLoading } = usePlans();
  const { data: billingHistoryData, isLoading: billingHistoryLoading } = useBillingHistory();

  // Mutations
  const createSubscriptionMutation = useCreateSubscription();
  const cancelSubscriptionMutation = useCancelSubscription();
  const updatePaymentMethodMutation = useUpdatePaymentMethod();

  const subscription = subscriptionData?.subscription;
  console.log("Current subscription:", subscription);
  const plan = subscriptionData?.planFeatures;
  const usage = usageData; // Direct usage data
  const plans = plansData?.plans || [];
  const billingHistory = (billingHistoryData as { invoices: any[] })?.invoices || [];

  // Form
  const paymentForm = useForm<PaymentMethodData>({
    resolver: zodResolver(paymentMethodSchema),
  });

  const handlePlanChange = async (planType: string) => {
    try {
      await createSubscriptionMutation.mutateAsync({
        planType: planType as "starter" | "professional" | "enterprise",
      });
      toast.success("Plan updated successfully!");
    } catch {
      toast.error("Failed to update plan");
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscriptionMutation.mutateAsync();
      toast.success("Subscription cancelled successfully");
    } catch {
      toast.error("Failed to cancel subscription");
    }
  };

  const handleUpdatePaymentMethod = async (data: PaymentMethodData) => {
    try {
      await updatePaymentMethodMutation.mutateAsync({
        cardNumber: data.cardNumber,
        expiryMonth: data.expiryMonth,
        expiryYear: data.expiryYear,
        cvc: data.cvc,
        cardholderName: data.name,
      });
      toast.success("Payment method updated successfully!");
      setShowPaymentForm(false);
      paymentForm.reset();
    } catch {
      toast.error("Failed to update payment method");
    }
  };

  // Calculate usage percentages
  const messagesUsed = usage?.messagesUsed || 0;
  const messagesLimit = plan?.messagesIncluded || 1000;
  const messageUsagePercent = messagesLimit > 0 ? (messagesUsed / messagesLimit) * 100 : 0;

  const storageUsed = usage?.storageUsedMB || 0;
  const storageLimit = (plan?.storageIncludedGB || 5) * 1024;
  const storageUsagePercent = storageLimit > 0 ? (storageUsed / storageLimit) * 100 : 0;

  // Plan pricing - convert monthly price to number
  const getPlanPrice = (planData: { monthlyPrice?: string }) => {
    if (planData?.monthlyPrice) {
      // Remove $ and convert to number
      return parseFloat(planData.monthlyPrice.replace("$", ""));
    }
    return 0;
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case "starter":
        return <Zap className="h-5 w-5" />;
      case "professional":
        return <Star className="h-5 w-5" />;
      case "enterprise":
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case "starter":
        return "bg-blue-100 text-blue-800";
      case "professional":
        return "bg-purple-100 text-purple-800";
      case "enterprise":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription, usage, and billing information.</p>
      </div>

      <Tabs defaultValue="subscription" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="history">Billing History</TabsTrigger>
          <TabsTrigger value="payment">Payment Method</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription" className="space-y-4">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your active subscription details</CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptionLoading ? (
                <StatsCardSkeleton />
              ) : subscription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getPlanIcon(subscription.planType)}
                      <div>
                        <h3 className="text-xl font-semibold capitalize">{subscription.planType} Plan</h3>
                        <p className="text-muted-foreground">
                          ${plan ? getPlanPrice(plan) : 0}/month • Renews{" "}
                          {subscription.currentPeriodEnd
                            ? format(new Date(subscription.currentPeriodEnd), "MMM dd, yyyy")
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    <Badge className={getPlanColor(subscription.planType)} variant="outline">
                      {subscription.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{plan?.messagesIncluded?.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Messages/month</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{plan?.devicesIncluded}</p>
                      <p className="text-sm text-muted-foreground">Devices</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{plan?.storageIncludedGB}GB</p>
                      <p className="text-sm text-muted-foreground">Storage</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={() => setShowPaymentForm(true)}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Update Payment Method
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleCancelSubscription}
                      disabled={cancelSubscriptionMutation.isPending}
                    >
                      {cancelSubscriptionMutation.isPending ? "Cancelling..." : "Cancel Subscription"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No active subscription</h3>
                  <p className="text-muted-foreground mb-4">Choose a plan to get started with WhatsApp Business API.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Plans */}
          <Card>
            <CardHeader>
              <CardTitle>Available Plans</CardTitle>
              <CardDescription>Choose the plan that best fits your needs</CardDescription>
            </CardHeader>
            <CardContent>
              {plansLoading ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <StatsCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  {plans.map((planOption: any) => (
                    <Card
                      key={planOption.id}
                      className={`cursor-pointer transition-all ${
                        plan?.id === planOption.id ? "ring-2 ring-primary" : "hover:shadow-md"
                      }`}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getPlanIcon(planOption.type)}
                            <h3 className="font-semibold capitalize">{planOption.type}</h3>
                          </div>
                          {plan?.id === planOption.id && <Badge className="bg-green-100 text-green-800">Current</Badge>}
                        </div>
                        <div className="text-2xl font-bold">
                          ${getPlanPrice(planOption)}
                          <span className="text-base font-normal text-muted-foreground">/month</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-sm">
                              {planOption.messagesIncluded.toLocaleString()} messages/month
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{planOption.devicesIncluded} devices</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{planOption.storageIncludedGB}GB storage</span>
                          </div>
                          {planOption.features &&
                            planOption.features.map((feature: string, idx: number) => (
                              <div key={idx} className="flex items-center space-x-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-sm">{feature}</span>
                              </div>
                            ))}
                        </div>
                        {plan?.id !== planOption.id && (
                          <Button
                            className="w-full"
                            onClick={() => handlePlanChange(planOption.type)}
                            disabled={createSubscriptionMutation.isPending}
                          >
                            {createSubscriptionMutation.isPending ? "Updating..." : "Select Plan"}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Messages Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Messages Usage</CardTitle>
                <CardDescription>Current month usage</CardDescription>
              </CardHeader>
              <CardContent>
                {usageLoading ? (
                  <UsageChartSkeleton />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{messagesUsed.toLocaleString()}</span>
                      <span className="text-muted-foreground">of {messagesLimit.toLocaleString()}</span>
                    </div>
                    <Progress value={messageUsagePercent} className="h-2" />
                    <div className="flex items-center text-sm">
                      {messageUsagePercent > 80 && <AlertTriangle className="h-4 w-4 mr-1 text-orange-500" />}
                      <span className={messageUsagePercent > 80 ? "text-orange-600" : "text-muted-foreground"}>
                        {messageUsagePercent.toFixed(1)}% used
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Storage Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Storage Usage</CardTitle>
                <CardDescription>Media and file storage</CardDescription>
              </CardHeader>
              <CardContent>
                {usageLoading ? (
                  <UsageChartSkeleton />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{(storageUsed / 1024).toFixed(2)}GB</span>
                      <span className="text-muted-foreground">of {plan?.storageIncludedGB || 5}GB</span>
                    </div>
                    <Progress value={storageUsagePercent} className="h-2" />
                    <div className="flex items-center text-sm">
                      {storageUsagePercent > 80 && <AlertTriangle className="h-4 w-4 mr-1 text-orange-500" />}
                      <span className={storageUsagePercent > 80 ? "text-orange-600" : "text-muted-foreground"}>
                        {storageUsagePercent.toFixed(1)}% used
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Usage Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Breakdown</CardTitle>
              <CardDescription>Detailed usage statistics for this billing period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Messages Sent</span>
                  </div>
                  <span className="text-2xl font-bold">{usage?.messagesUsed?.toLocaleString() || "0"}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Storage Used</span>
                  </div>
                  <span className="text-2xl font-bold">{(storageUsed / 1024).toFixed(2)}GB</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Current Period</span>
                  </div>
                  <span className="text-2xl font-bold">{usage?.period || "Current"}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Days Left</span>
                  </div>
                  <span className="text-2xl font-bold">
                    {subscription?.currentPeriodEnd
                      ? Math.max(
                          0,
                          Math.ceil(
                            (new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                          ),
                        )
                      : "0"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>Your past invoices and payments</CardDescription>
            </CardHeader>
            <CardContent>
              {billingHistoryLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StatsCardSkeleton key={i} />
                  ))}
                </div>
              ) : billingHistory.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No billing history</h3>
                  <p className="text-muted-foreground">
                    Your invoices will appear here once you have an active subscription.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {billingHistory.map(
                    (invoice: { id: string; number: string; createdAt: string; total: number; status: string }) => (
                      <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">Invoice #{invoice.number}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(invoice.createdAt), "MMM dd, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className="font-medium">${invoice.total.toFixed(2)}</p>
                            <Badge variant={invoice.status === "paid" ? "default" : "destructive"}>
                              {invoice.status}
                            </Badge>
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Manage your payment information</CardDescription>
            </CardHeader>
            <CardContent>
              {showPaymentForm ? (
                <form onSubmit={paymentForm.handleSubmit(handleUpdatePaymentMethod)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Card Number *</label>
                      <Input {...paymentForm.register("cardNumber")} placeholder="1234 5678 9012 3456" />
                      {paymentForm.formState.errors.cardNumber && (
                        <p className="text-sm text-red-500">{paymentForm.formState.errors.cardNumber.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Cardholder Name *</label>
                      <Input {...paymentForm.register("name")} placeholder="John Doe" />
                      {paymentForm.formState.errors.name && (
                        <p className="text-sm text-red-500">{paymentForm.formState.errors.name.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Expiry Month *</label>
                      <Input {...paymentForm.register("expiryMonth")} placeholder="MM" maxLength={2} />
                      {paymentForm.formState.errors.expiryMonth && (
                        <p className="text-sm text-red-500">{paymentForm.formState.errors.expiryMonth.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Expiry Year *</label>
                      <Input {...paymentForm.register("expiryYear")} placeholder="YY" maxLength={2} />
                      {paymentForm.formState.errors.expiryYear && (
                        <p className="text-sm text-red-500">{paymentForm.formState.errors.expiryYear.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">CVC *</label>
                      <Input {...paymentForm.register("cvc")} placeholder="123" maxLength={4} />
                      {paymentForm.formState.errors.cvc && (
                        <p className="text-sm text-red-500">{paymentForm.formState.errors.cvc.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button type="submit" disabled={updatePaymentMethodMutation.isPending}>
                      {updatePaymentMethodMutation.isPending ? "Updating..." : "Update Payment Method"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowPaymentForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 border rounded-lg">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">**** **** **** 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/25</p>
                    </div>
                  </div>
                  <Button onClick={() => setShowPaymentForm(true)}>Update Payment Method</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
