import { middlewareAuth } from "@/lib/auth-edge";

// Wrap middleware in try-catch to prevent crashes
export default middlewareAuth(async (req) => {
    try {
        // Middleware logic to update session expiry
        // You can also add protected routes here if needed
        // e.g. if (!req.auth && req.nextUrl.pathname.startsWith('/admin')) ...
        
        // NextAuth middleware handles session automatically
        // No need to return anything - just let it proceed
    } catch (error) {
        // Log error but don't crash - allow request to proceed
        if (process.env.NODE_ENV === "development") {
            console.error("[Middleware] Error:", error);
        }
    }
});

export const config = {
    // Exclude static files, API routes, and Next.js internals
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - logo/ (logo directory)
         * - icons/ (icons directory)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|logo/|icons/).*)",
    ],
};
