"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MenuItem, SelectedModifier, ModifierList } from "@/types";
import { X } from "lucide-react";

interface ModifierDialogProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItem, selectedModifiers: SelectedModifier[]) => void;
}

export default function ModifierDialog({
  item,
  isOpen,
  onClose,
  onAddToCart,
}: ModifierDialogProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<Map<string, string[]>>(new Map());

  const handleModifierToggle = (modifierListId: string, modifierId: string, selectionType: "SINGLE" | "MULTIPLE") => {
    setSelectedModifiers((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(modifierListId) || [];

      if (selectionType === "SINGLE") {
        // For single selection, replace the array with just this modifier
        newMap.set(modifierListId, [modifierId]);
      } else {
        // For multiple selection, toggle the modifier
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

  // Check if all required modifiers are selected
  const validateRequiredModifiers = (): { isValid: boolean; missingModifiers: string[] } => {
    const missingModifiers: string[] = [];
    
    item.modifierLists?.forEach((modifierList) => {
      if (modifierList.required) {
        const selected = selectedModifiers.get(modifierList.id) || [];
        if (selected.length === 0) {
          missingModifiers.push(modifierList.name);
        }
      }
    });
    
    return {
      isValid: missingModifiers.length === 0,
      missingModifiers,
    };
  };

  const handleAddToCart = () => {
    // Validate required modifiers before adding to cart
    const validation = validateRequiredModifiers();
    if (!validation.isValid) {
      // Don't add to cart if required modifiers are missing
      return;
    }

    const modifiers: SelectedModifier[] = [];
    item.modifierLists?.forEach((modifierList) => {
      const selected = selectedModifiers.get(modifierList.id) || [];
      selected.forEach((modifierId) => {
        const modifier = modifierList.modifiers.find((m) => m.id === modifierId);
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

    onAddToCart(item, modifiers);
    onClose();
    // Reset selections
    setSelectedModifiers(new Map());
  };

  const totalPrice = calculateTotalPrice();
  const validation = validateRequiredModifiers();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{item.name}</DialogTitle>
          {item.description && (
            <p className="text-gray-600 mt-2">{item.description}</p>
          )}
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {item.modifierLists && item.modifierLists.length > 0 ? (
            item.modifierLists.map((modifierList: ModifierList) => (
              <div key={modifierList.id} className="border-b pb-4 last:border-b-0">
                <h3 className="font-semibold text-lg mb-2">
                  {modifierList.name}
                  {modifierList.required && (
                    <span className="text-sm text-red-500 font-normal ml-2">* Required</span>
                  )}
                  {modifierList.selectionType === "SINGLE" && (
                    <span className="text-sm text-gray-500 font-normal ml-2">(Select one)</span>
                  )}
                  {modifierList.selectionType === "MULTIPLE" && (
                    <span className="text-sm text-gray-500 font-normal ml-2">(Select multiple)</span>
                  )}
                </h3>
                {modifierList.required && 
                 (selectedModifiers.get(modifierList.id) || []).length === 0 && (
                  <p className="text-red-500 text-sm mb-2 italic">
                    Please select at least one option
                  </p>
                )}
                {modifierList.modifiers && modifierList.modifiers.length > 0 ? (
                  <div className="space-y-2">
                    {modifierList.modifiers.map((modifier) => {
                  const isSelected = selectedModifiers.get(modifierList.id)?.includes(modifier.id) || false;
                  return (
                    <button
                      key={modifier.id}
                      onClick={() => handleModifierToggle(modifierList.id, modifier.id, modifierList.selectionType)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-teal bg-teal/10"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{modifier.name}</span>
                        {modifier.price > 0 && (
                          <span className="text-teal font-semibold">
                            +${modifier.price.toFixed(2)}
                          </span>
                        )}
                        {modifier.price === 0 && (
                          <span className="text-gray-400 text-sm">Free</span>
                        )}
                      </div>
                    </button>
                  );
                })}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm italic">No options available</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center py-8">No customization options available</p>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t pt-4 mt-6">
          {!validation.isValid && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium mb-1">
                Please select required options:
              </p>
              <ul className="text-red-600 text-sm list-disc list-inside">
                {validation.missingModifiers.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-2xl font-bold text-teal">${totalPrice.toFixed(2)}</span>
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={!validation.isValid}
            className={`w-full h-12 text-lg font-semibold ${
              validation.isValid
                ? "bg-teal hover:bg-teal-dark text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {validation.isValid ? "Add to Cart" : "Select Required Options"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
