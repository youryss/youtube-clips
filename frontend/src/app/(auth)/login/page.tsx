"use client";

import * as React from "react";
import { useLogin } from "@/hooks/use-login";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    handleSubmit,
  } = useLogin();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <LoginForm
          email={email}
          password={password}
          isLoading={isLoading}
          error={error}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
