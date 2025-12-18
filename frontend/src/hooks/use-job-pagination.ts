import * as React from "react"

import type { Job } from "@/types"
import { ITEMS_PER_PAGE } from "./jobs-state"

export type UseJobPaginationResult = {
  currentPage: number
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
  totalPages: number
  startIndex: number
  endIndex: number
  paginatedJobs: Job[]
}

export function useJobPagination(filteredJobs: Job[]): UseJobPaginationResult {
  const [currentPage, setCurrentPage] = React.useState(1)

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [filteredJobs])

  const totalPages = React.useMemo(
    () => Math.ceil(filteredJobs.length / ITEMS_PER_PAGE) || 1,
    [filteredJobs.length]
  )

  const { startIndex, endIndex, paginatedJobs } = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    const pageJobs = filteredJobs.slice(start, end)

    return { startIndex: start, endIndex: end, paginatedJobs: pageJobs }
  }, [currentPage, filteredJobs])

  return { currentPage, setCurrentPage, totalPages, startIndex, endIndex, paginatedJobs }
}


