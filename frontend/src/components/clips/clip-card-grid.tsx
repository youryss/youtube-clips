import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Download,
  Upload,
  Trash2,
  Video,
  Play,
  CheckCircle,
} from "lucide-react";
import type { Clip } from "@/types";
import { useThumbnail } from "@/hooks/use-thumbnail";

interface ClipCardGridProps {
  clip: Clip;
  uploadingId: number | null;
  onSelect: () => void;
  onDownload: () => void;
  onUpload: () => void;
  onDelete: () => void;
  formatDuration: (seconds?: number) => string;
  formatFileSize: (bytes?: number) => string;
}

export function ClipCardGrid({
  clip,
  uploadingId,
  onSelect,
  onDownload,
  onUpload,
  onDelete,
  formatDuration,
  formatFileSize,
}: ClipCardGridProps) {
  const { thumbnailUrl, isLoading } = useThumbnail(
    clip.id,
    clip.thumbnail_path
  );

  return (
    <Card className="overflow-hidden">
      <div
        className="group relative aspect-video cursor-pointer bg-muted"
        onClick={onSelect}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={clip.title || "Clip thumbnail"}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            {isLoading ? (
              <div className="size-12 animate-pulse rounded bg-muted-foreground/20" />
            ) : (
              <Video className="size-12 text-muted-foreground" />
            )}
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/30">
          <div className="flex size-16 items-center justify-center rounded-full bg-white/90 opacity-0 transition-opacity group-hover:opacity-100">
            <Play className="ml-1 size-8 text-foreground" />
          </div>
        </div>

        {clip.viral_score && (
          <div className="absolute right-2 top-2">
            <Badge className="bg-viral text-viral-foreground">
              {Math.round(clip.viral_score)}/10
            </Badge>
          </div>
        )}
        {clip.is_uploaded && (
          <div className="absolute left-2 top-2">
            <Badge className="gap-1 bg-success text-success-foreground">
              <CheckCircle className="size-3" />
              Uploaded
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="mb-2 line-clamp-2 min-h-[3rem] font-semibold text-foreground">
          {clip.title || clip.filename}
        </h3>

        <div className="mb-4 space-y-1 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Duration:</span>
            <span className="font-medium text-foreground">
              {formatDuration(clip.duration)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Size:</span>
            <span className="font-medium text-foreground">
              {formatFileSize(clip.file_size)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onDownload}
            variant="outline"
            size="sm"
            icon={<Download className="size-4" />}
            className="flex-1"
          >
            Download
          </Button>
          <Button
            onClick={onUpload}
            disabled={uploadingId === clip.id || clip.is_uploaded}
            variant="destructive"
            size="sm"
            icon={<Upload className="size-4" />}
            loading={uploadingId === clip.id}
            className="flex-1"
          >
            {clip.is_uploaded ? "Uploaded" : "Upload"}
          </Button>
          <Button
            onClick={onDelete}
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
