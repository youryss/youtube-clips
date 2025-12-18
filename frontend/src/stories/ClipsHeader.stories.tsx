import type { Meta, StoryObj } from "@storybook/react"
import { ClipsHeader } from "@/components/clips/clips-header"

const meta: Meta<typeof ClipsHeader> = {
  title: "Clips/ClipsHeader",
  component: ClipsHeader,
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onRefresh: () => {},
  },
}


