import { Film, Play, CheckCircle, ListTodo } from "lucide-react"
import { MetricCard } from "@/components/ui/metric-card"

type DashboardMetricsProps = {
  totalClips: number
  activeJobs: number
  completedJobs: number
  successRate: number
}

export function DashboardMetrics({
  totalClips,
  activeJobs,
  completedJobs,
  successRate,
}: DashboardMetricsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Clips"
        value={totalClips}
        icon={<Film className="size-6" />}
        iconColor="primary"
      />
      <MetricCard
        title="Active Jobs"
        value={activeJobs}
        icon={<Play className="size-6" />}
        iconColor="warning"
      />
      <MetricCard
        title="Completed Jobs"
        value={completedJobs}
        icon={<CheckCircle className="size-6" />}
        iconColor="success"
      />
      <MetricCard
        title="Success Rate"
        value={`${successRate}%`}
        icon={<ListTodo className="size-6" />}
        iconColor="info"
      />
    </div>
  )
}


