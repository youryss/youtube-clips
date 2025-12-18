import * as React from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type JobsPaginationProps = {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  onPageChange: (page: number) => void;
};

export function JobsPagination({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  onPageChange,
}: JobsPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of{" "}
          {totalItems} jobs
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
            icon={<ChevronLeft className="size-4" />}
          >
            Previous
          </Button>
          <span className="px-2 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
            icon={<ChevronRight className="size-4" />}
            iconPosition="right"
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
