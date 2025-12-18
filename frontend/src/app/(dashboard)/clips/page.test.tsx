import { render, screen, fireEvent } from "@testing-library/react";
import ClipsPage from "./page";

const mockUseClips = vi.fn();

vi.mock("@/hooks/use-clips", () => ({
  useClips: (...args: unknown[]) => mockUseClips(...args),
}));

vi.mock("@/components/ui/loading-spinner", () => ({
  LoadingSpinner: () => <div>Loading...</div>,
}));

vi.mock("@/components/ui/empty-state", () => ({
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock("@/components/clip-player-modal", () => ({
  ClipPlayerModal: () => <div>Player Modal</div>,
}));

vi.mock("@/components/clips/clips-header", () => ({
  ClipsHeader: ({ onRefresh }: { onRefresh: () => void }) => (
    <button onClick={onRefresh}>Refresh Clips</button>
  ),
}));

vi.mock("@/components/clips/clips-filters", () => ({
  ClipsFilters: () => <div>Clips Filters</div>,
}));

vi.mock("@/components/clips/clip-card-grid", () => ({
  ClipCardGrid: ({ clip }: { clip: { title?: string } }) => (
    <div>Grid Clip {clip.title}</div>
  ),
}));

vi.mock("@/components/clips/clip-card-list", () => ({
  ClipCardList: ({ clip }: { clip: { title?: string } }) => (
    <div>List Clip {clip.title}</div>
  ),
}));

function setupClipsMock(
  overrides: Partial<ReturnType<typeof mockUseClips>> = {}
) {
  const base = {
    filteredClips: [],
    isLoading: false,
    uploading: null,
    selectedClip: null,
    setSelectedClip: vi.fn(),
    searchQuery: "",
    setSearchQuery: vi.fn(),
    viewMode: "grid",
    setViewMode: vi.fn(),
    loadClips: vi.fn(),
    handleDownload: vi.fn(),
    handleUpload: vi.fn(),
    handleDelete: vi.fn(),
    formatDuration: vi.fn(),
    formatFileSize: vi.fn(),
  };

  const state = { ...base, ...overrides };
  mockUseClips.mockReturnValue(state);
  return state;
}

describe("ClipsPage", () => {
  it("shows loading spinner when loading", () => {
    setupClipsMock({ isLoading: true });

    render(<ClipsPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows empty state when there are no clips", () => {
    setupClipsMock({ isLoading: false, filteredClips: [], searchQuery: "" });

    render(<ClipsPage />);

    expect(screen.getByText("No clips generated yet")).toBeInTheDocument();
  });

  it("calls loadClips with true when refresh header is clicked", () => {
    const clipsState = setupClipsMock();

    render(<ClipsPage />);

    fireEvent.click(screen.getByText("Refresh Clips"));

    expect(clipsState.loadClips).toHaveBeenCalledWith(true);
  });
});
