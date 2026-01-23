"use client";

import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mx-auto mb-8">
          <WifiOff className="w-12 h-12 text-teal" />
        </div>
        <h1 className="text-4xl font-bold mb-4">You&apos;re Offline</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          It looks like you&apos;ve lost your internet connection. Please check your 
          connection and try again.
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="bg-teal hover:bg-teal-dark text-white font-semibold px-8 py-6"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}

