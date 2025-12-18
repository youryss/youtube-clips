import type { Meta, StoryObj } from "@storybook/react"
import { Search, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "url"],
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
    placeholder: "Enter text...",
  },
}

export const WithLabel: Story = {
  args: {
    label: "Email",
    placeholder: "Enter your email",
    type: "email",
  },
}

export const WithLeftIcon: Story = {
  args: {
    placeholder: "Search...",
    leftIcon: <Search className="size-4" />,
  },
}

export const WithRightIcon: Story = {
  args: {
    placeholder: "Enter password",
    type: "password",
    rightIcon: <Eye className="size-4" />,
  },
}

export const WithBothIcons: Story = {
  args: {
    placeholder: "Enter email",
    leftIcon: <Mail className="size-4" />,
    rightIcon: <Lock className="size-4" />,
  },
}

export const WithError: Story = {
  args: {
    label: "Email",
    placeholder: "Enter your email",
    error: "Please enter a valid email address",
    defaultValue: "invalid-email",
  },
}

export const WithHelperText: Story = {
  args: {
    label: "Username",
    placeholder: "Enter username",
    helperText: "Username must be 3-20 characters long",
  },
}

export const Disabled: Story = {
  args: {
    label: "Disabled Input",
    placeholder: "You cannot edit this",
    disabled: true,
  },
}

export const Password: Story = {
  render: () => {
    return (
      <div className="w-[300px]">
        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          leftIcon={<Lock className="size-4" />}
        />
      </div>
    )
  },
}

export const SearchInput: Story = {
  render: () => (
    <div className="w-[300px]">
      <Input
        placeholder="Search Dashboard..."
        leftIcon={<Search className="size-4" />}
        className="bg-muted"
      />
    </div>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="w-[350px] space-y-4">
      <Input placeholder="Default input" />
      <Input label="With Label" placeholder="Labeled input" />
      <Input
        label="With Left Icon"
        placeholder="Search..."
        leftIcon={<Search className="size-4" />}
      />
      <Input
        label="With Error"
        placeholder="Email"
        error="Invalid email format"
        defaultValue="bad-email"
      />
      <Input
        label="With Helper"
        placeholder="Username"
        helperText="3-20 characters"
      />
      <Input label="Disabled" placeholder="Cannot edit" disabled />
    </div>
  ),
}

