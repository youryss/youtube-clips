import type { Meta, StoryObj } from "@storybook/react"
import { DashboardJobCard } from "@/components/dashboard/dashboard-job-card"
import type { Job } from "@/types"

const baseJob: Job = {
  id: 1,
  video_url: "https://youtube.com/watch?v=example",
  video_title: "Example Video",
  video_duration: 600,
  status: "analyzing",
  progress: 45,
  current_step: "Analyzing transcript",
  clips_created: 3,
  created_at: new Date().toISOString(),
  thumbnail_url: "https://placehold.co/320x180",
  has_thumbnail: true,
}

const meta: Meta<typeof DashboardJobCard> = {
  title: "Dashboard/DashboardJobCard",
  component: DashboardJobCard,
}

export default meta
type Story = StoryObj<typeof meta>

export const InProgress: Story = {
  args: {
    job: baseJob,
    expanded: false,
    logs: "",
    onToggleLogs: () => {},
    onRetry: () => {},
    onCancel: () => {},
    onDelete: () => {},
  },
}

export const FailedWithError: Story = {
  args: {
    ...InProgress.args,
    job: {
      ...baseJob,
      status: "failed",
      progress: 80,
      error_message: "Transcription failed due to network error.",
    },
    expanded: true,
    logs: "Error: Network timeout while contacting transcription service.",
  },
}


