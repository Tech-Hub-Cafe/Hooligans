"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Loader2,
  ImageIcon,
  Tag,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

interface MenuItem {
  id: string; // Square ID
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  available: boolean;
  square_id: string;
  isDisabled?: boolean;
}

async function fetchMenuItems(): Promise<MenuItem[]> {
  const res = await fetch("/api/admin/menu");
  if (!res.ok) throw new Error("Failed to fetch menu items");
  return res.json();
}

export default function AdminMenuPage() {
  const queryClient = useQueryClient();
  
  // Update page title
  useEffect(() => {
    document.title = "Menu Management | Hooligans Admin";
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ["admin-menu"],
    queryFn: fetchMenuItems,
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ squareId, available }: { squareId: string; available: boolean }) => {
      const res = await fetch(`/api/admin/menu?square_id=${squareId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available }),
      });
      if (!res.ok) throw new Error("Failed to toggle menu item");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-menu"] });
      queryClient.invalidateQueries({ queryKey: ["menuItems"] }); // Also invalidate public menu
    },
  });

  // Fetch disabled categories
  const { data: disabledCategoriesData } = useQuery({
    queryKey: ["admin-disabled-categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) throw new Error("Failed to fetch disabled categories");
      return res.json();
    },
  });

  const disabledCategoryNames = new Set(disabledCategoriesData?.disabledCategories || []);

  const toggleCategoryMutation = useMutation({
    mutationFn: async ({ categoryName, available }: { categoryName: string; available: boolean }) => {
      const res = await fetch(`/api/admin/categories?category_name=${encodeURIComponent(categoryName)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available }),
      });
      if (!res.ok) throw new Error("Failed to toggle category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-disabled-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-menu"] });
      queryClient.invalidateQueries({ queryKey: ["menuItems"] }); // Also invalidate public menu
    },
  });

  // Get unique categories from menu items
  const categories = Array.from(new Set(menuItems.map(item => item.category))).sort();

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Items</h1>
          <p className="text-gray-600 mt-1">
            Manage menu items from Square POS. Toggle visibility to show/hide items on the website.
          </p>
        </div>
      </div>

      {/* Category Management */}
      <Card className="border-0 shadow-lg mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-5 h-5 text-teal" />
            <h2 className="text-lg font-semibold">Category Visibility</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => {
              const isDisabled = disabledCategoryNames.has(category);
              return (
                <div
                  key={category}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <span className="text-sm font-medium">{category}</span>
                  <Switch
                    checked={!isDisabled}
                    disabled={toggleCategoryMutation.isPending}
                    onCheckedChange={(checked) =>
                      toggleCategoryMutation.mutate({
                        categoryName: category,
                        available: checked,
                      })
                    }
                  />
                  <span className="text-xs text-gray-500">
                    {isDisabled ? "Hidden" : "Visible"}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Toggle category visibility to show/hide entire categories on the public menu.
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-0 shadow-lg mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No menu items found
          </div>
        ) : (
          filteredItems.map((item) => (
            <Card
              key={item.id}
              className={`border-0 shadow-lg overflow-hidden ${
                !item.available ? "opacity-60" : ""
              }`}
            >
              <div className="relative h-40 bg-gray-100">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.available
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.available ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <span className="text-sm text-gray-500">{item.category}</span>
                  </div>
                  <span className="text-lg font-bold text-teal">
                    ${Number(item.price).toFixed(2)}
                  </span>
                </div>
                {item.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.available}
                      disabled={toggleAvailabilityMutation.isPending}
                      onCheckedChange={(checked) =>
                        toggleAvailabilityMutation.mutate({
                          squareId: item.square_id,
                          available: checked,
                        })
                      }
                    />
                    <span className="text-sm text-gray-500">
                      {item.available ? "Visible" : "Hidden"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Square ID: {item.square_id.substring(0, 8)}...
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

