import * as React from "react";

import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
  Video,
  X,
} from "lucide-react";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { Job } from "@/types";

interface JobCardProps {
  job: Job;
  isExpanded: boolean;
  logs?: string;
  onToggleLogs: () => void;
  onRetry: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function JobCard({
  job,
  isExpanded,
  logs,
  onToggleLogs,
  onRetry,
  onCancel,
  onDelete,
}: JobCardProps) {
  const isProcessing = [
    "downloading",
    "transcribing",
    "analyzing",
    "slicing",
  ].includes(job.status);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
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
            <h3 className="mb-2 truncate font-semibold text-foreground">
              {job.video_title || job.video_url}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <StatusIndicator status={job.status} />
              <Badge variant="secondary">{job.clips_created || 0} clips</Badge>
              <span className="text-sm text-muted-foreground">
                {new Date(job.created_at).toLocaleString()}
              </span>
            </div>

            {job.progress > 0 && job.status !== "completed" && (
              <div className="mt-3">
                <ProgressBar
                  value={job.progress}
                  variant={job.status === "failed" ? "error" : "primary"}
                  label={job.current_step}
                  showLabel
                />
              </div>
            )}

            {isExpanded && logs && (
              <div className="mt-3 rounded-lg border bg-muted p-3">
                <pre className="max-h-32 overflow-auto whitespace-pre-wrap break-words font-mono text-xs">
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
              isExpanded ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )
            }
          >
            {isExpanded ? "Hide" : "Details"}
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
            {isProcessing && (
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
            />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
