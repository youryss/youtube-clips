"use client";

import { useDashboard } from "@/hooks/use-dashboard";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics";
import { DashboardCreateJobCard } from "@/components/dashboard/dashboard-create-job-card";
import { DashboardRecentJobs } from "@/components/dashboard/dashboard-recent-jobs";

export default function DashboardPage() {
  const {
    videoUrl,
    setVideoUrl,
    jobs,
    isSubmitting,
    isLoadingJobs,
    expandedJobId,
    jobLogs,
    handleSubmit,
    handleDeleteJob,
    handleRetryJob,
    handleCancelJob,
    handleViewLogs,
    metrics,
  } = useDashboard();

  return (
    <div className="space-y-6">
      <DashboardHeader />

      <DashboardMetrics
        totalClips={metrics.totalClips}
        activeJobs={metrics.activeJobs}
        completedJobs={metrics.completedJobs}
        successRate={metrics.successRate}
      />

      <DashboardCreateJobCard
        videoUrl={videoUrl}
        onVideoUrlChange={setVideoUrl}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      <DashboardRecentJobs
        jobs={jobs}
        isLoadingJobs={isLoadingJobs}
        expandedJobId={expandedJobId}
        jobLogs={jobLogs}
        onViewLogs={handleViewLogs}
        onRetryJob={handleRetryJob}
        onCancelJob={handleCancelJob}
        onDeleteJob={handleDeleteJob}
      />
    </div>
  );
}
