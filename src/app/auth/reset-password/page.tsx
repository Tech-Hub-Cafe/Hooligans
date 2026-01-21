"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Loader2, ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react";
import Image from "next/image";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Update page title
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.title = "Reset Password | Hooligans";
    }
  }, []);

  // Check if token is present
  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError(
            data.error || "Too many attempts. Please try again later."
          );
        } else {
          setError(data.error || "Failed to reset password. The link may have expired.");
        }
        setIsLoading(false);
        return;
      }

      // Success
      setSuccess(true);
      setIsLoading(false);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Password Reset Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <Button
              onClick={() => router.push("/auth/login")}
              className="w-full bg-teal hover:bg-teal-dark text-white"
            >
              Go to Sign In
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              Redirecting to sign in page...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <Link href="/" className="flex flex-col items-center mb-4 group">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-2 mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <Image
                src="/logo/Hooligans-Hero-Logo-2.png"
                alt="Hooligans Logo"
                width={48}
                height={48}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <Image
              src="/logo/Hooligans LS Logo 1.png"
              alt="Hooligans"
              width={120}
              height={20}
              className="h-5 w-auto object-contain brightness-0"
              priority
            />
          </Link>
          <CardTitle className="text-2xl font-bold text-gray-900 mt-4">
            Create New Password
          </CardTitle>
          <p className="text-gray-600 mt-2 text-sm">
            Enter your new password below.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <Label htmlFor="password" className="text-gray-700 font-medium">
                New Password
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="pl-10 pr-10 h-12"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="sr-only">Toggle password visibility</span>
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 8 characters with uppercase, lowercase, and a number
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                Confirm Password
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="pl-10 pr-10 h-12"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="sr-only">Toggle password visibility</span>
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !token}
              className="w-full bg-teal hover:bg-teal-dark text-white h-12 font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center text-sm text-gray-600 hover:text-teal transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Sign In
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
