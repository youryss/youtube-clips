import type { Meta, StoryObj } from "@storybook/react";
import { Separator } from "@/components/ui/separator";

const meta: Meta<typeof Separator> = {
  title: "UI/Separator",
  component: Separator,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-[300px]">
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Viral Clipper</h4>
        <p className="text-sm text-muted-foreground">
          An AI-powered tool for creating viral clips.
        </p>
      </div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center space-x-4 text-sm">
        <div>Dashboard</div>
        <Separator orientation="vertical" />
        <div>Jobs</div>
        <Separator orientation="vertical" />
        <div>Clips</div>
        <Separator orientation="vertical" />
        <div>Settings</div>
      </div>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-5 items-center space-x-4 text-sm">
      <div>Dashboard</div>
      <Separator orientation="vertical" />
      <div>Jobs</div>
      <Separator orientation="vertical" />
      <div>Clips</div>
    </div>
  ),
};

export const InCard: Story = {
  render: () => (
    <div className="w-[350px] rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Video Details</h3>
        <span className="text-sm text-muted-foreground">Job #123</span>
      </div>
      <Separator className="my-4" />
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Duration</span>
          <span>5:32</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Clips</span>
          <span>8</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className="text-success">Completed</span>
        </div>
      </div>
      <Separator className="my-4" />
      <p className="text-sm text-muted-foreground">Created on Dec 17, 2025</p>
    </div>
  ),
};

export const WithText: Story = {
  render: () => (
    <div className="w-[300px]">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
    </div>
  ),
};
