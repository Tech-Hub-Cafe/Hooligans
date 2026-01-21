"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextAuthSessionProvider
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={false} // Disable refetch on window focus to reduce load
      basePath="/api/auth"
    >
      {children}
    </NextAuthSessionProvider>
  );
}

