import type { Meta, StoryObj } from "@storybook/react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

const meta: Meta<typeof DashboardLayout> = {
  title: "Layout/DashboardLayout",
  component: DashboardLayout,
  parameters: {
    docs: {
      description: {
        story:
          "DashboardLayout is the main app shell and depends on auth context and routing. Use Storybook decorators to provide them if you want to render it.",
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Placeholder: Story = {
  render: () => (
    <div className="p-4 text-sm text-muted-foreground">
      DashboardLayout wraps the entire dashboard experience and is typically not rendered in isolation in Storybook.
    </div>
  ),
}


