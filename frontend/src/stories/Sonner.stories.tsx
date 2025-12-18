import type { Meta, StoryObj } from "@storybook/react";
import { Toaster } from "@/components/ui/sonner";

const meta: Meta<typeof Toaster> = {
  title: "UI/SonnerToaster",
  component: Toaster,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <>
      <p className="text-sm text-muted-foreground">
        Use `toast()` from `sonner` in your app to trigger notifications. This
        story only renders the toaster container.
      </p>
      <Toaster />
    </>
  ),
};
