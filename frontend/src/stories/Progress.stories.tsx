import type { Meta, StoryObj } from "@storybook/react"
import { Progress } from "@/components/ui/progress"

const meta: Meta<typeof Progress> = {
  title: "UI/Progress",
  component: Progress,
  parameters: {
    layout: "centered",
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Half: Story = {
  args: {
    value: 50,
  },
}

export const Complete: Story = {
  args: {
    value: 100,
  },
}


