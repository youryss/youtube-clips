import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "@/components/ui/label";

const meta: Meta<typeof Label> = {
  title: "UI/Label",
  component: Label,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Label text",
  },
};
