import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Grid, List, Search } from "lucide-react"

type ViewMode = "grid" | "list"

type ClipsFiltersProps = {
  searchQuery: string
  onSearchChange: (value: string) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export function ClipsFilters({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
}: ClipsFiltersProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row">
        <div className="w-full flex-1">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search clips by title, filename, or criteria..."
            leftIcon={<Search className="size-4" />}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onViewModeChange("grid")}
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            icon={<Grid className="size-4" />}
          >
            Grid
          </Button>
          <Button
            onClick={() => onViewModeChange("list")}
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            icon={<List className="size-4" />}
          >
            List
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


