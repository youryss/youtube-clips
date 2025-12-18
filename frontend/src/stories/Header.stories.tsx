import type { Meta, StoryObj } from "@storybook/react";
import { Header } from "@/components/layout/header";

const meta: Meta<typeof Header> = {
  title: "Layout/Header",
  component: Header,
  parameters: {
    docs: {
      description: {
        story:
          "Header depends on auth context and Next.js routing. You may need Storybook decorators to provide those when rendering it for real.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Placeholder: Story = {
  render: () => (
    <div className="p-4 text-sm text-muted-foreground">
      Header is part of the dashboard layout and requires app providers;
      configure decorators to render it as in the app.
    </div>
  ),
};
