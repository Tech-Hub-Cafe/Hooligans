"use client";

import React, { useState, useEffect } from "react";
import { MenuItem, SelectedModifier, ModifierList } from "@/types";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ModifierSelectorProps {
  item: MenuItem;
  onModifiersChange: (modifiers: SelectedModifier[], comment?: string) => void;
}

export default function ModifierSelector({
  item,
  onModifiersChange,
}: ModifierSelectorProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<Map<string, string[]>>(new Map());
  const [comment, setComment] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper function to build modifiers array from selectedModifiers state
  const buildModifiersArray = (modifiersMap: Map<string, string[]>): SelectedModifier[] => {
    const modifiers: SelectedModifier[] = [];
    item.modifierLists?.forEach((modifierList) => {
      const selected = modifiersMap.get(modifierList.id) || [];
      selected.forEach((id) => {
        const modifier = modifierList.modifiers.find((m) => m.id === id);
        if (modifier) {
          modifiers.push({
            modifierListId: modifierList.id,
            modifierListName: modifierList.name,
            modifierId: modifier.id,
            modifierName: modifier.name,
            modifierPrice: modifier.price,
          });
        }
      });
    });
    return modifiers;
  };

  // Notify parent when selectedModifiers or comment changes
  useEffect(() => {
    const modifiers = buildModifiersArray(selectedModifiers);
    onModifiersChange(modifiers, comment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModifiers, comment]);

  const handleModifierToggle = (modifierListId: string, modifierId: string, selectionType: "SINGLE" | "MULTIPLE") => {
    setSelectedModifiers((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(modifierListId) || [];

      if (selectionType === "SINGLE") {
        newMap.set(modifierListId, [modifierId]);
      } else {
        if (current.includes(modifierId)) {
          newMap.set(modifierListId, current.filter((id) => id !== modifierId));
        } else {
          newMap.set(modifierListId, [...current, modifierId]);
        }
      }

      return newMap;
    });
  };

  const calculateTotalPrice = (): number => {
    let total = item.price;
    item.modifierLists?.forEach((modifierList) => {
      const selected = selectedModifiers.get(modifierList.id) || [];
      selected.forEach((modifierId) => {
        const modifier = modifierList.modifiers.find((m) => m.id === modifierId);
        if (modifier) {
          total += modifier.price;
        }
      });
    });
    return total;
  };

  const validateRequiredModifiers = (): boolean => {
    return item.modifierLists?.every((modifierList) => {
      if (modifierList.required) {
        const selected = selectedModifiers.get(modifierList.id) || [];
        return selected.length > 0;
      }
      return true;
    }) ?? true;
  };

  const totalPrice = calculateTotalPrice();
  const isValid = validateRequiredModifiers();

  if (!item.modifierLists || item.modifierLists.length === 0) {
    return null;
  }

  // Sort modifier lists: required ones first
  const sortedModifierLists = [...(item.modifierLists || [])].sort((a, b) => {
    if (a.required && !b.required) return -1;
    if (!a.required && b.required) return 1;
    return 0;
  });

  const handleCommentChange = (newComment: string) => {
    setComment(newComment);
    // Parent will be notified via useEffect when comment state updates
  };

  return (
    <div className="mt-3 border-t pt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        <span>Customize options</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-4">
          {sortedModifierLists.map((modifierList: ModifierList) => (
            <div key={modifierList.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {modifierList.name}
                {modifierList.required && <span className="text-gray-700 ml-1">*</span>}
                {modifierList.selectionType === "SINGLE" && (
                  <span className="text-xs text-gray-500 font-normal ml-2">(Select one)</span>
                )}
                {modifierList.selectionType === "MULTIPLE" && (
                  <span className="text-xs text-gray-500 font-normal ml-2">(Select multiple)</span>
                )}
              </label>
              {modifierList.modifiers && modifierList.modifiers.length > 0 ? (
                <div className="space-y-2">
                  {modifierList.modifiers.map((modifier) => {
                    const isSelected = selectedModifiers.get(modifierList.id)?.includes(modifier.id) || false;
                    return (
                      <label
                        key={modifier.id}
                        className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer"
                      >
                        {modifierList.selectionType === "SINGLE" ? (
                          <input
                            type="radio"
                            name={modifierList.id}
                            checked={isSelected}
                            onChange={() => handleModifierToggle(modifierList.id, modifier.id, modifierList.selectionType)}
                            className="w-4 h-4 text-teal"
                          />
                        ) : (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleModifierToggle(modifierList.id, modifier.id, modifierList.selectionType)}
                            className="w-4 h-4 text-teal rounded"
                          />
                        )}
                        <span className="flex-1 text-sm">{modifier.name}</span>
                        {modifier.price > 0 && (
                          <span className="text-sm text-teal font-semibold">
                            +${modifier.price.toFixed(2)}
                          </span>
                        )}
                        {modifier.price === 0 && (
                          <span className="text-xs text-gray-400">Free</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-400 text-sm italic">No options available</p>
              )}
            </div>
          ))}
          
          {/* Comment Section */}
          <div className="pt-2 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions (Optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => handleCommentChange(e.target.value)}
              placeholder="Add any special requests or notes..."
              className="w-full text-sm resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-400 mt-1">
              {comment.length}/500 characters
            </p>
          </div>
          
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Total:</span>
              <span className="text-lg font-bold text-teal">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
