import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Hooligans. Visit us, call us, or send us a message. We'd love to hear from you! Find our location, hours, phone, and email.",
  openGraph: {
    title: "Contact Us | Hooligans",
    description: "Get in touch with Hooligans. Visit us, call us, or send us a message. Find our location, hours, phone, and email.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Contact Us | Hooligans",
    description: "Get in touch with Hooligans. Visit us, call us, or send us a message.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
