"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Phone,
  LogOut,
  Clock,
  ShoppingBag,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface Order {
  id: number;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: string;
  created_at: string;
}

async function fetchUserOrders(userId: string): Promise<Order[]> {
  const response = await fetch(`/api/orders/user/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch orders");
  return response.json();
}

export default function ProfilePage() {
  const { data: session, status } = useSession();

  // Update page title
  useEffect(() => {
    document.title = "Profile | Hooligans";
  }, []);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["userOrders", session?.user?.id],
    queryFn: () => fetchUserOrders(session!.user!.id),
    enabled: !!session?.user?.id,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const handleReorder = async (order: Order) => {
    // Add items to cart
    const cart = order.items.map((item) => ({
      id: Date.now() + Math.random(),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    localStorage.setItem("cafeCart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    router.push("/cart");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "preparing":
        return "bg-yellow-100 text-yellow-800";
      case "ready":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Profile Header */}
        <Card className="shadow-lg border-0 mb-8">
          <CardContent className="p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt="Profile"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 sm:w-10 sm:h-10 text-teal" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold truncate">{session.user?.name || "User"}</h1>
                  <p className="text-sm sm:text-base text-gray-500 truncate">{session.user?.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="w-full sm:w-auto text-red-600 border-red-200 hover:bg-red-50 active:bg-red-100 touch-manipulation"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Link href="/menu">
            <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow cursor-pointer">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal/10 rounded-xl flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-teal" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Order Food</h3>
                    <p className="text-gray-500 text-sm">Browse our menu</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/orders">
            <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow cursor-pointer">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal/10 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-teal" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Order History</h3>
                    <p className="text-gray-500 text-sm">{orders.length} orders</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Orders */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-teal" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No orders yet</p>
                <Link href="/menu">
                  <Button className="mt-4 bg-teal hover:bg-teal-dark text-white">
                    Start Ordering
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold">Order #{order.id}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-teal">${order.total.toFixed(2)}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReorder(order)}
                        className="mt-2"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Reorder
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

