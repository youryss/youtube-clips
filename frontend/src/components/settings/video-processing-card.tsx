import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { Settings } from "@/types"

type VideoProcessingCardProps = {
  settings: Settings | null
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

export function VideoProcessingCard({ settings, updateSetting }: VideoProcessingCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Video Processing</CardTitle>
        <CardDescription>
          Configure how videos are processed and clips are generated
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="min_clip_duration">Min Clip Duration (seconds)</Label>
            <Input
              id="min_clip_duration"
              type="number"
              value={settings?.min_clip_duration || 15}
              onChange={(e) => updateSetting("min_clip_duration", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_clip_duration">Max Clip Duration (seconds)</Label>
            <Input
              id="max_clip_duration"
              type="number"
              value={settings?.max_clip_duration || 60}
              onChange={(e) => updateSetting("max_clip_duration", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_clips_per_video">Max Clips Per Video</Label>
            <Input
              id="max_clips_per_video"
              type="number"
              value={settings?.max_clips_per_video || 10}
              onChange={(e) => updateSetting("max_clips_per_video", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="min_viral_score">Min Viral Score (0-10)</Label>
            <Input
              id="min_viral_score"
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={settings?.min_viral_score || 6}
              onChange={(e) => updateSetting("min_viral_score", Number(e.target.value))}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


