import type { Meta, StoryObj } from "@storybook/react"
import { StatusIndicator } from "@/components/ui/status-indicator"

const meta: Meta<typeof StatusIndicator> = {
  title: "UI/StatusIndicator",
  component: StatusIndicator,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: "select",
      options: [
        "pending",
        "downloading",
        "transcribing",
        "analyzing",
        "slicing",
        "completed",
        "failed",
        "cancelled",
      ],
    },
    showDot: {
      control: "boolean",
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Pending: Story = {
  args: {
    status: "pending",
  },
}

export const Downloading: Story = {
  args: {
    status: "downloading",
  },
}

export const Transcribing: Story = {
  args: {
    status: "transcribing",
  },
}

export const Analyzing: Story = {
  args: {
    status: "analyzing",
  },
}

export const Slicing: Story = {
  args: {
    status: "slicing",
  },
}

export const Completed: Story = {
  args: {
    status: "completed",
  },
}

export const Failed: Story = {
  args: {
    status: "failed",
  },
}

export const Cancelled: Story = {
  args: {
    status: "cancelled",
  },
}

export const WithoutDot: Story = {
  args: {
    status: "completed",
    showDot: false,
  },
}

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <StatusIndicator status="pending" />
      <StatusIndicator status="downloading" />
      <StatusIndicator status="transcribing" />
      <StatusIndicator status="analyzing" />
      <StatusIndicator status="slicing" />
      <StatusIndicator status="completed" />
      <StatusIndicator status="failed" />
      <StatusIndicator status="cancelled" />
    </div>
  ),
}

