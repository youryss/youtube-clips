import { render, screen } from "@testing-library/react";
import JobsPage from "./page";

// Mock child components to keep the test focused on page wiring
vi.mock("@/components/jobs/jobs-header", () => ({
  JobsHeader: ({ onRefresh }: { onRefresh: () => void }) => (
    <button onClick={onRefresh}>Refresh</button>
  ),
}));

vi.mock("@/components/jobs/jobs-filters", () => ({
  JobsFilters: () => <div>Jobs Filters</div>,
}));

vi.mock("@/components/jobs/jobs-pagination", () => ({
  JobsPagination: () => <div>Jobs Pagination</div>,
}));

vi.mock("@/components/jobs/job-card", () => ({
  JobCard: ({ job }: { job: { id: string; title?: string } }) => (
    <div>Job Card {job.title ?? job.id}</div>
  ),
}));

vi.mock("@/components/ui/loading-spinner", () => ({
  LoadingSpinner: () => <div>Loading...</div>,
}));

vi.mock("@/components/ui/empty-state", () => ({
  EmptyState: ({
    title,
    description,
  }: {
    title: string;
    description: string;
  }) => (
    <div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  ),
}));

// Mock hooks
const mockUseJobData = vi.fn();
const mockUseJobFilters = vi.fn();
const mockUseJobPagination = vi.fn();
const mockUseJobLogs = vi.fn();
const mockUseJobActions = vi.fn();

vi.mock("@/hooks/use-job-data", () => ({
  useJobData: (...args: unknown[]) => mockUseJobData(...args),
}));

vi.mock("@/hooks/use-job-filters", () => ({
  useJobFilters: (...args: unknown[]) => mockUseJobFilters(...args),
}));

vi.mock("@/hooks/use-job-pagination", () => ({
  useJobPagination: (...args: unknown[]) => mockUseJobPagination(...args),
}));

vi.mock("@/hooks/use-job-logs", () => ({
  useJobLogs: (...args: unknown[]) => mockUseJobLogs(...args),
}));

vi.mock("@/hooks/use-job-actions", () => ({
  useJobActions: (...args: unknown[]) => mockUseJobActions(...args),
}));

function setupMocks({
  isLoading = false,
  jobs = [],
  filteredJobs = [],
  paginatedJobs = [],
  searchQuery = "",
  statusFilter = "all",
}: {
  isLoading?: boolean;
  jobs?: any[];
  filteredJobs?: any[];
  paginatedJobs?: any[];
  searchQuery?: string;
  statusFilter?: string;
}) {
  const loadJobs = vi.fn();

  mockUseJobData.mockReturnValue({
    jobs,
    isLoading,
    loadJobs,
  });

  mockUseJobFilters.mockReturnValue({
    searchQuery,
    setSearchQuery: vi.fn(),
    statusFilter,
    setStatusFilter: vi.fn(),
    viewMode: "list",
    setViewMode: vi.fn(),
    filteredJobs,
  });

  mockUseJobPagination.mockReturnValue({
    currentPage: 1,
    setCurrentPage: vi.fn(),
    totalPages: 1,
    startIndex: 0,
    endIndex: paginatedJobs.length,
    paginatedJobs,
  });

  mockUseJobLogs.mockReturnValue({
    expandedJobId: null,
    jobLogs: {},
    handleViewLogs: vi.fn(),
  });

  mockUseJobActions.mockReturnValue({
    handleDeleteJob: vi.fn(),
    handleRetryJob: vi.fn(),
    handleCancelJob: vi.fn(),
    getStatusCount: vi.fn().mockReturnValue(0),
  });

  return { loadJobs };
}

describe("JobsPage", () => {
  it("shows loading state when jobs are loading", () => {
    setupMocks({ isLoading: true });

    render(<JobsPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows empty state when there are no jobs and no filters", () => {
    setupMocks({
      isLoading: false,
      jobs: [],
      filteredJobs: [],
      paginatedJobs: [],
      searchQuery: "",
      statusFilter: "all",
    });

    render(<JobsPage />);

    expect(screen.getByText("No jobs yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Create a job from the dashboard to get started!",
      ),
    ).toBeInTheDocument();
  });

  it("shows filtered empty state when filters are applied but no jobs match", () => {
    setupMocks({
      isLoading: false,
      jobs: [{ id: "1" }],
      filteredJobs: [],
      paginatedJobs: [],
      searchQuery: "test",
      statusFilter: "completed",
    });

    render(<JobsPage />);

    expect(screen.getByText("No jobs found")).toBeInTheDocument();
    expect(
      screen.getByText("Try adjusting your filters"),
    ).toBeInTheDocument();
  });

  it("renders job cards when paginated jobs are available", () => {
    const job = { id: "1", title: "My Job" };
    setupMocks({
      isLoading: false,
      jobs: [job],
      filteredJobs: [job],
      paginatedJobs: [job],
    });

    render(<JobsPage />);

    expect(screen.getByText("Job Card My Job")).toBeInTheDocument();
    expect(screen.getByText("Jobs Filters")).toBeInTheDocument();
    expect(screen.getByText("Jobs Pagination")).toBeInTheDocument();
  });

  it("calls loadJobs with refresh flag when header refresh is clicked", () => {
    const { loadJobs } = setupMocks({
      isLoading: false,
      jobs: [],
      filteredJobs: [],
      paginatedJobs: [],
    });

    render(<JobsPage />);

    screen.getByText("Refresh").click();
    expect(loadJobs).toHaveBeenCalledWith(true);
  });
});

