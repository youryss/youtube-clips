import { render, screen } from "@testing-library/react";
import DashboardPage from "./page";

const mockUseDashboard = vi.fn();

vi.mock("@/hooks/use-dashboard", () => ({
  useDashboard: (...args: unknown[]) => mockUseDashboard(...args),
}));

vi.mock("@/components/dashboard/dashboard-header", () => ({
  DashboardHeader: () => <div>Dashboard Header</div>,
}));

vi.mock("@/components/dashboard/dashboard-metrics", () => ({
  DashboardMetrics: ({ totalClips }: { totalClips: number }) => (
    <div>Metrics {totalClips}</div>
  ),
}));

vi.mock("@/components/dashboard/dashboard-create-job-card", () => ({
  DashboardCreateJobCard: () => <div>Create Job Card</div>,
}));

vi.mock("@/components/dashboard/dashboard-recent-jobs", () => ({
  DashboardRecentJobs: () => <div>Recent Jobs</div>,
}));

describe("DashboardPage", () => {
  it("renders dashboard sections wired from useDashboard", () => {
    mockUseDashboard.mockReturnValue({
      videoUrl: "",
      setVideoUrl: vi.fn(),
      jobs: [],
      isSubmitting: false,
      isLoadingJobs: false,
      expandedJobId: null,
      jobLogs: {},
      handleSubmit: vi.fn(),
      handleDeleteJob: vi.fn(),
      handleRetryJob: vi.fn(),
      handleCancelJob: vi.fn(),
      handleViewLogs: vi.fn(),
      metrics: {
        totalClips: 5,
        activeJobs: 1,
        completedJobs: 4,
        successRate: 80,
      },
    });

    render(<DashboardPage />);

    expect(screen.getByText("Dashboard Header")).toBeInTheDocument();
    expect(screen.getByText("Metrics 5")).toBeInTheDocument();
    expect(screen.getByText("Create Job Card")).toBeInTheDocument();
    expect(screen.getByText("Recent Jobs")).toBeInTheDocument();
  });
});
