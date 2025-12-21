import {
  ChevronRight,
  ChevronDown,
  RefreshCw,
  X,
  Trash2,
  XCircle,
  Video,
} from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusIndicator } from "@/components/ui/status-indicator"
import { ProgressBar } from "@/components/ui/progress-bar"
import type { Job } from "@/types"

interface DashboardJobCardProps {
  job: Job
  expanded: boolean
  logs?: string
  onToggleLogs: () => void
  onRetry: () => void
  onCancel: () => void
  onDelete: () => void
}

export function DashboardJobCard({
  job,
  expanded,
  logs,
  onToggleLogs,
  onRetry,
  onCancel,
  onDelete,
}: DashboardJobCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-start gap-3">
              <div className="size-20 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                {job.thumbnail_url ? (
                  <img
                    src={job.thumbnail_url}
                    alt={job.video_title || "Video thumbnail"}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <Video className="size-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-foreground">
                  {job.video_title || job.video_url}
                </h3>
                <div className="mt-2 flex items-center gap-3">
                  <StatusIndicator status={job.status} />
                  <span className="text-sm text-muted-foreground">
                    {new Date(job.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {job.clips_created || 0} clips
                </p>
              </div>
            </div>

            {job.progress > 0 && job.status !== "completed" && (
              <div className="mt-4">
                <ProgressBar
                  value={job.progress}
                  variant={
                    job.status === "failed"
                      ? "error"
                      : ["downloading", "transcribing", "analyzing", "slicing"].includes(
                          job.status,
                        )
                      ? "primary"
                      : "warning"
                  }
                  label={job.current_step}
                  showLabel
                />
              </div>
            )}

            {job.error_message && (
              <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <div className="flex items-start gap-2">
                  <XCircle className="mt-0.5 size-5 flex-shrink-0 text-destructive" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-destructive">Error</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-destructive/80">
                      {job.error_message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {expanded && logs && (
              <div className="mt-4 rounded-lg border bg-muted p-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Job Details:
                </p>
                <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-foreground">
                  {logs}
                </pre>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <div className="flex w-full items-center justify-between">
          <Button
            onClick={onToggleLogs}
            variant="ghost"
            size="sm"
            icon={
              expanded ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )
            }
          >
            {expanded ? "Hide Details" : "View Details"}
          </Button>
          <div className="flex items-center gap-2">
            {job.status === "failed" && (
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                icon={<RefreshCw className="size-4" />}
              >
                Retry
              </Button>
            )}
            {["downloading", "transcribing", "analyzing", "slicing"].includes(job.status) && (
              <Button
                onClick={onCancel}
                variant="outline"
                size="sm"
                icon={<X className="size-4" />}
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={onDelete}
              variant="ghost"
              size="sm"
              icon={<Trash2 className="size-4" />}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              Delete
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}


