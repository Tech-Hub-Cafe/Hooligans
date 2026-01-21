
import NextAuth from "next-auth";

// Validate AUTH_SECRET is set
if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
    console.warn("[NextAuth] Warning: AUTH_SECRET or NEXTAUTH_SECRET is not set. Authentication may not work correctly.");
}

export const { auth: middlewareAuth } = NextAuth({
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    trustHost: true,
    providers: [], // No providers needed for middleware
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id ? String(user.id) : "";
                token.isAdmin = (user as typeof user & { isAdmin: boolean })?.isAdmin || false;
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user) {
                session.user.id = token?.id ? String(token.id) : "";
                session.user.isAdmin = typeof token?.isAdmin === "boolean" ? token.isAdmin : false;
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/auth/login",
    },
});
