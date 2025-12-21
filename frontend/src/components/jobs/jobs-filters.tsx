import * as React from "react";

import { Grid, List, Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { JobsViewMode, StatusFilter } from "@/hooks/jobs-state";

interface StatusTab {
  value: StatusFilter;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface JobsFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  viewMode: JobsViewMode;
  onViewModeChange: (mode: JobsViewMode) => void;
  statusTabs: StatusTab[];
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  getStatusCount: (status: StatusFilter) => number;
}

export function JobsFilters({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  statusTabs,
  statusFilter,
  onStatusFilterChange,
  getStatusCount,
}: JobsFiltersProps) {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search jobs by title or URL..."
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
        </div>

        <div className="flex w-full gap-2 overflow-x-auto pb-2">
          {statusTabs.map((tab) => {
            const count = getStatusCount(tab.value);
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => onStatusFilterChange(tab.value)}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  statusFilter === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Icon className="size-4" />
                {tab.label} ({count})
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
