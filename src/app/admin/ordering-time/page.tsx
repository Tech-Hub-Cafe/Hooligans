"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Loader2,
  Save,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OrderingHours {
  monday_food_ordering_hours: string | null;
  tuesday_food_ordering_hours: string | null;
  wednesday_food_ordering_hours: string | null;
  thursday_food_ordering_hours: string | null;
  friday_food_ordering_hours: string | null;
  saturday_food_ordering_hours: string | null;
  sunday_food_ordering_hours: string | null;
  monday_drinks_ordering_hours: string | null;
  tuesday_drinks_ordering_hours: string | null;
  wednesday_drinks_ordering_hours: string | null;
  thursday_drinks_ordering_hours: string | null;
  friday_drinks_ordering_hours: string | null;
  saturday_drinks_ordering_hours: string | null;
  sunday_drinks_ordering_hours: string | null;
  monday_combo_ordering_hours: string | null;
  tuesday_combo_ordering_hours: string | null;
  wednesday_combo_ordering_hours: string | null;
  thursday_combo_ordering_hours: string | null;
  friday_combo_ordering_hours: string | null;
  saturday_combo_ordering_hours: string | null;
  sunday_combo_ordering_hours: string | null;
}

interface CategoryAssignment {
  id: number;
  category_name: string;
  section: "food" | "drinks" | "combo";
}

interface OrderingAvailability {
  food?: {
    isOrderingAvailable: boolean;
    message: string;
    currentDayHours: string | null;
  };
  drinks?: {
    isOrderingAvailable: boolean;
    message: string;
    currentDayHours: string | null;
  };
  isOrderingAvailable?: boolean;
  message?: string;
  currentDayHours?: string | null;
}


async function fetchOrderingHours(): Promise<OrderingHours> {
  const res = await fetch("/api/admin/ordering-time");
  if (!res.ok) throw new Error("Failed to fetch ordering hours");
  return res.json();
}

async function fetchOrderingAvailability(): Promise<OrderingAvailability> {
  const res = await fetch("/api/ordering-time");
  if (!res.ok) throw new Error("Failed to fetch ordering availability");
  const data = await res.json();
  // New structure returns food and drinks separately
  return {
    food: data.food,
    drinks: data.drinks,
  };
}

async function fetchCategoryAssignments(): Promise<CategoryAssignment[]> {
  const res = await fetch("/api/admin/category-assignments");
  if (!res.ok) throw new Error("Failed to fetch category assignments");
  return res.json();
}

async function fetchCategoriesFromSquare(): Promise<string[]> {
  const res = await fetch("/api/admin/categories-from-square");
  if (!res.ok) throw new Error("Failed to fetch categories from Square");
  const data = await res.json();
  return data.categories || [];
}

export default function AdminOrderingTimePage() {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Update page title
  useEffect(() => {
    document.title = "Ordering Time | Hooligans Admin";
  }, []);

  const { data: hours, isLoading } = useQuery({
    queryKey: ["admin-ordering-hours"],
    queryFn: fetchOrderingHours,
  });

  const { data: availability } = useQuery({
    queryKey: ["ordering-availability"],
    queryFn: fetchOrderingAvailability,
    refetchInterval: 60000, // Refetch every minute to update status
  });

  const { data: categoryAssignments = [], refetch: refetchAssignments } = useQuery({
    queryKey: ["category-assignments"],
    queryFn: fetchCategoryAssignments,
  });

  const { data: squareCategories = [] } = useQuery({
    queryKey: ["square-categories"],
    queryFn: fetchCategoriesFromSquare,
  });

  // Initialize form data from query data, with fallback defaults
  const defaultFormData: OrderingHours = {
    monday_food_ordering_hours: null,
    tuesday_food_ordering_hours: null,
    wednesday_food_ordering_hours: null,
    thursday_food_ordering_hours: null,
    friday_food_ordering_hours: null,
    saturday_food_ordering_hours: null,
    sunday_food_ordering_hours: null,
    monday_drinks_ordering_hours: null,
    tuesday_drinks_ordering_hours: null,
    wednesday_drinks_ordering_hours: null,
    thursday_drinks_ordering_hours: null,
    friday_drinks_ordering_hours: null,
    saturday_drinks_ordering_hours: null,
    sunday_drinks_ordering_hours: null,
    monday_combo_ordering_hours: null,
    tuesday_combo_ordering_hours: null,
    wednesday_combo_ordering_hours: null,
    thursday_combo_ordering_hours: null,
    friday_combo_ordering_hours: null,
    saturday_combo_ordering_hours: null,
    sunday_combo_ordering_hours: null,
  };

  // Initialize form data only once when hours are first loaded
  const [formData, setFormData] = useState<OrderingHours>({
    ...defaultFormData,
    monday_combo_ordering_hours: null,
    tuesday_combo_ordering_hours: null,
    wednesday_combo_ordering_hours: null,
    thursday_combo_ordering_hours: null,
    friday_combo_ordering_hours: null,
    saturday_combo_ordering_hours: null,
    sunday_combo_ordering_hours: null,
  });

  // Update form data when hours are fetched for the first time
  useEffect(() => {
    if (hours && !isInitialized) {
      setFormData(hours);
      setIsInitialized(true);
    }
  }, [hours, isInitialized]);

  const [saveError, setSaveError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: async (data: OrderingHours) => {
      const res = await fetch("/api/admin/ordering-time", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update ordering hours");
      }
      return res.json();
    },
    onSuccess: (data) => {
      console.log("[AdminOrderingTime] Save successful, received data:", JSON.stringify(data, null, 2));
      queryClient.invalidateQueries({ queryKey: ["admin-ordering-hours"] });
      queryClient.invalidateQueries({ queryKey: ["ordering-availability"] });
      setSaved(true);
      setSaveError(null);
      // Reset initializedRef to allow timePickerState to update with saved data
      initializedRef.current = false;
      // Update formData with the saved data
      setFormData(data);
      // Force refetch to get the latest data
      queryClient.refetchQueries({ queryKey: ["admin-ordering-hours"] });
      setTimeout(() => setSaved(false), 5000); // Show success for 5 seconds
    },
    onError: (error: Error) => {
      console.error("[AdminOrderingTime] Error saving:", error);
      setSaveError(error.message || "Failed to save ordering hours. Please try again.");
      setSaved(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build formData from timePickerState to ensure we have the latest values
    const allDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    
    const allFields = [
      ...allDays.map((d) => `${d.toLowerCase()}_food_ordering_hours`),
      ...allDays.map((d) => `${d.toLowerCase()}_drinks_ordering_hours`),
      ...allDays.map((d) => `${d.toLowerCase()}_combo_ordering_hours`),
    ] as (keyof OrderingHours)[];
    
    // Build data from scratch using timePickerState, with fallback to formData
    const dataToSubmit: OrderingHours = {} as OrderingHours;
    
    allFields.forEach((field) => {
      const timeState = timePickerState[field];
      if (timeState) {
        // Use timePickerState if available (most up-to-date)
        if (timeState.closed) {
          dataToSubmit[field] = "Closed";
        } else {
          const formatted = formatTimeInputToString(timeState.start, timeState.end);
          // Only set if formatted is valid (not "Closed" or "Invalid")
          if (formatted && formatted !== "Closed" && formatted !== "Invalid") {
            dataToSubmit[field] = formatted;
          } else {
            // Fallback to existing value or null
            dataToSubmit[field] = formData[field] || null;
          }
        }
      } else {
        // If no timeState exists, use the current formData value or null
        dataToSubmit[field] = formData[field] || null;
      }
    });
    
    // Ensure all fields are present (even if null) to properly update the database
    console.log("[AdminOrderingTime] Submitting data:", JSON.stringify(dataToSubmit, null, 2));
    console.log("[AdminOrderingTime] TimePickerState keys:", Object.keys(timePickerState));
    
    updateMutation.mutate(dataToSubmit);
  };

  const updateField = (field: keyof OrderingHours, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value || null }));
  };

  // State to track time picker values for each field
  const [timePickerState, setTimePickerState] = useState<Record<string, { start: string; end: string; closed: boolean }>>({});
  const initializedRef = useRef(false);

  // Helper functions to parse and format times (defined before use)
  const parseTimeStringToTimeInput = (timeStr: string | null | undefined): { start: string; end: string } | null => {
    if (!timeStr || timeStr.trim().toLowerCase() === "closed") {
      return null;
    }

    const parts = timeStr.split("-").map((s) => s.trim());
    if (parts.length !== 2) {
      return null;
    }

    const parseToTimeInput = (time: string): string | null => {
      const trimmed = time.trim().toLowerCase();
      if (trimmed === "closed") return null;

      // Match patterns like "7am", "7:30am", "7pm", "7:30pm"
      const patterns = [
        /^(\d{1,2}):(\d{2})\s*(am|pm)$/i, // "7:30am"
        /^(\d{1,2})\s*(am|pm)$/i, // "7am"
      ];

      for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match) {
          let hours = parseInt(match[1], 10);
          const minutes = match[2] ? parseInt(match[2], 10) : 0;
          const period = match[3]?.toLowerCase();

          // Convert 12-hour to 24-hour
          if (period === "pm" && hours !== 12) {
            hours += 12;
          } else if (period === "am" && hours === 12) {
            hours = 0;
          }

          // Format as HH:MM for time input
          return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
        }
      }

      return null;
    };

    const start = parseToTimeInput(parts[0]);
    const end = parseToTimeInput(parts[1]);

    if (!start || !end) {
      return null;
    }

    return { start, end };
  };

  // Initialize time picker state from form data
  // Update whenever hours change (not just on first load) to reflect saved data
  useEffect(() => {
    if (hours) {
      const state: Record<string, { start: string; end: string; closed: boolean }> = {};
      const allDays = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      const allFields = [
        ...allDays.map((d) => `${d.toLowerCase()}_food_ordering_hours`),
        ...allDays.map((d) => `${d.toLowerCase()}_drinks_ordering_hours`),
        ...allDays.map((d) => `${d.toLowerCase()}_combo_ordering_hours`),
      ];

      allFields.forEach((field) => {
        const value = hours[field as keyof OrderingHours];
        const parsed = parseTimeStringToTimeInput(value || null);
        state[field] = {
          start: parsed?.start || "09:00",
          end: parsed?.end || "17:00",
          closed: !value || (typeof value === "string" && value.trim().toLowerCase() === "closed"),
        };
      });

      console.log("[AdminOrderingTime] Initializing timePickerState from hours:", Object.keys(state).length, "fields");
      setTimePickerState(state);
      // Update formData to match hours
      setFormData(hours);
      // Mark as initialized after first load, but allow updates when hours change
      if (!initializedRef.current) {
        initializedRef.current = true;
      }
    }
  }, [hours]);

  const formatTimeInputToString = (startTime: string, endTime: string): string => {
    if (!startTime || !endTime) {
      return "Closed";
    }

    const formatTime = (timeStr: string): string => {
      if (!timeStr || typeof timeStr !== "string") {
        return "Invalid";
      }
      const parts = timeStr.split(":");
      if (parts.length !== 2) {
        console.warn(`[AdminOrderingTime] Invalid time format: "${timeStr}"`);
        return "Invalid";
      }
      const hours = Number(parts[0]);
      const minutes = Number(parts[1]);
      
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.warn(`[AdminOrderingTime] Invalid time values: hours=${hours}, minutes=${minutes} from "${timeStr}"`);
        return "Invalid";
      }
      
      const period = hours >= 12 ? "pm" : "am";
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const minutesStr = minutes > 0 ? `:${minutes.toString().padStart(2, "0")}` : "";
      return `${displayHours}${minutesStr}${period}`;
    };

    const formattedStart = formatTime(startTime);
    const formattedEnd = formatTime(endTime);
    
    if (formattedStart === "Invalid" || formattedEnd === "Invalid") {
      return "Closed";
    }

    return `${formattedStart} - ${formattedEnd}`;
  };

  const updateTimeField = (field: keyof OrderingHours, startTime: string, endTime: string, isClosed: boolean) => {
    // Update time picker state
    setTimePickerState((prev) => {
      const updated = {
        ...prev,
        [field]: { start: startTime, end: endTime, closed: isClosed },
      };
      console.log(`[AdminOrderingTime] Updated ${field}:`, updated[field]);
      return updated;
    });

    // Update form data
    if (isClosed) {
      updateField(field, "Closed");
    } else {
      const formatted = formatTimeInputToString(startTime, endTime);
      if (formatted && formatted !== "Invalid") {
        updateField(field, formatted);
      } else {
        console.warn(`[AdminOrderingTime] Invalid time format for ${field}:`, { startTime, endTime, formatted });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal" />
      </div>
    );
  }

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ordering Time</h1>
          <p className="text-gray-600 mt-1">
            Set the hours when customers can place orders
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className={`gap-2 ${
              saved
                ? "bg-green-600 hover:bg-green-700 text-white"
                : updateMutation.isPending
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-teal hover:bg-teal-dark text-white"
            }`}
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Saved Successfully!
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
          {saveError && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md border border-red-200">
              <AlertCircle className="w-4 h-4" />
              <span>{saveError}</span>
            </div>
          )}
          {saved && !saveError && (
            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 px-3 py-2 rounded-md border border-green-200">
              <CheckCircle className="w-4 h-4" />
              <span>Your changes have been saved</span>
            </div>
          )}
        </div>
      </div>

      {/* Current Status */}
      {availability && (
        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-4">Current Status</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Food Status */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                {availability.food?.isOrderingAvailable ? (
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm mb-1">Food</p>
                  <p className={`text-sm ${availability.food?.isOrderingAvailable ? "text-green-600" : "text-red-600"}`}>
                    {availability.food?.message || "Status unknown"}
                  </p>
                  {availability.food?.currentDayHours && (
                    <p className="text-gray-500 text-xs mt-1">
                      Hours: {availability.food.currentDayHours}
                    </p>
                  )}
                </div>
              </div>
              {/* Drinks Status */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                {availability.drinks?.isOrderingAvailable ? (
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm mb-1">Drinks</p>
                  <p className={`text-sm ${availability.drinks?.isOrderingAvailable ? "text-green-600" : "text-red-600"}`}>
                    {availability.drinks?.message || "Status unknown"}
                  </p>
                  {availability.drinks?.currentDayHours && (
                    <p className="text-gray-500 text-xs mt-1">
                      Hours: {availability.drinks.currentDayHours}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="food" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
            <TabsTrigger value="food">Food Hours</TabsTrigger>
            <TabsTrigger value="drinks">Drinks Hours</TabsTrigger>
            <TabsTrigger value="combo">Combo Hours</TabsTrigger>
          </TabsList>

          {/* Food Ordering Hours */}
          <TabsContent value="food">
            <div className="space-y-6">
              {/* General Food Hours */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-teal" />
                    General Food Ordering Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {days.map((day) => {
                      const field = `${day.toLowerCase()}_food_ordering_hours` as keyof OrderingHours;
                      const timeState = timePickerState[field] || { start: "09:00", end: "17:00", closed: false };

                      return (
                        <div
                          key={day}
                          className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <Label className="w-28 font-medium">{day}</Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`${day}-closed-food`}
                                checked={timeState.closed}
                                onChange={(e) => {
                                  updateTimeField(field, timeState.start, timeState.end, e.target.checked);
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-teal focus:ring-teal"
                              />
                              <Label htmlFor={`${day}-closed-food`} className="text-sm font-normal cursor-pointer">
                                Closed
                              </Label>
                            </div>
                          </div>
                          {!timeState.closed && (
                            <div className="flex items-center gap-3 ml-28">
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`${day}-start-food`} className="text-sm text-gray-600">
                                  From:
                                </Label>
                                <Input
                                  id={`${day}-start-food`}
                                  type="time"
                                  value={timeState.start}
                                  onChange={(e) => {
                                    updateTimeField(field, e.target.value, timeState.end, false);
                                  }}
                                  className="w-32"
                                />
                              </div>
                              <span className="text-gray-400">-</span>
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`${day}-end-food`} className="text-sm text-gray-600">
                                  To:
                                </Label>
                                <Input
                                  id={`${day}-end-food`}
                                  type="time"
                                  value={timeState.end}
                                  onChange={(e) => {
                                    updateTimeField(field, timeState.start, e.target.value, false);
                                  }}
                                  className="w-32"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    Set ordering hours for food items. Categories assigned to Food Hours will use these times.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Drinks Ordering Hours */}
          <TabsContent value="drinks">
            <div className="space-y-6">
              {/* General Drinks Hours */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-teal" />
                    General Drinks Ordering Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {days.map((day) => {
                      const field = `${day.toLowerCase()}_drinks_ordering_hours` as keyof OrderingHours;
                      const timeState = timePickerState[field] || { start: "09:00", end: "17:00", closed: false };

                      return (
                        <div
                          key={day}
                          className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <Label className="w-28 font-medium">{day}</Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`${day}-closed-drinks`}
                                checked={timeState.closed}
                                onChange={(e) => {
                                  updateTimeField(field, timeState.start, timeState.end, e.target.checked);
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-teal focus:ring-teal"
                              />
                              <Label htmlFor={`${day}-closed-drinks`} className="text-sm font-normal cursor-pointer">
                                Closed
                              </Label>
                            </div>
                          </div>
                          {!timeState.closed && (
                            <div className="flex items-center gap-3 ml-28">
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`${day}-start-drinks`} className="text-sm text-gray-600">
                                  From:
                                </Label>
                                <Input
                                  id={`${day}-start-drinks`}
                                  type="time"
                                  value={timeState.start}
                                  onChange={(e) => {
                                    updateTimeField(field, e.target.value, timeState.end, false);
                                  }}
                                  className="w-32"
                                />
                              </div>
                              <span className="text-gray-400">-</span>
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`${day}-end-drinks`} className="text-sm text-gray-600">
                                  To:
                                </Label>
                                <Input
                                  id={`${day}-end-drinks`}
                                  type="time"
                                  value={timeState.end}
                                  onChange={(e) => {
                                    updateTimeField(field, timeState.start, e.target.value, false);
                                  }}
                                  className="w-32"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    Set ordering hours for drinks items. Categories assigned to Drinks Hours will use these times.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Combo Ordering Hours */}
          <TabsContent value="combo">
            <div className="space-y-6">
              {/* General Combo Hours */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-teal" />
                    General Combo Ordering Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {days.map((day) => {
                      const field = `${day.toLowerCase()}_combo_ordering_hours` as keyof OrderingHours;
                      const timeState = timePickerState[field] || { start: "09:00", end: "17:00", closed: false };

                      return (
                        <div
                          key={day}
                          className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <Label className="w-28 font-medium">{day}</Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`${day}-closed-combo`}
                                checked={timeState.closed}
                                onChange={(e) => {
                                  updateTimeField(field, timeState.start, timeState.end, e.target.checked);
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-teal focus:ring-teal"
                              />
                              <Label htmlFor={`${day}-closed-combo`} className="text-sm font-normal cursor-pointer">
                                Closed
                              </Label>
                            </div>
                          </div>
                          {!timeState.closed && (
                            <div className="flex items-center gap-3 ml-28">
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`${day}-start-combo`} className="text-sm text-gray-600">
                                  From:
                                </Label>
                                <Input
                                  id={`${day}-start-combo`}
                                  type="time"
                                  value={timeState.start}
                                  onChange={(e) => {
                                    updateTimeField(field, e.target.value, timeState.end, false);
                                  }}
                                  className="w-32"
                                />
                              </div>
                              <span className="text-gray-400">-</span>
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`${day}-end-combo`} className="text-sm text-gray-600">
                                  To:
                                </Label>
                                <Input
                                  id={`${day}-end-combo`}
                                  type="time"
                                  value={timeState.end}
                                  onChange={(e) => {
                                    updateTimeField(field, timeState.start, e.target.value, false);
                                  }}
                                  className="w-32"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    Set ordering hours for combo items. Categories assigned to Combo Hours will use these times.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </form>

      {/* Category Assignment Section */}
      <CategoryAssignmentSection
        squareCategories={squareCategories}
        categoryAssignments={categoryAssignments}
        onRefresh={refetchAssignments}
      />
    </div>
  );
}

// Category Assignment Section Component
function CategoryAssignmentSection({
  squareCategories,
  categoryAssignments,
  onRefresh,
}: {
  squareCategories: string[];
  categoryAssignments: CategoryAssignment[];
  onRefresh: () => void;
}) {
  const [localAssignments, setLocalAssignments] = useState<Map<string, "food" | "drinks" | "combo" | "unassigned">>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Initialize local assignments from fetched data
  useEffect(() => {
    const assignmentsMap = new Map<string, "food" | "drinks" | "combo" | "unassigned">();
    categoryAssignments.forEach((assignment) => {
      assignmentsMap.set(assignment.category_name, assignment.section);
    });
    setLocalAssignments(assignmentsMap);
  }, [categoryAssignments]);

  const handleAssignmentChange = (categoryName: string, section: "food" | "drinks" | "combo" | "unassigned") => {
    const newAssignments = new Map(localAssignments);
    if (section === "unassigned") {
      newAssignments.delete(categoryName);
    } else {
      newAssignments.set(categoryName, section);
    }
    setLocalAssignments(newAssignments);

    // Debounce save
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    const timeout = setTimeout(() => {
      handleSaveAssignments(newAssignments);
    }, 1000);
    setSaveTimeout(timeout);
  };

  const handleSaveAssignments = async (assignments?: Map<string, "food" | "drinks" | "combo" | "unassigned">) => {
    const assignmentsToSave = assignments || localAssignments;
    setIsSaving(true);

    try {
      const assignmentsArray = Array.from(assignmentsToSave.entries())
        .filter(([_, section]) => section !== "unassigned")
        .map(([category_name, section]) => ({
          category_name,
          section: section as "food" | "drinks" | "combo",
        }));

      const res = await fetch("/api/admin/category-assignments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments: assignmentsArray }),
      });

      if (!res.ok) {
        throw new Error("Failed to save category assignments");
      }

      onRefresh();
    } catch (error: any) {
      alert(error.message || "Failed to save category assignments");
    } finally {
      setIsSaving(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  // Create assignment map for quick lookup
  const assignmentMap = new Map<string, "food" | "drinks" | "combo">();
  categoryAssignments.forEach((assignment) => {
    assignmentMap.set(assignment.category_name, assignment.section);
  });

  // Count categories by section
  const foodCount = Array.from(localAssignments.values()).filter((s) => s === "food").length;
  const drinksCount = Array.from(localAssignments.values()).filter((s) => s === "drinks").length;
  const comboCount = Array.from(localAssignments.values()).filter((s) => s === "combo").length;
  const unassignedCount = squareCategories.length - foodCount - drinksCount - comboCount;

  return (
    <Card className="border-0 shadow-lg mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal" />
            Category Assignment
          </CardTitle>
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Assign categories from Square POS to Food Hours, Drinks Hours, or Combo Hours. Unassigned categories default to Drinks Hours.
        </p>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{foodCount}</div>
            <div className="text-sm text-gray-600">Food Hours</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{drinksCount}</div>
            <div className="text-sm text-gray-600">Drinks Hours</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{comboCount}</div>
            <div className="text-sm text-gray-600">Combo Hours</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{unassignedCount}</div>
            <div className="text-sm text-gray-600">Unassigned</div>
          </div>
        </div>

        {/* Category List */}
        {squareCategories.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No categories found from Square POS. Make sure Square is configured and categories exist.
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {squareCategories.map((category) => {
              const currentAssignment = localAssignments.get(category) || "unassigned";
              
              return (
                <div
                  key={category}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium">{category}</span>
                  <select
                    value={currentAssignment}
                    onChange={(e) => {
                      handleAssignmentChange(category, e.target.value as "food" | "drinks" | "combo" | "unassigned");
                    }}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal"
                  >
                    <option value="unassigned">Unassigned (Default: Drinks)</option>
                    <option value="food">Food Hours</option>
                    <option value="drinks">Drinks Hours</option>
                    <option value="combo">Combo Hours</option>
                  </select>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => handleSaveAssignments()}
            disabled={isSaving}
            className="bg-teal hover:bg-teal-dark text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Assignments
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
