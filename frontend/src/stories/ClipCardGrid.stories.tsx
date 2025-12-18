import type { Meta, StoryObj } from "@storybook/react";
import { ClipCardGrid } from "@/components/clips/clip-card-grid";
import type { Clip } from "@/types";

const sampleClip: Clip = {
  id: 1,
  job_id: 1,
  filename: "clip-grid.mp4",
  file_path: "/clips/clip-grid.mp4",
  title: "Grid Clip",
  duration: 30,
  viral_score: 9.2,
  file_size: 8 * 1024 * 1024,
  is_uploaded: false,
  created_at: new Date().toISOString(),
};

const formatDuration = (seconds?: number) =>
  seconds != null
    ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(
        2,
        "0"
      )}`
    : "N/A";

const formatFileSize = (bytes?: number) =>
  bytes != null ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` : "N/A";

const meta: Meta<typeof ClipCardGrid> = {
  title: "Clips/ClipCardGrid",
  component: ClipCardGrid,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    clip: sampleClip,
    uploadingId: null,
    onSelect: () => {},
    onDownload: () => {},
    onUpload: () => {},
    onDelete: () => {},
    formatDuration,
    formatFileSize,
  },
};
