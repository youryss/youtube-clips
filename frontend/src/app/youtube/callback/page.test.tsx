import { render, screen, waitFor } from "@testing-library/react";
import YouTubeCallbackPage from "./page";

const mockPush = vi.fn();
const mockSearchParams = new Map<string, string | null>();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams.get(key),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/protected-route", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@/components/ui/loading-spinner", () => ({
  LoadingSpinner: () => <div>Spinner</div>,
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/services/api", () => ({
  api: {
    handleYouTubeCallback: vi.fn().mockResolvedValue({
      account: { channel_title: "My Channel" },
    }),
  },
}));

describe("YouTubeCallbackPage", () => {
  beforeEach(() => {
    mockSearchParams.clear();
  });

  it("shows error when callback params are missing", async () => {
    // no code/state params
    render(<YouTubeCallbackPage />);

    await waitFor(() => {
      expect(screen.getByText(/Connection Failed/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Invalid callback parameters/i)
      ).toBeInTheDocument();
    });
  });

  it("shows success state when callback succeeds", async () => {
    mockSearchParams.set("code", "test-code");
    mockSearchParams.set("state", "test-state");

    render(<YouTubeCallbackPage />);

    await waitFor(() => {
      expect(screen.getByText(/Success!/i)).toBeInTheDocument();
      expect(screen.getByText(/My Channel/)).toBeInTheDocument();
    });
  });
});
