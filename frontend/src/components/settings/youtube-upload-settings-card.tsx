import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import type { Settings } from "@/types"

type YouTubeUploadSettingsCardProps = {
  settings: Settings | null
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

export function YouTubeUploadSettingsCard({
  settings,
  updateSetting,
}: YouTubeUploadSettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>YouTube Upload Settings</CardTitle>
        <CardDescription>Default settings for YouTube uploads</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="default_youtube_privacy">Default Privacy</Label>
            <select
              id="default_youtube_privacy"
              value={settings?.default_youtube_privacy || "private"}
              onChange={(e) => updateSetting("default_youtube_privacy", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="private">Private</option>
              <option value="unlisted">Unlisted</option>
              <option value="public">Public</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="make_shorts">Upload as Shorts</Label>
            <div className="flex items-center gap-2">
              <input
                id="make_shorts"
                type="checkbox"
                checked={settings?.make_shorts ?? true}
                onChange={(e) => updateSetting("make_shorts", e.target.checked)}
                className="size-4 rounded border-input"
              />
              <Label htmlFor="make_shorts" className="font-normal">
                Automatically optimize clips for YouTube Shorts
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


