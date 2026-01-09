"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Store,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Loader2,
  Save,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CafeSettings {
  id: number;
  cafe_name: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  monday_hours: string;
  tuesday_hours: string;
  wednesday_hours: string;
  thursday_hours: string;
  friday_hours: string;
  saturday_hours: string;
  sunday_hours: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  tiktok_url: string;
}

async function fetchSettings(): Promise<CafeSettings> {
  const res = await fetch("/api/admin/settings");
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<CafeSettings>>({});
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: fetchSettings,
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<CafeSettings>) => {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const updateField = (field: keyof CafeSettings, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your cafe&apos;s information and settings
          </p>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={updateMutation.isPending}
          className="bg-teal hover:bg-teal-dark text-white gap-2"
        >
          {saved ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Saved!
            </>
          ) : updateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="general" className="gap-2">
              <Store className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="hours" className="gap-2">
              <Clock className="w-4 h-4" />
              Trading Hours
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-2">
              <Globe className="w-4 h-4" />
              Social Links
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general">
            <div className="grid gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-teal" />
                    Cafe Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cafe_name">Cafe Name</Label>
                      <Input
                        id="cafe_name"
                        value={formData.cafe_name || ""}
                        onChange={(e) => updateField("cafe_name", e.target.value)}
                        placeholder="Hooligans"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tagline">Tagline</Label>
                      <Input
                        id="tagline"
                        value={formData.tagline || ""}
                        onChange={(e) => updateField("tagline", e.target.value)}
                        placeholder="Artisan Coffee & Cuisine"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ""}
                      onChange={(e) => updateField("description", e.target.value)}
                      rows={3}
                      placeholder="A brief description of your cafe..."
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-teal" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address || ""}
                      onChange={(e) => updateField("address", e.target.value)}
                      placeholder="123 Coffee Street"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone || ""}
                        onChange={(e) => updateField("phone", e.target.value)}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder="hello@hooligans.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trading Hours Tab */}
          <TabsContent value="hours">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal" />
                  Trading Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { day: "Monday", field: "monday_hours" },
                    { day: "Tuesday", field: "tuesday_hours" },
                    { day: "Wednesday", field: "wednesday_hours" },
                    { day: "Thursday", field: "thursday_hours" },
                    { day: "Friday", field: "friday_hours" },
                    { day: "Saturday", field: "saturday_hours" },
                    { day: "Sunday", field: "sunday_hours" },
                  ].map(({ day, field }) => (
                    <div
                      key={day}
                      className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <Label className="w-28 font-medium">{day}</Label>
                      <Input
                        value={formData[field as keyof CafeSettings] as string || ""}
                        onChange={(e) =>
                          updateField(field as keyof CafeSettings, e.target.value)
                        }
                        placeholder="7am - 8pm or Closed"
                        className="flex-1 max-w-xs"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Tip: Enter &quot;Closed&quot; for days when the cafe is not open
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Links Tab */}
          <TabsContent value="social">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-teal" />
                  Social Media Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label
                      htmlFor="facebook_url"
                      className="flex items-center gap-2"
                    >
                      <Facebook className="w-4 h-4 text-blue-600" />
                      Facebook
                    </Label>
                    <Input
                      id="facebook_url"
                      type="url"
                      value={formData.facebook_url || ""}
                      onChange={(e) =>
                        updateField("facebook_url", e.target.value)
                      }
                      placeholder="https://facebook.com/youpage"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="instagram_url"
                      className="flex items-center gap-2"
                    >
                      <Instagram className="w-4 h-4 text-pink-600" />
                      Instagram
                    </Label>
                    <Input
                      id="instagram_url"
                      type="url"
                      value={formData.instagram_url || ""}
                      onChange={(e) =>
                        updateField("instagram_url", e.target.value)
                      }
                      placeholder="https://instagram.com/yourhandle"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="twitter_url"
                      className="flex items-center gap-2"
                    >
                      <Twitter className="w-4 h-4 text-sky-500" />
                      Twitter / X
                    </Label>
                    <Input
                      id="twitter_url"
                      type="url"
                      value={formData.twitter_url || ""}
                      onChange={(e) => updateField("twitter_url", e.target.value)}
                      placeholder="https://twitter.com/yourhandle"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="tiktok_url"
                      className="flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                      </svg>
                      TikTok
                    </Label>
                    <Input
                      id="tiktok_url"
                      type="url"
                      value={formData.tiktok_url || ""}
                      onChange={(e) => updateField("tiktok_url", e.target.value)}
                      placeholder="https://tiktok.com/@yourhandle"
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  These links will be displayed in the footer and contact page of
                  your website
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}

