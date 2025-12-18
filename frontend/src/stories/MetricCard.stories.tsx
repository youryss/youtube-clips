import type { Meta, StoryObj } from "@storybook/react"
import { Film, Play, CheckCircle, ListTodo } from "lucide-react"
import { MetricCard } from "@/components/ui/metric-card"

const meta: Meta<typeof MetricCard> = {
  title: "UI/MetricCard",
  component: MetricCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    iconColor: {
      control: "select",
      options: ["primary", "success", "warning", "error", "info"],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: "Total Clips",
    value: 42,
    icon: <Film className="size-6" />,
    iconColor: "primary",
  },
}

export const WithChange: Story = {
  args: {
    title: "Revenue",
    value: "$12,450",
    icon: <Film className="size-6" />,
    iconColor: "success",
    change: {
      value: 12.5,
      label: "from last month",
    },
  },
}

export const NegativeChange: Story = {
  args: {
    title: "Failed Jobs",
    value: 3,
    icon: <Film className="size-6" />,
    iconColor: "error",
    change: {
      value: -25,
      label: "from last week",
    },
  },
}

export const WithDescription: Story = {
  args: {
    title: "Active Jobs",
    value: 5,
    icon: <Play className="size-6" />,
    iconColor: "warning",
    description: "Currently processing videos",
  },
}

export const Dashboard: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-[600px]">
      <MetricCard
        title="Total Clips"
        value={156}
        icon={<Film className="size-6" />}
        iconColor="primary"
      />
      <MetricCard
        title="Active Jobs"
        value={3}
        icon={<Play className="size-6" />}
        iconColor="warning"
      />
      <MetricCard
        title="Completed Jobs"
        value={48}
        icon={<CheckCircle className="size-6" />}
        iconColor="success"
      />
      <MetricCard
        title="Success Rate"
        value="94%"
        icon={<ListTodo className="size-6" />}
        iconColor="info"
      />
    </div>
  ),
}

