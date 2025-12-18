import type { Meta, StoryObj } from "@storybook/react"
import { SettingsSaveBar } from "@/components/settings/settings-save-bar"

const meta: Meta<typeof SettingsSaveBar> = {
  title: "Settings/SettingsSaveBar",
  component: SettingsSaveBar,
  parameters: {
    layout: "centered",
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    isSaving: false,
    onSave: () => {},
  },
}

export const Saving: Story = {
  args: {
    isSaving: true,
    onSave: () => {},
  },
}


