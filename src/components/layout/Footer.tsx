"use client";

import React, { useState } from "react";
import { Facebook, Instagram, Twitter, Download, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { usePWAInstall } from "@/hooks/usePWAInstall";

interface CafeSettings {
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
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  tiktok_url: string | null;
}

async function fetchSettings(): Promise<CafeSettings> {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

export default function Footer() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["cafe-settings"],
    queryFn: fetchSettings,
    staleTime: 60 * 1000, // Cache for 1 minute
  });

  const { isInstalled, hasPrompt, isIOS, installPWA } = usePWAInstall();
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);

  // Use current year - calculate consistently to avoid hydration mismatch
  // Using useMemo ensures the same value on server and client
  const currentYear = React.useMemo(() => new Date().getFullYear(), []);

  // Default values if settings are loading or not available
  const cafeName = settings?.cafe_name || "Hooligans";
  const tagline = settings?.tagline || "Artisan Coffee & Cuisine";
  const description = settings?.description || "Your neighborhood spot for exceptional coffee and good vibes since 2024.";
  const address = settings?.address || "";
  const phone = settings?.phone || "";
  const email = settings?.email || "";

  // Format hours - use useMemo to prevent hydration mismatches
  const hoursContent = React.useMemo(() => {
    if (isLoading || !settings) {
      return (
        <>
          <p className="text-gray-400">Monday - Friday: 7am - 8pm</p>
          <p className="text-gray-400">Saturday - Sunday: 8am - 9pm</p>
        </>
      );
    }

    const days = [
      { label: "Monday", hours: settings.monday_hours },
      { label: "Tuesday", hours: settings.tuesday_hours },
      { label: "Wednesday", hours: settings.wednesday_hours },
      { label: "Thursday", hours: settings.thursday_hours },
      { label: "Friday", hours: settings.friday_hours },
      { label: "Saturday", hours: settings.saturday_hours },
      { label: "Sunday", hours: settings.sunday_hours },
    ];

    return days.map((day) => (
      <p key={day.label} className="text-gray-400">
        {day.label}: {day.hours || "Closed"}
      </p>
    ));
  }, [settings, isLoading]);

  return (
    <footer className="bg-black text-white py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="flex items-center space-x-3 mb-4 group">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center p-1">
                  <Image
                    src="/logo/Hooligans-Hero-Logo-2.png"
                    alt="Hooligans Logo"
                    width={48}
                    height={48}
                    className="w-full h-full object-contain transition-transform group-hover:rotate-6 duration-300"
                  />
                </div>
              </div>
              <Image
                src="/logo/Hooligans LS Logo 1.png"
                alt="Hooligans"
                width={120}
                height={20}
                className="h-5 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="text-gray-400 mb-4">{description}</p>
            {/* Social Links */}
            <div className="flex gap-4">
              {settings?.facebook_url && (
                <Link
                  href={settings.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-teal transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </Link>
              )}
              {settings?.instagram_url && (
                <Link
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-teal transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </Link>
              )}
              {settings?.twitter_url && (
                <Link
                  href={settings.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-teal transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </Link>
              )}
              {settings?.tiktok_url && (
                <Link
                  href={settings.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-teal transition-colors"
                  aria-label="TikTok"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-teal">Hours</h3>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-gray-800 rounded animate-pulse" />
                <div className="h-4 bg-gray-800 rounded animate-pulse" />
              </div>
            ) : (
              hoursContent
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-teal">Contact</h3>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-gray-800 rounded animate-pulse" />
                <div className="h-4 bg-gray-800 rounded animate-pulse" />
                <div className="h-4 bg-gray-800 rounded animate-pulse" />
              </div>
            ) : (
              <>
                {address && <p className="text-gray-400">{address}</p>}
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="text-gray-400 hover:text-teal transition-colors"
                  >
                    {email}
                  </a>
                )}
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="text-gray-400 hover:text-teal transition-colors block"
                  >
                    {phone}
                  </a>
                )}
              </>
            )}
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>&copy; {currentYear} {cafeName}. All rights reserved.</p>
          <div className="flex gap-4 mt-4 justify-center items-center flex-wrap">
            <Link
              href="/privacy"
              className="text-gray-400 hover:text-teal transition-colors text-sm underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-600">•</span>
            <Link
              href="/terms"
              className="text-gray-400 hover:text-teal transition-colors text-sm underline underline-offset-4"
            >
              Terms of Service
            </Link>
            {/* PWA Install — show when not installed */}
            {!isInstalled && (
              <>
                <span className="text-gray-600">•</span>
                {hasPrompt ? (
                  <button
                    type="button"
                    onClick={installPWA}
                    className="text-gray-400 hover:text-teal transition-colors text-sm underline underline-offset-4 flex items-center gap-1.5"
                    aria-label="Install Hooligans App"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install App</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowInstallInstructions(true)}
                    className="text-gray-400 hover:text-teal transition-colors text-sm underline underline-offset-4 flex items-center gap-1.5"
                    aria-label="How to install Hooligans App"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install App</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Install instructions modal — when browser doesn't offer install prompt (e.g. iOS or Android before criteria met) */}
      {showInstallInstructions && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          aria-modal="true"
          aria-labelledby="install-instructions-title"
          role="dialog"
          onClick={() => setShowInstallInstructions(false)}
        >
          <div
            className="bg-black border-t sm:border border-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-black border-b border-gray-800 px-4 py-3 flex items-center justify-between">
              <h2 id="install-instructions-title" className="text-lg font-semibold text-teal">
                Add Hooligans to your home screen
              </h2>
              <button
                type="button"
                onClick={() => setShowInstallInstructions(false)}
                className="p-2 text-gray-400 hover:text-white rounded-full"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4 text-gray-300 text-sm">
              {isIOS ? (
                <>
                  <p>On iPhone or iPad, use Safari:</p>
                  <ol className="list-decimal list-inside space-y-2 pl-1">
                    <li>Tap the <strong>Share</strong> button (box with arrow ↑) at the bottom of Safari.</li>
                    <li>Scroll and tap <strong>Add to Home Screen</strong>.</li>
                    <li>Tap <strong>Add</strong>.</li>
                  </ol>
                  <p className="text-gray-500 text-xs">
                    If you&apos;re in Chrome or another browser, open this page in Safari first, then follow the steps above.
                  </p>
                </>
              ) : (
                <>
                  <p>Use your browser menu to install:</p>
                  <ol className="list-decimal list-inside space-y-2 pl-1">
                    <li>Tap the <strong>menu</strong> (⋮ or ⋯) in the top-right.</li>
                    <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                  </ol>
                  <p className="text-gray-500 text-xs">
                    If you don&apos;t see that option, the browser may show it after you spend a little time on the site or visit again.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}

