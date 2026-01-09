"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Clock,
  ShoppingBag,
  Loader2,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  Timer,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface Order {
  id: number;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: string;
  created_at: string;
  special_instructions?: string;
}

async function fetchUserOrders(userId: string): Promise<Order[]> {
  const response = await fetch(`/api/orders/user/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch orders");
  return response.json();
}

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ["userOrders", session?.user?.id],
    queryFn: () => fetchUserOrders(session!.user!.id),
    enabled: !!session?.user?.id,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/orders");
    }
  }, [status, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleReorder = (order: Order) => {
    const cart = order.items.map((item, index) => ({
      id: Date.now() + index,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    localStorage.setItem("cafeCart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    router.push("/cart");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "preparing":
        return <Timer className="w-5 h-5 text-yellow-600" />;
      case "ready":
        return <ShoppingBag className="w-5 h-5 text-blue-600" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "preparing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ready":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/profile">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Order History</h1>
              <p className="text-gray-500">{orders.length} orders</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <Card className="shadow-lg border-0">
            <CardContent className="py-16 text-center">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-6">
                Start ordering to see your history here
              </p>
              <Link href="/menu">
                <Button className="bg-teal hover:bg-teal-dark text-white">
                  Browse Menu
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="shadow-lg border-0 overflow-hidden">
                <CardContent className="p-0">
                  {/* Order Header */}
                  <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <p className="font-semibold">Order #{order.id}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="p-4 space-y-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="text-gray-600">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}

                    {order.special_instructions && (
                      <div className="pt-3 border-t text-sm text-gray-500">
                        <span className="font-medium">Note:</span>{" "}
                        {order.special_instructions}
                      </div>
                    )}
                  </div>

                  {/* Order Footer */}
                  <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-xl font-bold text-teal">
                        ${order.total.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleReorder(order)}
                      className="bg-black hover:bg-gray-800 text-white"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reorder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

