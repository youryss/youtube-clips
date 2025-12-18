import type { Meta, StoryObj } from "@storybook/react"
import { Sidebar } from "@/components/layout/sidebar"

const meta: Meta<typeof Sidebar> = {
  title: "Layout/Sidebar",
  component: Sidebar,
  parameters: {
    docs: {
      description: {
        story:
          "Sidebar relies on auth context and Next.js navigation. For full rendering, wrap it with the appropriate providers in Storybook.",
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Placeholder: Story = {
  render: () => (
    <div className="p-4 text-sm text-muted-foreground">
      Sidebar is tied to the dashboard shell and is not rendered directly here. Add app providers/decorators to use it in Storybook.
    </div>
  ),
}


