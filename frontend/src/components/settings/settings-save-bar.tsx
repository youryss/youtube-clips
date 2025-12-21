import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SettingsSaveBarProps {
  onSave: () => void
  isSaving: boolean
}

export function SettingsSaveBar({ onSave, isSaving }: SettingsSaveBarProps) {
  return (
    <div className="flex justify-end">
      <Button
        onClick={onSave}
        loading={isSaving}
        size="lg"
        icon={<Save className="size-4" />}
      >
        Save Settings
      </Button>
    </div>
  )
}


