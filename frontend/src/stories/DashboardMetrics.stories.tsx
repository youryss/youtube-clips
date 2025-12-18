import type { Meta, StoryObj } from "@storybook/react";
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics";

const meta: Meta<typeof DashboardMetrics> = {
  title: "Dashboard/DashboardMetrics",
  component: DashboardMetrics,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    totalClips: 128,
    activeJobs: 3,
    completedJobs: 42,
    successRate: 92,
  },
};
