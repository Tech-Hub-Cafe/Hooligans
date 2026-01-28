"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Mail,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
}

async function fetchContactMessages(): Promise<ContactMessage[]> {
  const res = await fetch("/api/admin/contact-messages", { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Failed to fetch contact messages");
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default function AdminContactMessagesPage() {
  useEffect(() => {
    document.title = "Contact Messages | Hooligans Admin";
  }, []);

  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [deleteMessageId, setDeleteMessageId] = useState<number | null>(null);
  const [filterRead, setFilterRead] = useState<string>("all");

  const { data: messages = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-contact-messages"],
    queryFn: fetchContactMessages,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/contact-messages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark message as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/contact-messages/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete message");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
      setDeleteMessageId(null);
      setSelectedMessage(null);
    },
  });

  // Filter messages
  const filteredMessages = messages.filter((msg) => {
    const matchesSearch =
      msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRead =
      filterRead === "all" ||
      (filterRead === "read" && msg.read) ||
      (filterRead === "unread" && !msg.read);

    return matchesSearch && matchesRead;
  });

  const unreadCount = messages.filter((msg) => !msg.read).length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-AU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Contact Messages</h1>
        <p className="text-gray-600">
          Manage customer inquiries and messages from the contact form
        </p>
      </div>

      {isError && (
        <Card className="border-0 shadow-lg mb-6 border-l-4 border-l-red-500">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <p className="text-red-700">
              {error instanceof Error ? error.message : "Failed to load contact messages. Sign in again or try refreshing."}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="shrink-0">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Messages</p>
                <p className="text-2xl font-bold">{messages.length}</p>
              </div>
              <Mail className="w-8 h-8 text-teal" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Unread</p>
                <p className="text-2xl font-bold text-yellow-600">{unreadCount}</p>
              </div>
              <XCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Read</p>
                <p className="text-2xl font-bold text-green-600">
                  {messages.length - unreadCount}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by name, email, subject, or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterRead === "all" ? "default" : "outline"}
                onClick={() => setFilterRead("all")}
                className="bg-teal hover:bg-teal-dark text-white"
              >
                All
              </Button>
              <Button
                variant={filterRead === "unread" ? "default" : "outline"}
                onClick={() => setFilterRead("unread")}
                className={filterRead === "unread" ? "bg-yellow-600 hover:bg-yellow-700 text-white" : ""}
              >
                Unread
              </Button>
              <Button
                variant={filterRead === "read" ? "default" : "outline"}
                onClick={() => setFilterRead("read")}
                className={filterRead === "read" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
              >
                Read
              </Button>
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      {isLoading ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-teal mx-auto mb-4" />
            <p className="text-gray-600">Loading messages...</p>
          </CardContent>
        </Card>
      ) : filteredMessages.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchQuery || filterRead !== "all"
                ? "No messages match your filters"
                : "No contact messages yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((message) => (
            <Card
              key={message.id}
              className={`border-0 shadow-lg cursor-pointer transition-all hover:shadow-xl ${
                !message.read ? "border-l-4 border-yellow-500 bg-yellow-50/50" : ""
              }`}
              onClick={() => {
                setSelectedMessage(message);
                if (!message.read) {
                  markAsReadMutation.mutate(message.id);
                }
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{message.subject}</h3>
                      {!message.read && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">
                      <strong>{message.name}</strong> ({message.email})
                    </p>
                    <p className="text-gray-700 line-clamp-2 mb-2">{message.message}</p>
                    <p className="text-sm text-gray-500">{formatDate(message.created_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMessage(message);
                        if (!message.read) {
                          markAsReadMutation.mutate(message.id);
                        }
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteMessageId(message.id);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Message Dialog */}
      {selectedMessage && (
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedMessage.subject}
                {!selectedMessage.read && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                    New
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">From</p>
                <p className="font-semibold">
                  {selectedMessage.name} ({selectedMessage.email})
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Date</p>
                <p>{formatDate(selectedMessage.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Message</p>
                <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = `mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`;
                }}
              >
                Reply via Email
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setDeleteMessageId(selectedMessage.id);
                  setSelectedMessage(null);
                }}
              >
                Delete
              </Button>
              <Button
                onClick={() => setSelectedMessage(null)}
                className="bg-teal hover:bg-teal-dark text-white"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteMessageId} onOpenChange={() => setDeleteMessageId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to delete this message? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteMessageId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteMessageId) {
                  deleteMutation.mutate(deleteMessageId);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
