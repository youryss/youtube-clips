import type { Meta, StoryObj } from "@storybook/react"
import { DashboardCreateJobCard } from "@/components/dashboard/dashboard-create-job-card"

const meta: Meta<typeof DashboardCreateJobCard> = {
  title: "Dashboard/DashboardCreateJobCard",
  component: DashboardCreateJobCard,
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    videoUrl: "",
    isSubmitting: false,
    onVideoUrlChange: () => {},
    onSubmit: (e: React.FormEvent) => e.preventDefault(),
  },
}

export const Submitting: Story = {
  args: {
    ...Default.args,
    isSubmitting: true,
  },
}


