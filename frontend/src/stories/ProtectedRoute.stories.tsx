import type { Meta, StoryObj } from "@storybook/react";
import { ProtectedRoute } from "@/components/protected-route";

const meta: Meta<typeof ProtectedRoute> = {
  title: "Routing/ProtectedRoute",
  component: ProtectedRoute,
  parameters: {
    docs: {
      description: {
        story:
          "ProtectedRoute relies on the app's auth context and Next.js router. In Storybook, it may require additional providers to work as in the app.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Placeholder: Story = {
  render: () => (
    <div className="p-4 text-sm text-muted-foreground">
      ProtectedRoute is intended for use in the app shell and is not rendered
      directly in Storybook.
    </div>
  ),
};
