import type { Meta, StoryObj } from "@storybook/react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

const meta: Meta<typeof DashboardHeader> = {
  title: "Dashboard/DashboardHeader",
  component: DashboardHeader,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
