import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu",
  description: "Browse our delicious menu featuring artisan coffee, fresh pastries, sandwiches, breakfast items, desserts, and more. Order online for pickup or delivery.",
  openGraph: {
    title: "Menu | Hooligans",
    description: "Browse our delicious menu featuring artisan coffee, fresh pastries, sandwiches, breakfast items, desserts, and more.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Menu | Hooligans",
    description: "Browse our delicious menu featuring artisan coffee, fresh pastries, sandwiches, breakfast items, desserts, and more.",
  },
};

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
