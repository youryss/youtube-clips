import { ListTodo } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import type { Job } from "@/types"
import { DashboardJobCard } from "@/components/dashboard/dashboard-job-card"

interface DashboardRecentJobsProps {
  jobs: Job[]
  isLoadingJobs: boolean
  expandedJobId: number | null
  jobLogs: { [key: number]: string }
  onViewLogs: (jobId: number) => void
  onRetryJob: (jobId: number) => void
  onCancelJob: (jobId: number) => void
  onDeleteJob: (jobId: number) => void
  onViewAll?: () => void
}

export function DashboardRecentJobs({
  jobs,
  isLoadingJobs,
  expandedJobId,
  jobLogs,
  onViewLogs,
  onRetryJob,
  onCancelJob,
  onDeleteJob,
  onViewAll,
}: DashboardRecentJobsProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Recent Jobs</h2>
        <button
          type="button"
          onClick={onViewAll}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
        >
          View All
        </button>
      </div>

      {isLoadingJobs ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={<ListTodo className="size-8" />}
              title="No jobs yet"
              description="Create your first job by pasting a YouTube URL above"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <DashboardJobCard
              key={job.id}
              job={job}
              expanded={expandedJobId === job.id}
              logs={jobLogs[job.id]}
              onToggleLogs={() => onViewLogs(job.id)}
              onRetry={() => onRetryJob(job.id)}
              onCancel={() => onCancelJob(job.id)}
              onDelete={() => onDeleteJob(job.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}


