import * as React from "react"
import { toast } from "sonner"

import { api } from "@/services/api"
import type { Job } from "@/types"

export type UseJobDataResult = {
  jobs: Job[]
  isLoading: boolean
  loadJobs: (showLoading?: boolean) => Promise<void>
}

export function useJobData(pollingIntervalMs: number): UseJobDataResult {
  const [jobs, setJobs] = React.useState<Job[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const loadJobs = React.useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setIsLoading(true)
      }
      try {
        const response = await api.listJobs({ per_page: 100 })
        setJobs(response.jobs)
      } catch (error) {
        console.error("Failed to load jobs:", error)
        if (showLoading) {
          toast.error("Failed to load jobs")
        }
      } finally {
        if (showLoading) {
          setIsLoading(false)
        }
      }
    },
    []
  )

  // Initial load + polling
  React.useEffect(() => {
    loadJobs()
    const interval = window.setInterval(() => {
      void loadJobs(false)
    }, pollingIntervalMs)

    return () => window.clearInterval(interval)
  }, [loadJobs, pollingIntervalMs])

  return { jobs, isLoading, loadJobs }
}


