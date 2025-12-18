import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

type ClipsHeaderProps = {
  onRefresh: () => void
}

export function ClipsHeader({ onRefresh }: ClipsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Generated Clips</h1>
        <p className="mt-1 text-muted-foreground">View and manage your viral clips</p>
      </div>
      <Button onClick={onRefresh} variant="outline" icon={<RefreshCw className="size-4" />}>
        Refresh
      </Button>
    </div>
  )
}


