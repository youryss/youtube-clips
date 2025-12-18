import type { Meta, StoryObj } from "@storybook/react";
import { ClipPlayerModal } from "@/components/clip-player-modal";
import type { Clip } from "@/types";

const sampleClip: Clip = {
  id: 1,
  job_id: 1,
  filename: "sample.mp4",
  file_path: "/clips/sample.mp4",
  title: "Sample Viral Clip",
  duration: 42,
  start_time: 10,
  end_time: 52,
  viral_score: 8.5,
  criteria_matched: ["emotional_peaks", "viral_hooks"],
  reasoning:
    "High emotional engagement and strong hook in the first 5 seconds.",
  file_size: 10 * 1024 * 1024,
  is_uploaded: false,
  created_at: new Date().toISOString(),
};

const meta: Meta<typeof ClipPlayerModal> = {
  title: "Clips/ClipPlayerModal",
  component: ClipPlayerModal,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    clip: sampleClip,
    onClose: () => {},
  },
};
