"use client";

import React, { useState, useEffect } from "react";
import { MenuItem, SelectedModifier, ModifierList, CartItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditCartItemDialogProps {
  cartItem: CartItem;
  menuItem: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: CartItem) => void;
}

export default function EditCartItemDialog({
  cartItem,
  menuItem,
  isOpen,
  onClose,
  onSave,
}: EditCartItemDialogProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<Map<string, string[]>>(new Map());
  const [comment, setComment] = useState(cartItem.comment || "");

  // Initialize selected modifiers from cart item
  useEffect(() => {
    if (cartItem.modifiers && cartItem.modifiers.length > 0) {
      const modifierMap = new Map<string, string[]>();
      cartItem.modifiers.forEach((mod) => {
        const existing = modifierMap.get(mod.modifierListId) || [];
        modifierMap.set(mod.modifierListId, [...existing, mod.modifierId]);
      });
      setSelectedModifiers(modifierMap);
    } else {
      setSelectedModifiers(new Map());
    }
    setComment(cartItem.comment || "");
  }, [cartItem, isOpen]);

  if (!menuItem) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unable to Edit Item</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600 mb-4">
              Could not find menu item details. The item may have been removed from the menu.
            </p>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleModifierToggle = (
    modifierListId: string,
    modifierId: string,
    selectionType: "SINGLE" | "MULTIPLE"
  ) => {
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
    const basePrice = menuItem.price;
    let modifierTotal = 0;

    menuItem.modifierLists?.forEach((modifierList) => {
      const selected = selectedModifiers.get(modifierList.id) || [];
      selected.forEach((modifierId) => {
        const modifier = modifierList.modifiers.find((m) => m.id === modifierId);
        if (modifier) {
          modifierTotal += modifier.price;
        }
      });
    });

    return basePrice + modifierTotal;
  };

  const validateRequiredModifiers = (): boolean => {
    return menuItem.modifierLists?.every((modifierList) => {
      if (modifierList.required) {
        const selected = selectedModifiers.get(modifierList.id) || [];
        return selected.length > 0;
      }
      return true;
    }) ?? true;
  };

  const handleSave = () => {
    if (!validateRequiredModifiers()) {
      return;
    }

    // Build selected modifiers array
    const modifiers: SelectedModifier[] = [];
    menuItem.modifierLists?.forEach((modifierList) => {
      const selected = selectedModifiers.get(modifierList.id) || [];
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

    const newPrice = calculateTotalPrice();
    const updatedItem: CartItem = {
      ...cartItem,
      modifiers: modifiers.length > 0 ? modifiers : undefined,
      comment: comment.trim() || undefined,
      price: newPrice,
      basePrice: menuItem.price,
    };

    onSave(updatedItem);
    onClose();
  };

  const totalPrice = calculateTotalPrice();
  const isValid = validateRequiredModifiers();

  // Sort modifier lists: required ones first
  const sortedModifierLists = [...(menuItem.modifierLists || [])].sort((a, b) => {
    if (a.required && !b.required) return -1;
    if (!a.required && b.required) return 1;
    return 0;
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" showCloseButton={true}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit {cartItem.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Modifier Lists */}
          {sortedModifierLists.length > 0 && (
            <div className="space-y-4">
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
                        const isSelected =
                          selectedModifiers.get(modifierList.id)?.includes(modifier.id) || false;
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
                                onChange={() =>
                                  handleModifierToggle(
                                    modifierList.id,
                                    modifier.id,
                                    modifierList.selectionType
                                  )
                                }
                                className="w-4 h-4 text-teal"
                              />
                            ) : (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  handleModifierToggle(
                                    modifierList.id,
                                    modifier.id,
                                    modifierList.selectionType
                                  )
                                }
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
            </div>
          )}

          {/* Comment Section */}
          <div className="pt-2 border-t">
            <label htmlFor="edit-comment" className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions (Optional)
            </label>
            <Textarea
              id="edit-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g., no ice, extra sauce, allergies..."
              maxLength={500}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Total Price */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Item Price:</span>
              <span className="text-lg font-bold text-teal">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
              <span>Quantity: {cartItem.quantity}</span>
              <span>Subtotal: ${(totalPrice * cartItem.quantity).toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isValid}
              className="flex-1 bg-teal hover:bg-teal/90"
            >
              Save Changes
            </Button>
          </div>

          {!isValid && (
            <p className="text-sm text-red-500 text-center">
              Please select all required modifiers
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
