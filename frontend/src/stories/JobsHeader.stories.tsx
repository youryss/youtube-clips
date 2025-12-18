import type { Meta, StoryObj } from "@storybook/react"
import { JobsHeader } from "@/components/jobs/jobs-header"

const meta: Meta<typeof JobsHeader> = {
  title: "Jobs/JobsHeader",
  component: JobsHeader,
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const CustomTitle: Story = {
  args: {
    title: "Failed Jobs",
    description: "Jobs that require your attention",
    onRefresh: () => {},
  },
}


