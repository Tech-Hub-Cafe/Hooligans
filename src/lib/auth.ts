import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

interface User {
  id: number;
  email: string;
  password: string | null;
  name: string | null;
  phone: string | null;
  image: string | null;
  provider: string;
  is_admin: boolean;
}

// Validate AUTH_SECRET is set
if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
  console.warn("[NextAuth] Warning: AUTH_SECRET or NEXTAUTH_SECRET is not set. Authentication may not work correctly.");
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            if (process.env.NODE_ENV === "development") {
              console.log("[NextAuth] Missing credentials");
            }
            return null;
          }

          // Normalize email to lowercase for consistent lookup
          const email = (credentials.email as string).toLowerCase().trim();
          const password = credentials.password as string;

          if (process.env.NODE_ENV === "development") {
            console.log("[NextAuth] Attempting login for email:", email);
          }

          // Single optimized query with normalized email
          // All emails should be normalized by now
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              password: true,
              name: true,
              image: true,
              is_admin: true,
              provider: true,
            },
          });

          if (!user) {
            if (process.env.NODE_ENV === "development") {
              console.log("[NextAuth] User not found for email:", email);
            }
            return null;
          }

          if (process.env.NODE_ENV === "development") {
            console.log("[NextAuth] User found:", {
              id: user.id,
              email: user.email,
              hasPassword: !!user.password,
              provider: user.provider,
            });
          }

          if (!user.password) {
            if (process.env.NODE_ENV === "development") {
              console.log("[NextAuth] User has no password (OAuth user):", email);
            }
            return null;
          }

          const passwordMatch = await bcrypt.compare(password, user.password);

          if (!passwordMatch) {
            if (process.env.NODE_ENV === "development") {
              console.log("[NextAuth] Password mismatch for email:", email);
            }
            return null;
          }

          if (process.env.NODE_ENV === "development") {
            console.log("[NextAuth] Login successful for email:", email);
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
            isAdmin: user.is_admin,
          };
        } catch (error) {
          console.error("[NextAuth] Authorize error:", error);
          if (error instanceof Error) {
            console.error("[NextAuth] Error message:", error.message);
            if (process.env.NODE_ENV === "development") {
              console.error("[NextAuth] Error stack:", error.stack);
            }
            // Re-throw database connection errors so they can be caught by the route handler
            if (error.message.includes("DATABASE_URL") || 
                error.message.includes("connection") ||
                error.message.includes("connect ECONNREFUSED") ||
                error.message.includes("P1001")) {
              throw error;
            }
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      try {
        if (account?.provider === "google") {
          // Normalize email to lowercase for consistent storage and lookup
          const normalizedEmail = user.email?.toLowerCase().trim();
          
          if (!normalizedEmail) {
            console.error("[NextAuth] Google OAuth user missing email");
            return false;
          }

          // Check if user exists (using normalized email)
          const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });

          if (!existingUser) {
            // Create new user for Google sign-in with normalized email
            const newUser = await prisma.user.create({
              data: {
                email: normalizedEmail,
                name: user.name,
                image: user.image,
                provider: "google",
                is_admin: false,
              },
            });
            user.id = newUser.id.toString();
            (user as typeof user & { isAdmin: boolean }).isAdmin = false;
          } else {
            user.id = existingUser.id.toString();
            (user as typeof user & { isAdmin: boolean }).isAdmin = existingUser.is_admin;
            
            // Update user info if it changed (e.g., profile picture updated)
            if (user.name !== existingUser.name || user.image !== existingUser.image) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  name: user.name || existingUser.name,
                  image: user.image || existingUser.image,
                },
              });
            }
          }
        }
        return true;
      } catch (error) {
        console.error("[NextAuth] SignIn error:", error);
        if (error instanceof Error) {
          console.error("[NextAuth] SignIn error message:", error.message);
        }
        return false;
      }
    },
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id ? String(user.id) : "";
          token.isAdmin = (user as typeof user & { isAdmin: boolean })?.isAdmin || false;
        }
        // Ensure token always has required fields
        if (!token.id) {
          token.id = "";
        }
        if (typeof token.isAdmin !== "boolean") {
          token.isAdmin = false;
        }
        return token;
      } catch (error) {
        console.error("[NextAuth] JWT callback error:", error);
        // Return token with safe defaults
        return {
          ...token,
          id: token?.id || "",
          isAdmin: token?.isAdmin || false,
        };
      }
    },
    async session({ session, token }) {
      try {
        // Session and user should always exist from NextAuth, but add minimal safety check
        if (!session?.user) {
          console.error("[NextAuth] Session or user is missing");
          // Return a minimal valid session instead of throwing
          return {
            ...session,
            user: {
              ...session?.user,
              id: "",
              isAdmin: false,
            },
          };
        }

        // Assign token values to session
        session.user.id = token?.id ? String(token.id) : "";
        session.user.isAdmin = typeof token?.isAdmin === "boolean" ? token.isAdmin : false;

        return session;
      } catch (error) {
        console.error("[NextAuth] Session callback error:", error);
        // Return a safe fallback session instead of throwing
        return {
          ...session,
          user: {
            ...session?.user,
            id: "",
            isAdmin: false,
          },
        };
      }
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
});

