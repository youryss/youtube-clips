"use client";

import * as React from "react";
import { List, Play, Clock, CheckCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { JobsHeader } from "@/components/jobs/jobs-header";
import { JobsFilters } from "@/components/jobs/jobs-filters";
import { JobCard } from "@/components/jobs/job-card";
import { JobsPagination } from "@/components/jobs/jobs-pagination";
import { useJobData } from "@/hooks/use-job-data";
import { useJobFilters } from "@/hooks/use-job-filters";
import { useJobPagination } from "@/hooks/use-job-pagination";
import { useJobLogs } from "@/hooks/use-job-logs";
import { useJobActions } from "@/hooks/use-job-actions";
import type { StatusFilter } from "@/hooks/jobs-state";

interface StatusTab {
  value: StatusFilter;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const statusTabs: StatusTab[] = [
  { value: "all", label: "All", icon: List },
  { value: "completed", label: "Completed", icon: CheckCircle },
  { value: "processing", label: "Processing", icon: Play },
  { value: "failed", label: "Failed", icon: XCircle },
  { value: "pending", label: "Pending", icon: Clock },
];

export default function JobsPage() {
  const { jobs, isLoading, loadJobs } = useJobData(5000);
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    filteredJobs,
  } = useJobFilters(jobs);
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    startIndex,
    endIndex,
    paginatedJobs,
  } = useJobPagination(filteredJobs);

  const { expandedJobId, jobLogs, handleViewLogs } = useJobLogs();

  const { handleDeleteJob, handleRetryJob, handleCancelJob, getStatusCount } =
    useJobActions(jobs, loadJobs);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <JobsHeader onRefresh={() => loadJobs(true)} />

      {/* Filters and Controls */}
      <JobsFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        statusTabs={statusTabs}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        getStatusCount={getStatusCount}
      />

      {/* Jobs Display */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : paginatedJobs.length === 0 ? (
        <Card>
          <div className="p-6">
            <EmptyState
              icon={<List className="size-8" />}
              title={
                searchQuery || statusFilter !== "all"
                  ? "No jobs found"
                  : "No jobs yet"
              }
              description={
                searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create a job from the dashboard to get started!"
              }
            />
          </div>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 gap-6 md:grid-cols-2"
              : "space-y-4"
          }
        >
          {paginatedJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isExpanded={expandedJobId === job.id}
              logs={jobLogs[job.id]}
              onToggleLogs={() => handleViewLogs(job.id)}
              onRetry={() => handleRetryJob(job.id)}
              onCancel={() => handleCancelJob(job.id)}
              onDelete={() => handleDeleteJob(job.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <JobsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={filteredJobs.length}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
