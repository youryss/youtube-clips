import * as React from "react"

import type { Job } from "@/types"
import { JobsViewMode, PROCESSING_STATUSES, type StatusFilter } from "./jobs-state"

export type UseJobFiltersResult = {
  searchQuery: string
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>
  statusFilter: StatusFilter
  setStatusFilter: React.Dispatch<React.SetStateAction<StatusFilter>>
  viewMode: JobsViewMode
  setViewMode: React.Dispatch<React.SetStateAction<JobsViewMode>>
  filteredJobs: Job[]
}

export function useJobFilters(jobs: Job[]): UseJobFiltersResult {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")
  const [viewMode, setViewMode] = React.useState<JobsViewMode>("list")

  const filteredJobs = React.useMemo(() => {
    let filtered = [...jobs]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (job) =>
          job.video_title?.toLowerCase().includes(query) ||
          job.video_url?.toLowerCase().includes(query)
      )
    }

    if (statusFilter !== "all") {
      if (statusFilter === "processing") {
        filtered = filtered.filter((j) => PROCESSING_STATUSES.includes(j.status as any))
      } else {
        filtered = filtered.filter((job) => job.status === statusFilter)
      }
    }

    return filtered
  }, [jobs, searchQuery, statusFilter])

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    filteredJobs,
  }
}


