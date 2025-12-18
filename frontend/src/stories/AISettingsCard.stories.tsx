import type { Meta, StoryObj } from "@storybook/react";
import { AISettingsCard } from "@/components/settings/ai-settings-card";
import type { Settings } from "@/types";

const baseSettings: Settings = {
  whisper_model: "base",
  whisper_device: "cpu",
  whisper_compute_type: "float32",
  openai_model: "gpt-4o-mini",
  video_quality: "1080p",
  min_clip_duration: 15,
  max_clip_duration: 60,
  clip_padding_before: 1,
  clip_padding_after: 1,
  max_clips_per_video: 10,
  min_viral_score: 6,
  active_criteria: [],
  thumbnail_mode: "auto",
  thumbnail_frames: 3,
  default_youtube_privacy: "private",
  default_youtube_category: "22",
  make_shorts: true,
};

const meta: Meta<typeof AISettingsCard> = {
  title: "Settings/AISettingsCard",
  component: AISettingsCard,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    settings: baseSettings,
    updateSetting: () => {},
  },
};
