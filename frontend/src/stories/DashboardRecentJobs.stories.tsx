import type { Meta, StoryObj } from "@storybook/react"
import { DashboardRecentJobs } from "@/components/dashboard/dashboard-recent-jobs"
import type { Job } from "@/types"

const jobs: Job[] = [
  {
    id: 1,
    video_url: "https://youtube.com/watch?v=job1",
    video_title: "First Video",
    video_duration: 500,
    status: "completed",
    progress: 100,
    current_step: "Done",
    clips_created: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    video_url: "https://youtube.com/watch?v=job2",
    video_title: "Second Video",
    video_duration: 700,
    status: "downloading",
    progress: 20,
    current_step: "Downloading video",
    clips_created: 0,
    created_at: new Date().toISOString(),
  },
]

const meta: Meta<typeof DashboardRecentJobs> = {
  title: "Dashboard/DashboardRecentJobs",
  component: DashboardRecentJobs,
}

export default meta
type Story = StoryObj<typeof meta>

export const WithJobs: Story = {
  args: {
    jobs,
    isLoadingJobs: false,
    expandedJobId: null,
    jobLogs: {},
    onViewLogs: () => {},
    onRetryJob: () => {},
    onCancelJob: () => {},
    onDeleteJob: () => {},
    onViewAll: () => {},
  },
}

export const Loading: Story = {
  args: {
    ...WithJobs.args,
    jobs: [],
    isLoadingJobs: true,
  },
}

export const Empty: Story = {
  args: {
    ...WithJobs.args,
    jobs: [],
    isLoadingJobs: false,
  },
}


