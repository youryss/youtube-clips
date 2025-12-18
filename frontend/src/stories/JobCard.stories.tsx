import type { Meta, StoryObj } from "@storybook/react";
import { JobCard } from "@/components/jobs/job-card";
import type { Job } from "@/types";

const baseJob: Job = {
  id: 1,
  video_url: "https://youtube.com/watch?v=job",
  video_title: "Job Video",
  video_duration: 800,
  status: "transcribing",
  progress: 30,
  current_step: "Transcribing audio",
  clips_created: 0,
  created_at: new Date().toISOString(),
};

const meta: Meta<typeof JobCard> = {
  title: "Jobs/JobCard",
  component: JobCard,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const InProgress: Story = {
  args: {
    job: baseJob,
    isExpanded: false,
    logs: "",
    onToggleLogs: () => {},
    onRetry: () => {},
    onCancel: () => {},
    onDelete: () => {},
  },
};

export const WithLogsExpanded: Story = {
  args: {
    ...InProgress.args,
    isExpanded: true,
    logs: "Step 1: Downloading video...\nStep 2: Transcribing audio...",
  },
};
