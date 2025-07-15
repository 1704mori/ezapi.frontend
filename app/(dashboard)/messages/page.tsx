"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Send,
  Search,
  Filter,
  ImageIcon,
  Video,
  FileText,
  CheckCheck,
  Check,
  Clock,
  X,
  MoreVertical,
  Download,
  Eye,
} from "lucide-react";
import {
  useMessages,
  useDevices,
  useSendMessage,
  useMessageTemplates,
  useCreateMessageTemplate,
} from "@/lib/api/hooks";
import {
  MessageListSkeleton,
  DeviceSelectSkeleton,
  TemplateCardSkeleton,
  MessageSkeleton,
} from "@/components/ui/skeletons";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUIStore } from "@/lib/stores/ui";
import { toast } from "sonner";
import { format } from "date-fns";

// Form schemas
const sendMessageSchema = z.object({
  recipient: z.string().min(1, "Recipient phone number is required"),
  deviceId: z.string().min(1, "Please select a device"),
  content: z.string().min(1, "Message content is required").max(4096, "Message too long"),
  type: z.enum(["text", "image", "video", "document"]).default("text"),
});

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100, "Name too long"),
  content: z.string().min(1, "Template content is required").max(4096, "Content too long"),
});

type SendMessageData = z.infer<typeof sendMessageSchema>;
type TemplateData = z.infer<typeof templateSchema>;

export default function MessagesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deviceFilter, setDeviceFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // API Queries
  const { data: messagesData, isLoading: messagesLoading } = useMessages({
    page: currentPage,
    limit: 20,
    search: searchTerm,
    deviceId: deviceFilter === "all" ? undefined : deviceFilter,
  });
  const { data: devicesData, isLoading: devicesLoading } = useDevices(1, 50);
  const { data: templatesData, isLoading: templatesLoading } = useMessageTemplates();

  // Mutations
  const sendMessageMutation = useSendMessage();
  const createTemplateMutation = useCreateMessageTemplate();

  const messages = messagesData?.data?.messages || [];
  const devices = devicesData?.data?.devices?.filter((d) => d.status === "online") || [];
  const templates = templatesData?.data?.templates || [];
  const pagination = messagesData?.meta?.pagination;

  // Forms
  const sendForm = useForm({
    resolver: zodResolver(sendMessageSchema),
    defaultValues: {
      recipient: "",
      deviceId: "",
      content: "",
      type: "text" as const,
    },
  });

  const templateForm = useForm<TemplateData>({
    resolver: zodResolver(templateSchema),
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Check className="h-4 w-4 text-gray-500" />;
      case "delivered":
        return <CheckCheck className="h-4 w-4 text-blue-500" />;
      case "read":
        return <CheckCheck className="h-4 w-4 text-green-500" />;
      case "failed":
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-blue-100 text-blue-800";
      case "read":
        return "bg-green-100 text-green-800";
      case "sent":
        return "bg-gray-100 text-gray-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleSendMessage = async (data: SendMessageData) => {
    try {
      const messageData: any = {
        to: data.recipient,
        deviceId: data.deviceId,
        message: data.content, // Map content to message for API
        type: data.type,
      };

      // If there's a selected file, we'd typically upload it first
      // For now, we'll just send the message without media
      if (selectedFile) {
        // TODO: Implement file upload to get media URL
        // messageData.media = uploadedFileUrl;
        toast.info("File upload not yet implemented. Sending text message only.");
      }

      const response = await sendMessageMutation.mutateAsync(messageData);

      // Show success message with billing info if available
      if (response?.data?.messageId) {
        toast.success(
          "asd",
          // `Message sent! ${response.billing.messagesRemaining} messages remaining this month.`
        );
      } else {
        toast.success("Message sent successfully!");
      }

      sendForm.reset();
      setSelectedFile(null);
    } catch (error: any) {
      console.error("Failed to send message:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to send message";
      toast.error(errorMessage);
    }
  };

  const handleFileSelect = (type: "image" | "video" | "document") => {
    const input = document.createElement("input");
    input.type = "file";

    switch (type) {
      case "image":
        input.accept = "image/*";
        sendForm.setValue("type", "image");
        break;
      case "video":
        input.accept = "video/*";
        sendForm.setValue("type", "video");
        break;
      case "document":
        input.accept = ".pdf,.doc,.docx,.txt";
        sendForm.setValue("type", "document");
        break;
    }

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setSelectedFile(file);
        toast.success(`${file.name} selected`);
      }
    };

    input.click();
  };

  const handleUseTemplate = (template: any) => {
    sendForm.setValue("content", template.content);
    toast.success(`Template "${template.name}" applied`);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDeviceFilter("all");
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, deviceFilter]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Message History</TabsTrigger>
          <TabsTrigger value="send">Send Message</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Message History</CardTitle>
              <CardDescription>View and filter your message history</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={deviceFilter} onValueChange={setDeviceFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Device" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Devices</SelectItem>
                    {devices.map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(searchTerm || statusFilter !== "all" || deviceFilter !== "all") && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear
                  </Button>
                )}
              </div>

              {/* Messages List */}
              <div className="space-y-4">
                {messagesLoading ? (
                  <MessageListSkeleton />
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No messages found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || statusFilter !== "all" || deviceFilter !== "all"
                        ? "Try adjusting your filters"
                        : "Send your first message to get started"}
                    </p>
                    <Button onClick={() => (document.querySelector('[data-value="send"]') as HTMLElement)?.click()}>
                      Send Message
                    </Button>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium">{message.toNumber}</span>
                            <Badge variant="outline">
                              {devices.find((d) => d.id === message.device?.id)?.name || "Unknown Device"}
                            </Badge>
                            <Badge className={getStatusColor(message.status || "sent")}>
                              {message.status || "sent"}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            {getMessageTypeIcon(message.messageType || "text")}
                            <span className="text-sm text-muted-foreground">
                              {message.messageType === "text" ? message.content : `${message.messageType} file`}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.createdAt), "MMM dd, yyyy h:mm a")}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(message.status || "sent")}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {message.messageType !== "text" && (
                                <DropdownMenuItem>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {messages.length} of {pagination.total} messages
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={currentPage >= pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Message</CardTitle>
              <CardDescription>Send messages to your contacts</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={sendForm.handleSubmit(handleSendMessage)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Recipient *</label>
                    <Input
                      {...sendForm.register("recipient")}
                      placeholder="+1234567890"
                      disabled={sendMessageMutation.isPending}
                    />
                    {sendForm.formState.errors.recipient && (
                      <p className="text-sm text-red-500">{sendForm.formState.errors.recipient.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Device *</label>
                    {devicesLoading ? (
                      <DeviceSelectSkeleton />
                    ) : (
                      <Select
                        value={sendForm.watch("deviceId")}
                        onValueChange={(value) => sendForm.setValue("deviceId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select device" />
                        </SelectTrigger>
                        <SelectContent>
                          {devices.map((device) => (
                            <SelectItem key={device.id} value={device.id}>
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span>{device.name}</span>
                                <span className="text-xs text-muted-foreground">({device.phoneNumber})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {sendForm.formState.errors.deviceId && (
                      <p className="text-sm text-red-500">{sendForm.formState.errors.deviceId.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Message *</label>
                  <Textarea
                    {...sendForm.register("content")}
                    placeholder="Type your message here..."
                    rows={4}
                    disabled={sendMessageMutation.isPending}
                  />
                  {sendForm.formState.errors.content && (
                    <p className="text-sm text-red-500">{sendForm.formState.errors.content.message}</p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {sendForm.watch("content")?.length || 0} / 4096 characters
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => handleFileSelect("image")}>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Image
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => handleFileSelect("video")}>
                      <Video className="mr-2 h-4 w-4" />
                      Video
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => handleFileSelect("document")}>
                      <FileText className="mr-2 h-4 w-4" />
                      Document
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedFile && <div className="text-xs text-muted-foreground">📎 {selectedFile.name}</div>}
                    <Button type="submit" disabled={sendMessageMutation.isPending}>
                      {sendMessageMutation.isPending ? (
                        "Sending..."
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Message Templates</CardTitle>
                  <CardDescription>Quick response templates for common messages</CardDescription>
                </div>
                <Button onClick={() => setShowNewTemplate(true)}>Create Template</Button>
              </div>
            </CardHeader>
            <CardContent>
              {showNewTemplate && (
                <Card className="mb-6 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base">New Template</CardTitle>
                  </CardHeader>
                  <CardContent>{/* // todo */}</CardContent>
                </Card>
              )}

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templatesLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <TemplateCardSkeleton key={i} />)
                ) : templates.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No templates yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first template for quick messaging</p>
                    <Button onClick={() => setShowNewTemplate(true)}>Create Template</Button>
                  </div>
                ) : (
                  templates.map((template) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleUseTemplate(template)}>
                                Use Template
                              </DropdownMenuItem>
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{template.content}</p>
                        <Button size="sm" className="w-full" onClick={() => handleUseTemplate(template)}>
                          Use Template
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
