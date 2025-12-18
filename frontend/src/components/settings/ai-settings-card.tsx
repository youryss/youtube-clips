import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import type { Settings } from "@/types"

type AISettingsCardProps = {
  settings: Settings | null
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

export function AISettingsCard({ settings, updateSetting }: AISettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Settings</CardTitle>
        <CardDescription>
          Configure AI model settings for transcription and analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="whisper_model">Whisper Model</Label>
            <select
              id="whisper_model"
              value={settings?.whisper_model || "base"}
              onChange={(e) => updateSetting("whisper_model", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="tiny">Tiny (fastest)</option>
              <option value="base">Base</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large (most accurate)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="openai_model">OpenAI Model</Label>
            <select
              id="openai_model"
              value={settings?.openai_model || "gpt-4o-mini"}
              onChange={(e) => updateSetting("openai_model", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


