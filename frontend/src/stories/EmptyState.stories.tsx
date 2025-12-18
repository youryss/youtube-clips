import type { Meta, StoryObj } from "@storybook/react"
import { Film, ListTodo, Search, Upload } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"

const meta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    icon: <ListTodo className="size-8" />,
    title: "No jobs yet",
    description: "Create your first job by pasting a YouTube URL above",
  },
}

export const WithAction: Story = {
  args: {
    icon: <Film className="size-8" />,
    title: "No clips found",
    description: "Process a video to generate viral clips",
    action: <Button>Process Video</Button>,
  },
}

export const SearchEmpty: Story = {
  args: {
    icon: <Search className="size-8" />,
    title: "No results found",
    description: "Try adjusting your search or filter to find what you're looking for",
    action: <Button variant="outline">Clear filters</Button>,
  },
}

export const UploadEmpty: Story = {
  args: {
    icon: <Upload className="size-8" />,
    title: "No files uploaded",
    description: "Drag and drop files here, or click to browse",
    action: (
      <Button>
        <Upload className="size-4 mr-2" />
        Upload Files
      </Button>
    ),
  },
}

export const MinimalEmpty: Story = {
  args: {
    title: "Nothing here yet",
    description: "Content will appear here when available",
  },
}

