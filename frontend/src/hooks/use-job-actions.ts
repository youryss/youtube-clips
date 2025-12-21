import * as React from "react";
import { toast } from "sonner";

import { api } from "@/services/api";
import type { Job } from "@/types";
import { PROCESSING_STATUSES, type StatusFilter } from "./jobs-state";

export interface UseJobActionsResult {
  handleDeleteJob: (jobId: number) => Promise<void>;
  handleRetryJob: (jobId: number) => Promise<void>;
  handleCancelJob: (jobId: number) => Promise<void>;
  getStatusCount: (status: StatusFilter | "all" | "processing") => number;
}

export function useJobActions(
  jobs: Job[],
  loadJobs: (showLoading?: boolean) => Promise<void>
): UseJobActionsResult {
  const handleDeleteJob = React.useCallback(
    async (jobId: number) => {
      if (
        !window.confirm(
          "Are you sure you want to delete this job and all its clips?"
        )
      ) {
        return;
      }

      try {
        await api.deleteJob(jobId);
        toast.success("Job deleted successfully");
        void loadJobs();
      } catch (error: unknown) {
        const errorMessage =
          (error as { response?: { data?: { error?: string } } })?.response
            ?.data?.error || "Failed to delete job";
        toast.error(errorMessage);
      }
    },
    [loadJobs]
  );

  const handleRetryJob = React.useCallback(
    async (jobId: number) => {
      try {
        const job = jobs.find((j) => j.id === jobId);
        if (!job) return;

        await api.deleteJob(jobId);
        await api.createJob(job.video_url);
        toast.success("Job restarted!");
        void loadJobs();
      } catch (error: unknown) {
        const errorMessage =
          (error as { response?: { data?: { error?: string } } })?.response
            ?.data?.error || "Failed to retry job";
        toast.error(errorMessage);
      }
    },
    [jobs, loadJobs]
  );

  const handleCancelJob = React.useCallback(
    async (jobId: number) => {
      try {
        await api.cancelJob(jobId);
        toast.success("Job cancelled");
        void loadJobs();
      } catch (error: unknown) {
        const errorMessage =
          (error as { response?: { data?: { error?: string } } })?.response
            ?.data?.error || "Failed to cancel job";
        toast.error(errorMessage);
      }
    },
    [loadJobs]
  );

  const getStatusCount = React.useCallback(
    (status: StatusFilter | "all" | "processing") => {
      if (status === "all") return jobs.length;
      if (status === "processing") {
        return jobs.filter((j) =>
          PROCESSING_STATUSES.includes(
            j.status as (typeof PROCESSING_STATUSES)[number]
          )
        ).length;
      }
      return jobs.filter((j) => j.status === status).length;
    },
    [jobs]
  );

  return { handleDeleteJob, handleRetryJob, handleCancelJob, getStatusCount };
}
