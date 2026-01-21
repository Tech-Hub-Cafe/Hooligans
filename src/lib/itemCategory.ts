/**
 * Utility functions for classifying menu items as food or drinks
 */

import { MenuItem } from "@/types";

// Categories that are considered drinks (case-insensitive matching)
const DRINKS_CATEGORIES = [
  "Coffee",
  "Tea",
  "Beverages",
  "Drinks",
  "Juice",
  "Smoothie",
  "Cold Drinks",
  "Hot Drinks",
  "Iced Drinks",
];

/**
 * Check if a category is a drinks category
 */
export function isDrinksCategory(category: string): boolean {
  if (!category) return false;
  const normalizedCategory = category.toLowerCase().trim();
  return DRINKS_CATEGORIES.some((dc) =>
    normalizedCategory.includes(dc.toLowerCase())
  );
}

/**
 * Get the item type (food or drinks) based on category
 */
export function getItemType(item: MenuItem): "food" | "drinks" {
  const category = item.category || "";
  return isDrinksCategory(category) ? "drinks" : "food";
}

/**
 * Get the item type from a category string
 */
export function getItemTypeFromCategory(category: string): "food" | "drinks" {
  return isDrinksCategory(category) ? "drinks" : "food";
}
