import { renderHook } from "@testing-library/react";

import { useJobs } from "./use-jobs";

vi.mock("./use-job-data", () => ({
  useJobData: () => ({
    jobs: [{ id: 1 }],
    isLoading: false,
    loadJobs: vi.fn(),
  }),
}));

vi.mock("./use-job-filters", () => ({
  useJobFilters: () => ({
    searchQuery: "",
    setSearchQuery: vi.fn(),
    statusFilter: "all",
    setStatusFilter: vi.fn(),
    viewMode: "grid",
    setViewMode: vi.fn(),
    filteredJobs: [{ id: 1 }],
  }),
}));

vi.mock("./use-job-pagination", () => ({
  useJobPagination: () => ({
    currentPage: 1,
    setCurrentPage: vi.fn(),
    totalPages: 1,
    startIndex: 0,
    endIndex: 1,
    paginatedJobs: [{ id: 1 }],
  }),
}));

vi.mock("./use-job-logs", () => ({
  useJobLogs: () => ({
    expandedJobId: null,
    jobLogs: [],
    handleViewLogs: vi.fn(),
  }),
}));

vi.mock("./use-job-actions", () => ({
  useJobActions: () => ({
    handleDeleteJob: vi.fn(),
    handleRetryJob: vi.fn(),
    handleCancelJob: vi.fn(),
    getStatusCount: vi.fn(),
  }),
}));

describe("useJobs", () => {
  it("composes sub-hooks and exposes combined shape", () => {
    const { result } = renderHook(() => useJobs());

    expect(result.current.jobs).toHaveLength(1);
    expect(result.current.filteredJobs).toHaveLength(1);
    expect(result.current.paginatedJobs).toHaveLength(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.currentPage).toBe(1);
  });
});


