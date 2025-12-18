import { useJobData } from "./use-job-data";
import { useJobFilters } from "./use-job-filters";
import { useJobPagination } from "./use-job-pagination";
import { useJobLogs } from "./use-job-logs";
import { useJobActions } from "./use-job-actions";
import type { JobsViewMode, StatusFilter } from "./jobs-state";

export type { JobsViewMode, StatusFilter };

export function useJobs(pollingIntervalMs = 5000) {
  // 1) Load base job data (with polling)
  const { jobs, isLoading, loadJobs } = useJobData(pollingIntervalMs);

  // 2) Apply filters + view state
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    filteredJobs,
  } = useJobFilters(jobs);

  // 3) Handle pagination over filtered results
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    startIndex,
    endIndex,
    paginatedJobs,
  } = useJobPagination(filteredJobs);

  // 4) Logs / expanded state
  const { expandedJobId, jobLogs, handleViewLogs } = useJobLogs();

  // 5) Mutating actions (delete, retry, cancel) and counts
  const { handleDeleteJob, handleRetryJob, handleCancelJob, getStatusCount } =
    useJobActions(jobs, loadJobs);

  return {
    // raw data
    jobs,
    isLoading,
    // filters
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    // pagination
    currentPage,
    setCurrentPage,
    totalPages,
    startIndex,
    endIndex,
    filteredJobs,
    paginatedJobs,
    // logs / details
    expandedJobId,
    jobLogs,
    // actions
    loadJobs,
    handleDeleteJob,
    handleRetryJob,
    handleCancelJob,
    handleViewLogs,
    getStatusCount,
  };
}
