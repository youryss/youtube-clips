import type { Meta, StoryObj } from "@storybook/react"
import { ProgressBar } from "@/components/ui/progress-bar"

const meta: Meta<typeof ProgressBar> = {
  title: "UI/ProgressBar",
  component: ProgressBar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "primary", "success", "warning", "error"],
    },
    value: {
      control: { type: "range", min: 0, max: 100, step: 1 },
    },
    showLabel: {
      control: "boolean",
    },
    showPercentage: {
      control: "boolean",
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 60,
  },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
}

export const WithLabel: Story = {
  args: {
    value: 75,
    label: "Downloading video...",
    showLabel: true,
  },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
}

export const WithPercentage: Story = {
  args: {
    value: 45,
    showPercentage: true,
  },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
}

export const WithLabelAndPercentage: Story = {
  args: {
    value: 80,
    label: "Processing...",
    showLabel: true,
    showPercentage: true,
  },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
}

export const Success: Story = {
  args: {
    value: 100,
    variant: "success",
    label: "Complete",
    showLabel: true,
    showPercentage: true,
  },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
}

export const Warning: Story = {
  args: {
    value: 50,
    variant: "warning",
    label: "Analyzing...",
    showLabel: true,
  },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
}

export const Error: Story = {
  args: {
    value: 30,
    variant: "error",
    label: "Failed",
    showLabel: true,
  },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
}

export const AllVariants: Story = {
  render: () => (
    <div className="w-[400px] space-y-6">
      <ProgressBar value={80} label="Primary" showLabel variant="primary" />
      <ProgressBar value={60} label="Success" showLabel variant="success" />
      <ProgressBar value={40} label="Warning" showLabel variant="warning" />
      <ProgressBar value={20} label="Error" showLabel variant="error" />
    </div>
  ),
}

