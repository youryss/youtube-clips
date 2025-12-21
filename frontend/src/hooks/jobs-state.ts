export const PROCESSING_STATUSES = [
  "downloading",
  "transcribing",
  "analyzing",
  "slicing",
] as const

// Union types must remain as type aliases since interfaces cannot represent unions
export type JobsViewMode = "grid" | "list"

export type StatusFilter = "all" | "completed" | "processing" | "failed" | "pending"

export const ITEMS_PER_PAGE = 10


