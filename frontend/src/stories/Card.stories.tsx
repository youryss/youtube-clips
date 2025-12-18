import type { Meta, StoryObj } from "@storybook/react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content with some example text.</p>
      </CardContent>
    </Card>
  ),
}

export const WithFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Create Project</CardTitle>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
      </CardHeader>
      <CardContent>
        <Input label="Project Name" placeholder="Enter project name" />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Deploy</Button>
      </CardFooter>
    </Card>
  ),
}

export const Simple: Story = {
  render: () => (
    <Card className="w-[350px] p-6">
      <p>A simple card with just content and padding.</p>
    </Card>
  ),
}

export const Notification: Story = {
  render: () => (
    <Card className="w-[380px]">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>You have 3 unread messages.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4 rounded-lg border p-4">
          <div className="size-2 rounded-full bg-primary mt-2" />
          <div className="flex-1">
            <p className="text-sm font-medium">New clip ready</p>
            <p className="text-xs text-muted-foreground">2 hours ago</p>
          </div>
        </div>
        <div className="flex items-start gap-4 rounded-lg border p-4">
          <div className="size-2 rounded-full bg-primary mt-2" />
          <div className="flex-1">
            <p className="text-sm font-medium">Job completed</p>
            <p className="text-xs text-muted-foreground">5 hours ago</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          Mark all as read
        </Button>
      </CardFooter>
    </Card>
  ),
}

