"use client";

import { useEffect } from "react";

interface LocalBusinessData {
  name: string;
  description?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  telephone?: string;
  email?: string;
  url?: string;
  priceRange?: string;
  servesCuisine?: string;
  openingHours?: string[];
  image?: string;
}

interface StructuredDataProps {
  type: "LocalBusiness" | "Organization";
  data: LocalBusinessData;
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": type,
      name: data.name,
      ...(data.description && { description: data.description }),
      ...(data.address && {
        address: {
          "@type": "PostalAddress",
          ...(data.address.streetAddress && { streetAddress: data.address.streetAddress }),
          ...(data.address.addressLocality && { addressLocality: data.address.addressLocality }),
          ...(data.address.addressRegion && { addressRegion: data.address.addressRegion }),
          ...(data.address.postalCode && { postalCode: data.address.postalCode }),
          ...(data.address.addressCountry && { addressCountry: data.address.addressCountry }),
        },
      }),
      ...(data.telephone && { telephone: data.telephone }),
      ...(data.email && { email: data.email }),
      ...(data.url && { url: data.url }),
      ...(data.priceRange && { priceRange: data.priceRange }),
      ...(data.servesCuisine && { servesCuisine: data.servesCuisine }),
      ...(data.openingHours && { openingHoursSpecification: data.openingHours.map((hours) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: hours.split(":")[0],
        opens: hours.split(":")[1]?.split("-")[0],
        closes: hours.split(":")[1]?.split("-")[1],
      })) }),
      ...(data.image && { image: data.image }),
    };

    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [type, data]);

  return null;
}
