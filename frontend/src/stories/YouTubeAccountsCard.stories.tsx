import type { Meta, StoryObj } from "@storybook/react"
import { YouTubeAccountsCard } from "@/components/settings/youtube-accounts-card"
import type { YouTubeAccount } from "@/types"

const sampleAccounts: YouTubeAccount[] = [
  {
    id: 1,
    channel_id: "UC123",
    channel_title: "Main Channel",
    channel_thumbnail: "https://placehold.co/96x96",
    is_active: true,
    is_verified: true,
    created_at: new Date().toISOString(),
    last_used_at: new Date().toISOString(),
  },
  {
    id: 2,
    channel_id: "UC456",
    channel_title: "Clips Channel",
    channel_thumbnail: "https://placehold.co/96x96",
    is_active: false,
    is_verified: false,
    created_at: new Date().toISOString(),
  },
]

const meta: Meta<typeof YouTubeAccountsCard> = {
  title: "Settings/YouTubeAccountsCard",
  component: YouTubeAccountsCard,
}

export default meta
type Story = StoryObj<typeof meta>

export const WithAccounts: Story = {
  args: {
    accounts: sampleAccounts,
    isConnecting: false,
    onConnect: () => {},
    onDeleteAccount: () => {},
  },
}

export const EmptyState: Story = {
  args: {
    accounts: [],
    isConnecting: false,
    onConnect: () => {},
    onDeleteAccount: () => {},
  },
}


