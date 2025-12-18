import type { Meta, StoryObj } from "@storybook/react"
import { Mail, Plus, Trash2, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link", "success", "warning"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon", "icon-sm", "icon-lg"],
    },
    loading: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: "Button",
  },
}

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Delete",
  },
}

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline",
  },
}

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary",
  },
}

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Ghost",
  },
}

export const Link: Story = {
  args: {
    variant: "link",
    children: "Link Button",
  },
}

export const Success: Story = {
  args: {
    variant: "success",
    children: "Success",
  },
}

export const Warning: Story = {
  args: {
    variant: "warning",
    children: "Warning",
  },
}

export const Small: Story = {
  args: {
    size: "sm",
    children: "Small",
  },
}

export const Large: Story = {
  args: {
    size: "lg",
    children: "Large",
  },
}

export const WithIconLeft: Story = {
  args: {
    children: "Send Email",
    icon: <Mail className="size-4" />,
  },
}

export const WithIconRight: Story = {
  args: {
    children: "Settings",
    icon: <Settings className="size-4" />,
    iconPosition: "right",
  },
}

export const IconOnly: Story = {
  args: {
    size: "icon",
    children: <Plus className="size-4" />,
  },
}

export const Loading: Story = {
  args: {
    loading: true,
    children: "Processing...",
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Disabled",
  },
}

export const DestructiveWithIcon: Story = {
  args: {
    variant: "destructive",
    children: "Delete Item",
    icon: <Trash2 className="size-4" />,
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="success">Success</Button>
      <Button variant="warning">Warning</Button>
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <Plus className="size-4" />
      </Button>
    </div>
  ),
}

