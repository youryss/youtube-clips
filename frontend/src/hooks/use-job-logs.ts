import * as React from "react"
import { toast } from "sonner"

import { api } from "@/services/api"

export interface UseJobLogsResult {
  expandedJobId: number | null
  jobLogs: Record<number, string>
  handleViewLogs: (jobId: number) => Promise<void>
}

export function useJobLogs(): UseJobLogsResult {
  const [expandedJobId, setExpandedJobId] = React.useState<number | null>(null)
  const [jobLogs, setJobLogs] = React.useState<Record<number, string>>({})

  const handleViewLogs = React.useCallback(
    async (jobId: number) => {
      if (expandedJobId === jobId) {
        setExpandedJobId(null)
        return
      }

      try {
        const logs = await api.getJobLogs(jobId)
        setJobLogs((prev) => ({ ...prev, [jobId]: JSON.stringify(logs, null, 2) }))
        setExpandedJobId(jobId)
      } catch (error: unknown) {
        const errorMessage =
          (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          "Failed to get logs"
        toast.error(errorMessage)
      }
    },
    [expandedJobId]
  )

  return { expandedJobId, jobLogs, handleViewLogs }
}


