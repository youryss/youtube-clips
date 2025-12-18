import type { Meta, StoryObj } from "@storybook/react"
import { ClipsFilters } from "@/components/clips/clips-filters"

const meta: Meta<typeof ClipsFilters> = {
  title: "Clips/ClipsFilters",
  component: ClipsFilters,
}

export default meta
type Story = StoryObj<typeof meta>

export const GridView: Story = {
  args: {
    searchQuery: "",
    viewMode: "grid",
    onSearchChange: () => {},
    onViewModeChange: () => {},
  },
}

export const ListViewWithSearch: Story = {
  args: {
    searchQuery: "funny",
    viewMode: "list",
    onSearchChange: () => {},
    onViewModeChange: () => {},
  },
}


