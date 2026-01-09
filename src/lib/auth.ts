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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          isAdmin: user.is_admin,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      try {
        if (account?.provider === "google") {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (!existingUser) {
            // Create new user for Google sign-in
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
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
          }
        }
        return true;
      } catch (error) {
        console.error("[NextAuth] SignIn error:", error);
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
        // Ensure session and user exist
        if (!session) {
          console.warn("[NextAuth] Session is null/undefined");
          return {
            user: {
              id: "",
              email: "",
              name: null,
              image: null,
              isAdmin: false,
            },
            expires: new Date().toISOString(),
          } as any;
        }

        // Ensure user object exists
        if (!session.user) {
          console.warn("[NextAuth] Session.user is null/undefined");
          session.user = {
            id: "",
            email: "",
            name: null,
            image: null,
            isAdmin: false,
          } as any;
        }

        // Safely assign token values
        if (token?.id) {
          session.user.id = String(token.id);
        } else {
          session.user.id = "";
        }

        if (typeof token?.isAdmin === "boolean") {
          session.user.isAdmin = token.isAdmin;
        } else {
          session.user.isAdmin = false;
        }

        return session;
      } catch (error) {
        console.error("[NextAuth] Session callback error:", error);
        // Return a minimal valid session to prevent 500
        return {
          user: {
            id: "",
            email: token?.email as string || "",
            name: token?.name as string || null,
            image: token?.picture as string || null,
            isAdmin: false,
          },
          expires: new Date().toISOString(),
        } as any;
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

