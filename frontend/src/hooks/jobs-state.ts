export const PROCESSING_STATUSES = [
  "downloading",
  "transcribing",
  "analyzing",
  "slicing",
] as const

export type JobsViewMode = "grid" | "list"

export type StatusFilter = "all" | "completed" | "processing" | "failed" | "pending"

export const ITEMS_PER_PAGE = 10


