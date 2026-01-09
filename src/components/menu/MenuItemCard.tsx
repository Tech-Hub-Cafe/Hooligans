"use client";

import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Check } from "lucide-react";
import { MenuItem } from "@/types";
import Image from "next/image";

interface MenuItemCardProps {
  item: MenuItem;
}

export default function MenuItemCard({ item }: MenuItemCardProps) {
  const [added, setAdded] = useState(false);

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cafeCart") || "[]");

    const existingItemIndex = cart.findIndex(
      (cartItem: { id: number }) => cartItem.id === item.id
    );

    if (existingItemIndex !== -1) {
      cart[existingItemIndex].quantity += 1;
    } else {
      cart.push({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
      });
    }

    localStorage.setItem("cafeCart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Card className="group overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-0">
      {item.image_url && (
        <div className="relative h-56 overflow-hidden bg-gray-200">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      )}

      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold group-hover:text-teal transition-colors duration-200">
            {item.name}
          </h3>
          <Badge className="bg-black text-white hover:bg-black">{item.category}</Badge>
        </div>

        {item.description && (
          <p className="text-gray-600 mb-4 leading-relaxed">{item.description}</p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-teal">${item.price.toFixed(2)}</span>

          {!item.available && (
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              Unavailable
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <Button
          onClick={addToCart}
          disabled={!item.available || added}
          className={`w-full font-semibold py-6 transition-all duration-300 ${
            added ? "bg-green-600 hover:bg-green-600" : "bg-teal hover:bg-teal-dark"
          } text-white`}
        >
          {added ? (
            <>
              <Check className="w-5 h-5 mr-2" />
              Added to Cart!
            </>
          ) : (
            <>
              <ShoppingBag className="w-5 h-5 mr-2" />
              Add to Cart
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

