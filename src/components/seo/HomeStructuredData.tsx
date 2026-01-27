"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

async function fetchSettings() {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

export default function HomeStructuredData() {
  const { data: settings } = useQuery({
    queryKey: ["cafe-settings"],
    queryFn: fetchSettings,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!settings) return;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://hooligans.com.au";
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: settings.cafe_name || "Hooligans",
      description: settings.description || "Experience artisanal coffee and handcrafted cuisine in a warm, sophisticated atmosphere",
      ...(settings.address && {
        address: {
          "@type": "PostalAddress",
          streetAddress: settings.address,
        },
      }),
      ...(settings.phone && { telephone: settings.phone }),
      ...(settings.email && { email: settings.email }),
      url: baseUrl,
      priceRange: "$$",
      servesCuisine: "Coffee, Pastries, Sandwiches, Breakfast, Desserts",
      ...(settings.monday_hours && {
        openingHoursSpecification: [
          { "@type": "OpeningHoursSpecification", dayOfWeek: "Monday", opens: settings.monday_hours.split(" - ")[0] || "07:00", closes: settings.monday_hours.split(" - ")[1] || "20:00" },
          { "@type": "OpeningHoursSpecification", dayOfWeek: "Tuesday", opens: settings.tuesday_hours?.split(" - ")[0] || "07:00", closes: settings.tuesday_hours?.split(" - ")[1] || "20:00" },
          { "@type": "OpeningHoursSpecification", dayOfWeek: "Wednesday", opens: settings.wednesday_hours?.split(" - ")[0] || "07:00", closes: settings.wednesday_hours?.split(" - ")[1] || "20:00" },
          { "@type": "OpeningHoursSpecification", dayOfWeek: "Thursday", opens: settings.thursday_hours?.split(" - ")[0] || "07:00", closes: settings.thursday_hours?.split(" - ")[1] || "20:00" },
          { "@type": "OpeningHoursSpecification", dayOfWeek: "Friday", opens: settings.friday_hours?.split(" - ")[0] || "07:00", closes: settings.friday_hours?.split(" - ")[1] || "20:00" },
          { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: settings.saturday_hours?.split(" - ")[0] || "08:00", closes: settings.saturday_hours?.split(" - ")[1] || "21:00" },
          { "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: settings.sunday_hours?.split(" - ")[0] || "08:00", closes: settings.sunday_hours?.split(" - ")[1] || "21:00" },
        ],
      }),
      image: `${baseUrl}/logo/Hooligans-Hero-Logo-2.png`,
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [settings]);

  return null;
}
