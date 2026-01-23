"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  // Update page title
  useEffect(() => {
    document.title = "Sign In | Hooligans";
  }, []);

  // Parse error code and return user-friendly message
  const getErrorMessage = (errorCode: string | null | undefined): string => {
    if (!errorCode) {
      return "Something went wrong. Please try again.";
    }

    // NextAuth error codes
    switch (errorCode) {
      case "CredentialsSignin":
        return "Invalid email or password. Please check your credentials and try again.";
      case "Configuration":
        return "Authentication service is misconfigured. Please contact support.";
      case "AccessDenied":
        return "Access denied. Your account may be restricted.";
      case "Verification":
        return "Verification failed. Please try again.";
      default:
        // Check for network/database errors in error message
        const errorLower = errorCode.toLowerCase();
        if (
          errorLower.includes("network") ||
          errorLower.includes("fetch") ||
          errorLower.includes("connection")
        ) {
          return "Connection error. Please check your internet connection and try again.";
        }
        if (
          errorLower.includes("database") ||
          errorLower.includes("too many clients") ||
          errorLower.includes("connection pool")
        ) {
          return "Service temporarily unavailable. Please try again in a moment.";
        }
        return "Invalid email or password. Please check your credentials and try again.";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Normalize email to lowercase
      const normalizedEmail = email.toLowerCase().trim();

      const result = await signIn("credentials", {
        email: normalizedEmail,
        password,
        redirect: false,
      });

      if (result?.error) {
        const errorMessage = getErrorMessage(result.error);
        console.error("Sign in error:", result.error);
        setError(errorMessage);

        // Reset retry count on explicit credential errors (don't retry)
        if (result.error === "CredentialsSignin") {
          setRetryCount(0);
        }
      } else if (result?.ok) {
        setRetryCount(0); // Reset on success
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);

      // Determine if this is a transient error that can be retried
      const isTransientError =
        error instanceof TypeError ||
        (error instanceof Error &&
          (error.message.includes("fetch") ||
            error.message.includes("network") ||
            error.message.includes("connection")));

      if (isTransientError && retryCount < 2) {
        setError("Connection error. Retrying...");
        setRetryCount((prev) => prev + 1);

        // Retry after a short delay
        setTimeout(() => {
          handleSubmit(e);
        }, 1000);
        return;
      }

      setError(getErrorMessage(null));
    }

    setIsLoading(false);
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <Link href="/" className="flex flex-col items-center mb-4 group">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-2 mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <Image
                src="/logo/Hooligans-Hero-Logo-2.png"
                alt="Hooligans Logo"
                width={48}
                height={48}
                className="w-full h-full object-contain"
              />
            </div>
            <Image
              src="/logo/Hooligans LS Logo 1.png"
              alt="Hooligans"
              width={120}
              height={20}
              className="h-5 w-auto object-contain brightness-0"
            />
          </Link>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <p className="text-gray-500 mt-2">Sign in to your Hooligans account</p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-12"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="sr-only">Toggle password visibility</span>
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link
                href="/auth/forgot-password"
                className="text-teal hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal hover:bg-teal-dark text-white h-12 font-semibold"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            className="w-full h-12 font-medium"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>

          <p className="text-center text-gray-600 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-teal font-semibold hover:underline">
              Sign up
            </Link>
          </p>

          <p className="text-center text-gray-500 mt-4 text-sm">
            <Link href="/menu" className="hover:underline">
              Continue as guest →
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-teal mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

