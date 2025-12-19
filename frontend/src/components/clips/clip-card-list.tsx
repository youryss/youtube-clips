import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Upload, Trash2, Video, CheckCircle } from "lucide-react";
import type { Clip } from "@/types";
import { useThumbnail } from "@/hooks/use-thumbnail";

type ClipCardListProps = {
  clip: Clip;
  uploadingId: number | null;
  onSelect: () => void;
  onDownload: () => void;
  onUpload: () => void;
  onDelete: () => void;
  formatDuration: (seconds?: number) => string;
  formatFileSize: (bytes?: number) => string;
};

export function ClipCardList({
  clip,
  uploadingId,
  onSelect,
  onDownload,
  onUpload,
  onDelete,
  formatDuration,
  formatFileSize,
}: ClipCardListProps) {
  const { thumbnailUrl, isLoading } = useThumbnail(
    clip.id,
    clip.thumbnail_path
  );

  return (
    <Card>
      <CardContent className="flex gap-4 p-4">
        <div
          className="group relative h-20 w-32 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg bg-muted"
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
                <div className="size-8 animate-pulse rounded bg-muted-foreground/20" />
              ) : (
                <Video className="size-8 text-muted-foreground" />
              )}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-4">
            <h3 className="truncate font-semibold text-foreground">
              {clip.title || clip.filename}
            </h3>
            <div className="flex flex-shrink-0 items-center gap-2">
              {clip.viral_score && (
                <Badge className="bg-viral text-viral-foreground">
                  {Math.round(clip.viral_score)}%
                </Badge>
              )}
              {clip.is_uploaded && (
                <Badge className="gap-1 bg-success text-success-foreground">
                  <CheckCircle className="size-3" />
                  Uploaded
                </Badge>
              )}
            </div>
          </div>

          <div className="mb-3 flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              Duration:{" "}
              <span className="font-medium text-foreground">
                {formatDuration(clip.duration)}
              </span>
            </span>
            <span>
              Size:{" "}
              <span className="font-medium text-foreground">
                {formatFileSize(clip.file_size)}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={onDownload}
              variant="outline"
              size="sm"
              icon={<Download className="size-4" />}
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
        </div>
      </CardContent>
    </Card>
  );
}
