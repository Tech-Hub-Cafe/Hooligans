"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Update page title
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.title = "Forgot Password | Hooligans";
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError(
            data.error || "Too many requests. Please try again later."
          );
        } else {
          setError(data.error || "Failed to send reset email. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      // Success - show message
      setSuccess(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

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
            Reset Password
          </CardTitle>
          <p className="text-gray-600 mt-2 text-sm">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Check Your Email
              </h3>
              <p className="text-gray-600 mb-6">
                If an account with that email exists, we&apos;ve sent a password reset link to{" "}
                <span className="font-medium">{email}</span>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                The link will expire in 1 hour. If you don&apos;t see the email, check your spam folder.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Send Another Email
                </Button>
                <Button
                  onClick={() => router.push("/auth/login")}
                  className="w-full bg-teal hover:bg-teal-dark text-white"
                >
                  Back to Sign In
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div>
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email Address
                </Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="pl-10 h-12"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal hover:bg-teal-dark text-white h-12 font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
