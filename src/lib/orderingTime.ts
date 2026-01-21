/**
 * Utility functions for parsing and validating ordering hours
 */
import { toZonedTime } from "date-fns-tz";
import { getDay, getHours, getMinutes } from "date-fns";

interface OrderingHours {
  [key: string]: string | null | undefined;
}

interface TimeRange {
  start: number; // minutes since midnight
  end: number; // minutes since midnight
}

/**
 * Parse a time string like "7am" or "7:30pm" to minutes since midnight
 */
function parseTime(timeStr: string): number | null {
  if (!timeStr || typeof timeStr !== "string") {
    return null;
  }

  const trimmed = timeStr.trim().toLowerCase();

  // Handle "closed" case
  if (trimmed === "closed" || trimmed === "") {
    return null;
  }

  // Match patterns like "7am", "7:30am", "7pm", "7:30pm", "19:00", "19:30"
  // Pattern 1: "7:30am", "19:30"
  // Group 1: Hours, Group 2: Minutes, Group 3: Period (optional)
  const patternWithMinutes = /^(\d{1,2}):(\d{2})\s*(am|pm)?$/i;
  let match = trimmed.match(patternWithMinutes);

  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3]?.toLowerCase();

    // Validate parsing
    if (isNaN(hours) || isNaN(minutes)) return null;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

    // Convert to 24-hour
    if (period) {
      if (period === "pm" && hours < 12) hours += 12;
      if (period === "am" && hours === 12) hours = 0;
    } else if (hours < 12 && !period) {
      // Ambiguous without am/pm, but usually if it's "7:30" with no am/pm we might assume 24h if >12, but if <12?
      // Actually the code previously assumed if hours >= 12 it's 24h.
      // Let's stick to safe logic: if am/pm provided found, use it.
    }

    return hours * 60 + minutes;
  }

  // Pattern 2: "7am", "7pm"
  // Group 1: Hours, Group 2: Period
  const patternHoursOnly = /^(\d{1,2})\s*(am|pm)$/i;
  match = trimmed.match(patternHoursOnly);

  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = 0;
    const period = match[2].toLowerCase();

    if (isNaN(hours)) return null;
    if (hours < 0 || hours > 23) return null;

    if (period === "pm" && hours < 12) hours += 12;
    if (period === "am" && hours === 12) hours = 0;

    return hours * 60 + minutes;
  }

  console.warn(`[OrderingTime] No pattern matched for time string: "${timeStr}"`);
  return null;
}

/**
 * Parse a time range string like "7am - 7:30pm" or "Closed"
 */
function parseTimeRange(rangeStr: string | null | undefined): TimeRange | null {
  if (!rangeStr || rangeStr.trim().toLowerCase() === "closed") {
    return null;
  }

  const parts = rangeStr.split("-").map((s) => s.trim());
  if (parts.length !== 2) {
    return null;
  }

  const start = parseTime(parts[0]);
  const end = parseTime(parts[1]);

  if (start === null || end === null) {
    return null;
  }

  return { start, end };
}

/**
 * Get the ordering hours for a specific day of the week and item type
 * @param dayOfWeek 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 * @param itemType "food" or "drinks"
 */
function getOrderingHoursForDay(
  hours: OrderingHours,
  dayOfWeek: number,
  itemType: "food" | "drinks" = "food"
): string | null {
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayName = dayNames[dayOfWeek];
  const fieldName = `${dayName}_${itemType}_ordering_hours` as keyof OrderingHours;
  return hours[fieldName] || null;
}

/**
 * Check if ordering is currently available based on ordering hours for a specific item type
 * @param hours Ordering hours object
 * @param itemType "food" or "drinks"
 * @param timezone The timezone of the business (default: "Australia/Sydney")
 * @param currentTime Optional current date/time to check against (defaults to now)
 * @returns Object with availability status and message
 */
export function checkOrderingAvailabilityByType(
  hours: OrderingHours,
  itemType: "food" | "drinks",
  timezone: string = "Australia/Sydney",
  currentTime?: Date
): { isAvailable: boolean; message: string; currentDayHours: string | null } {
  // Get time in the specific timezone
  // If currentTime is provided, use it, otherwise use current time
  const now = currentTime || new Date();

  // Convert 'now' to the business timezone to get the correct day/hour/minute
  const zonedDate = toZonedTime(now, timezone);
  const dayOfWeek = getDay(zonedDate); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const currentHours = getHours(zonedDate);
  const currentMins = getMinutes(zonedDate);
  const currentMinutes = currentHours * 60 + currentMins;

  const dayHours = getOrderingHoursForDay(hours, dayOfWeek, itemType);
  const timeRange = parseTimeRange(dayHours);

  if (!timeRange) {
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const itemTypeLabel = itemType === "drinks" ? "drinks" : "food";
    return {
      isAvailable: false,
      message: `${itemTypeLabel.charAt(0).toUpperCase() + itemTypeLabel.slice(1)} ordering is closed on ${dayNames[dayOfWeek]}.`,
      currentDayHours: dayHours,
    };
  }

  // Handle case where end time is before start time (e.g., overnight hours)
  let isWithinRange = false;
  if (timeRange.end >= timeRange.start) {
    // Normal case: same day
    isWithinRange =
      currentMinutes >= timeRange.start && currentMinutes <= timeRange.end;
  } else {
    // Overnight case: spans midnight
    isWithinRange =
      currentMinutes >= timeRange.start || currentMinutes <= timeRange.end;
  }

  if (isWithinRange) {
    return {
      isAvailable: true,
      message: "Ordering is currently available.",
      currentDayHours: dayHours,
    };
  } else {
    // Format the hours for display
    const formatMinutes = (mins: number) => {
      // Validate that mins is a valid number
      if (typeof mins !== "number" || isNaN(mins) || mins < 0 || mins >= 24 * 60) {
        console.error(`[OrderingTime] Invalid minutes value: ${mins}`);
        return "Invalid";
      }
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      const period = h >= 12 ? "pm" : "am";
      const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
      return m > 0 ? `${displayH}:${m.toString().padStart(2, "0")}${period}` : `${displayH}${period}`;
    };

    // Validate timeRange before formatting
    if (typeof timeRange.start !== "number" || isNaN(timeRange.start) ||
      typeof timeRange.end !== "number" || isNaN(timeRange.end)) {
      console.error(`[OrderingTime] Invalid time range:`, timeRange, `for hours:`, dayHours);
      const itemTypeLabel = itemType === "drinks" ? "drinks" : "food";
      return {
        isAvailable: false,
        message: `${itemTypeLabel.charAt(0).toUpperCase() + itemTypeLabel.slice(1)} ordering is currently closed.`,
        currentDayHours: dayHours,
      };
    }

    const hoursDisplay = `${formatMinutes(timeRange.start)} - ${formatMinutes(timeRange.end)}`;
    const itemTypeLabel = itemType === "drinks" ? "drinks" : "food";
    return {
      isAvailable: false,
      message: `${itemTypeLabel.charAt(0).toUpperCase() + itemTypeLabel.slice(1)} ordering is currently closed. Ordering hours: ${hoursDisplay}`,
      currentDayHours: dayHours,
    };
  }
}

/**
 * Check if ordering is currently available (defaults to food for backward compatibility)
 * @param hours Ordering hours object
 * @param timezone The timezone of the business
 * @param currentTime Optional current time (defaults to now)
 * @returns Object with availability status and message
 */
export function checkOrderingAvailability(
  hours: OrderingHours,
  timezone: string = "Australia/Sydney",
  currentTime?: Date
): { isAvailable: boolean; message: string; currentDayHours: string | null } {
  return checkOrderingAvailabilityByType(hours, "food", timezone, currentTime);
}

/**
 * Get all ordering hours formatted for display
 */
export function getOrderingHoursDisplay(
  hours: OrderingHours,
  itemType: "food" | "drinks" = "food"
): {
  [key: string]: string;
} {
  const suffix = itemType === "drinks" ? "_drinks_ordering_hours" : "_food_ordering_hours";
  return {
    Monday: hours[`monday${suffix}` as keyof OrderingHours] || "Closed",
    Tuesday: hours[`tuesday${suffix}` as keyof OrderingHours] || "Closed",
    Wednesday: hours[`wednesday${suffix}` as keyof OrderingHours] || "Closed",
    Thursday: hours[`thursday${suffix}` as keyof OrderingHours] || "Closed",
    Friday: hours[`friday${suffix}` as keyof OrderingHours] || "Closed",
    Saturday: hours[`saturday${suffix}` as keyof OrderingHours] || "Closed",
    Sunday: hours[`sunday${suffix}` as keyof OrderingHours] || "Closed",
  };
}
