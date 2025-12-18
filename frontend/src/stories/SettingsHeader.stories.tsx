import type { Meta, StoryObj } from "@storybook/react";
import { SettingsHeader } from "@/components/settings/settings-header";

const meta: Meta<typeof SettingsHeader> = {
  title: "Settings/SettingsHeader",
  component: SettingsHeader,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
