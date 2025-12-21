import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface DashboardCreateJobCardProps {
  videoUrl: string
  onVideoUrlChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isSubmitting: boolean
}

export function DashboardCreateJobCard({
  videoUrl,
  onVideoUrlChange,
  onSubmit,
  isSubmitting,
}: DashboardCreateJobCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Viral Clips</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit}>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <Input
                type="url"
                value={videoUrl}
                onChange={(e) => onVideoUrlChange(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                required
              />
            </div>
            <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
              Process Video
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}


