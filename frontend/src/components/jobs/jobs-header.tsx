import * as React from "react";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

type JobsHeaderProps = {
  title?: string;
  description?: string;
  onRefresh?: () => void;
};

export function JobsHeader({
  title = "All Jobs",
  description = "View and manage all your video processing jobs",
  onRefresh,
}: JobsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </div>
      {onRefresh && (
        <Button
          onClick={onRefresh}
          variant="outline"
          icon={<RefreshCw className="size-4" />}
        >
          Refresh
        </Button>
      )}
    </div>
  );
}
