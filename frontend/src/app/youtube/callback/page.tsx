"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { api } from "@/services/api"
import { ProtectedRoute } from "@/components/protected-route"

function YouTubeCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = React.useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = React.useState("")

  React.useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code")
      const state = searchParams.get("state")
      const error = searchParams.get("error")

      if (error) {
        setStatus("error")
        setMessage(error === "access_denied" ? "Authorization was cancelled" : `Error: ${error}`)
        return
      }

      if (!code || !state) {
        setStatus("error")
        setMessage("Invalid callback parameters")
        return
      }

      try {
        const redirectUri = `${window.location.origin}/youtube/callback`
        const response = await api.handleYouTubeCallback(code, state, redirectUri)
        setStatus("success")
        setMessage(`Successfully connected: ${response.account.channel_title || "YouTube Account"}`)
        toast.success("YouTube account connected successfully!")
      } catch (error: unknown) {
        const errorMessage =
          (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          "Failed to connect YouTube account"
        setStatus("error")
        setMessage(errorMessage)
        toast.error(errorMessage)
      }
    }

    handleCallback()
  }, [searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center p-8 text-center">
          {status === "loading" && (
            <>
              <LoadingSpinner size="lg" />
              <h2 className="mt-4 text-lg font-semibold">Connecting YouTube Account</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Please wait while we complete the authorization...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="flex size-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle className="size-8 text-success" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-success">Success!</h2>
              <p className="mt-2 text-sm text-muted-foreground">{message}</p>
              <Button onClick={() => router.push("/settings")} className="mt-6">
                Go to Settings
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="size-8 text-destructive" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-destructive">Connection Failed</h2>
              <p className="mt-2 text-sm text-muted-foreground">{message}</p>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => router.push("/settings")}>
                  Back to Settings
                </Button>
                <Button onClick={() => router.push("/settings")}>Try Again</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function YouTubeCallbackPage() {
  return (
    <ProtectedRoute>
      <React.Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        <YouTubeCallbackContent />
      </React.Suspense>
    </ProtectedRoute>
  )
}

