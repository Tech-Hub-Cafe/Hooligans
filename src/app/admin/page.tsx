"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingCart,
  DollarSign,
  UtensilsCrossed,
  TrendingUp,
  Clock,
  Calendar,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface Order {
  id: number;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

interface MenuItem {
  id: number;
  name: string;
  category: string;
  available: boolean;
}

async function fetchOrders(): Promise<Order[]> {
  const res = await fetch("/api/admin/orders");
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

async function fetchMenuItems(): Promise<MenuItem[]> {
  const res = await fetch("/api/admin/menu");
  if (!res.ok) throw new Error("Failed to fetch menu items");
  return res.json();
}

type DateFilter = "today" | "week" | "month" | "all" | "custom";

export default function AdminDashboard() {
  // Update page title
  useEffect(() => {
    document.title = "Admin Dashboard | Hooligans";
  }, []);

  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: fetchOrders,
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ["admin-menu"],
    queryFn: fetchMenuItems,
  });

  // Date filtering logic
  const getDateRange = (filter: DateFilter): { start: Date; end: Date } | null => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case "today":
        return {
          start: new Date(today),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
        };
      case "week": {
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        return {
          start: new Date(startOfWeek),
          end: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1),
        };
      }
      case "month": {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        return {
          start: startOfMonth,
          end: endOfMonth,
        };
      }
      case "custom":
        if (startDate && endDate) {
          return {
            start: new Date(startDate),
            end: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1),
          };
        }
        return null;
      case "all":
      default:
        return null;
    }
  };

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (dateFilter === "all") return orders;
    
    const range = getDateRange(dateFilter);
    if (!range) return orders;

    return orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return orderDate >= range.start && orderDate <= range.end;
    });
  }, [orders, dateFilter, startDate, endDate]);

  // Calculate stats from filtered orders
  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const pendingOrders = filteredOrders.filter((o) => o.status === "pending").length;
  const availableItems = menuItems.filter((m) => m.available).length;

  const recentOrders = filteredOrders.slice(0, 5);

  // Get filter label
  const getFilterLabel = (): string => {
    switch (dateFilter) {
      case "today":
        return "Today";
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      case "custom":
        if (startDate && endDate) {
          return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
        }
        return "Custom Range";
      case "all":
      default:
        return "All Time";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "preparing":
        return "bg-blue-100 text-blue-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          
          {/* Date Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={dateFilter === "today" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter("today")}
              className={dateFilter === "today" ? "bg-teal hover:bg-teal-dark text-white" : ""}
            >
              Today
            </Button>
            <Button
              variant={dateFilter === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter("week")}
              className={dateFilter === "week" ? "bg-teal hover:bg-teal-dark text-white" : ""}
            >
              This Week
            </Button>
            <Button
              variant={dateFilter === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter("month")}
              className={dateFilter === "month" ? "bg-teal hover:bg-teal-dark text-white" : ""}
            >
              This Month
            </Button>
            <Button
              variant={dateFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter("all")}
              className={dateFilter === "all" ? "bg-teal hover:bg-teal-dark text-white" : ""}
            >
              All Time
            </Button>
            <Button
              variant={dateFilter === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter("custom")}
              className={dateFilter === "custom" ? "bg-teal hover:bg-teal-dark text-white" : ""}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Custom
            </Button>
          </div>
        </div>
        <p className="text-gray-600">Welcome back! Here&apos;s what&apos;s happening {getFilterLabel().toLowerCase()}.</p>
      </div>

      {/* Custom Date Range Inputs */}
      {dateFilter === "custom" && (
        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">From:</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-auto"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">To:</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-auto"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filter Display */}
      {dateFilter !== "all" && (
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Showing data for: <span className="font-semibold text-gray-900">{getFilterLabel()}</span>
            {filteredOrders.length !== orders.length && (
              <span className="ml-2 text-teal">
                ({filteredOrders.length} of {orders.length} orders)
              </span>
            )}
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-3xl font-bold mt-1">{totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-teal/10 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-teal" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-3xl font-bold mt-1">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Orders</p>
                <p className="text-3xl font-bold mt-1">{pendingOrders}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Menu Items</p>
                <p className="text-3xl font-bold mt-1">{availableItems}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
            <Link
              href="/admin/orders"
              className="text-sm text-teal hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-gray-500">
                        Order #{order.id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${Number(order.total).toFixed(2)}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link
                href="/admin/menu"
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 bg-teal/10 rounded-lg flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-teal" />
                </div>
                <div>
                  <p className="font-medium">Manage Menu</p>
                  <p className="text-sm text-gray-500">Add, edit, or remove menu items</p>
                </div>
              </Link>
              <Link
                href="/admin/orders"
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium">View Orders</p>
                  <p className="text-sm text-gray-500">Manage and update order statuses</p>
                </div>
              </Link>
              <Link
                href="/admin/settings"
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Cafe Settings</p>
                  <p className="text-sm text-gray-500">Update hours, contact info, socials</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

