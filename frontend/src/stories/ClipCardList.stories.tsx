import type { Meta, StoryObj } from "@storybook/react";
import { ClipCardList } from "@/components/clips/clip-card-list";
import type { Clip } from "@/types";

const sampleClip: Clip = {
  id: 2,
  job_id: 1,
  filename: "clip-list.mp4",
  file_path: "/clips/clip-list.mp4",
  title: "List Clip",
  duration: 45,
  viral_score: 7.8,
  file_size: 12 * 1024 * 1024,
  is_uploaded: true,
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

const meta: Meta<typeof ClipCardList> = {
  title: "Clips/ClipCardList",
  component: ClipCardList,
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
