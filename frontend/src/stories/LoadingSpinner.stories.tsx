import type { Meta, StoryObj } from "@storybook/react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const meta: Meta<typeof LoadingSpinner> = {
  title: "UI/LoadingSpinner",
  component: LoadingSpinner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    size: "sm",
  },
};

export const Medium: Story = {
  args: {
    size: "md",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="text-center">
        <LoadingSpinner size="sm" />
        <p className="mt-2 text-sm text-muted-foreground">Small</p>
      </div>
      <div className="text-center">
        <LoadingSpinner size="md" />
        <p className="mt-2 text-sm text-muted-foreground">Medium</p>
      </div>
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-2 text-sm text-muted-foreground">Large</p>
      </div>
    </div>
  ),
};

export const InContext: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-4 p-8 border rounded-lg w-[300px]">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-muted-foreground">Loading clips...</p>
    </div>
  ),
};
