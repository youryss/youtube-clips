import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export function useLogin() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setIsLoading(true);
      try {
        await login({ email, password });
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
              "Login failed. Please try again.";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, login]
  );

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    handleSubmit,
  };
}


