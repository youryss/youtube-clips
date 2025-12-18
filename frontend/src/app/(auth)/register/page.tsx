"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Film } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";

export default function RegisterPage() {
  const [email, setEmail] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const { register, isAuthenticated } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      await register({ email, username, password });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { error?: string } } })?.response
              ?.data?.error || "Registration failed. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="p-8">
            {/* Logo and Title */}
            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex size-16 items-center justify-center rounded-2xl bg-primary">
                <Film className="size-8 text-primary-foreground" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">
                Create your account
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Start creating viral clips today
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Form */}
            <form className="space-y-5" onSubmit={handleSubmit}>
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />

              <Input
                label="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                autoComplete="new-password"
                helperText="Must be at least 6 characters"
              />

              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
              />

              <Button
                type="submit"
                disabled={isLoading}
                loading={isLoading}
                size="lg"
                className="w-full"
              >
                Create account
              </Button>
            </form>

            {/* Sign in link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:text-primary/80"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
