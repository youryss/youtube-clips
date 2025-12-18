"use client";

import * as React from "react";
import { CheckCircle, Youtube } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { api } from "@/services/api";
import type { Clip } from "@/types";

interface ClipPlayerModalProps {
  clip: Clip | null;
  onClose: () => void;
}

export function ClipPlayerModal({ clip, onClose }: ClipPlayerModalProps) {
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!clip) return;

    const loadVideo = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const url = api.getDownloadUrl(clip.id);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load video");
        }

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        setVideoUrl(blobUrl);
      } catch (error) {
        console.error("Error loading video:", error);
      } finally {
        setLoading(false);
      }
    };

    loadVideo();

    return () => {
      if (videoUrl) {
        window.URL.revokeObjectURL(videoUrl);
      }
    };
  }, [clip]);

  if (!clip) return null;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <Dialog open={!!clip} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{clip.title || clip.filename}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Video Player */}
          <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
            {loading ? (
              <div className="flex size-full items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : videoUrl ? (
              <video
                controls
                className="size-full"
                src={videoUrl}
                onError={(e) => {
                  console.error("Video playback error:", e);
                }}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="flex size-full items-center justify-center text-white">
                <p>Failed to load video</p>
              </div>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-muted p-3">
              <p className="mb-1 text-xs text-muted-foreground">Duration</p>
              <p className="text-sm font-semibold">
                {formatDuration(clip.duration)}
              </p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="mb-1 text-xs text-muted-foreground">File Size</p>
              <p className="text-sm font-semibold">
                {formatFileSize(clip.file_size)}
              </p>
            </div>
            {clip.viral_score && (
              <div className="rounded-lg bg-muted p-3">
                <p className="mb-1 text-xs text-muted-foreground">
                  Viral Score
                </p>
                <Badge
                  variant="secondary"
                  className="mt-1 bg-viral text-viral-foreground"
                >
                  {Math.round(clip.viral_score)}/10
                </Badge>
              </div>
            )}
            {clip.criteria_matched && clip.criteria_matched.length > 0 && (
              <div className="rounded-lg bg-muted p-3">
                <p className="mb-1 text-xs text-muted-foreground">Criteria</p>
                <p className="text-sm font-semibold">
                  {clip.criteria_matched.length} matched
                </p>
              </div>
            )}
          </div>

          {/* AI Reasoning */}
          {clip.reasoning && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">
                AI Analysis & Reasoning
              </h3>
              <div className="rounded-lg border border-primary-200 bg-primary-50 p-4">
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {clip.reasoning}
                </p>
              </div>
            </div>
          )}

          {/* Criteria Matched */}
          {clip.criteria_matched && clip.criteria_matched.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Matched Criteria</h3>
              <div className="flex flex-wrap gap-2">
                {clip.criteria_matched.map((criterion, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="border-success bg-success-50 text-success"
                  >
                    {criterion
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          {(clip.start_time !== undefined || clip.end_time !== undefined) && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Video Timestamps</h3>
              <div className="text-sm text-muted-foreground">
                {clip.start_time !== undefined && (
                  <span>Start: {formatDuration(clip.start_time)}</span>
                )}
                {clip.start_time !== undefined &&
                  clip.end_time !== undefined && (
                    <span className="mx-2">•</span>
                  )}
                {clip.end_time !== undefined && (
                  <span>End: {formatDuration(clip.end_time)}</span>
                )}
              </div>
            </div>
          )}

          {/* YouTube Link */}
          {clip.youtube_url && (
            <div className="border-t pt-4">
              <a
                href={clip.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-medium text-destructive hover:text-destructive/80"
              >
                <Youtube className="size-5" />
                View on YouTube
              </a>
            </div>
          )}

          {/* Upload Status */}
          {clip.is_uploaded && (
            <div className="border-t pt-4">
              <Badge className="gap-1 bg-success text-success-foreground">
                <CheckCircle className="size-4" />
                Uploaded to YouTube
              </Badge>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
