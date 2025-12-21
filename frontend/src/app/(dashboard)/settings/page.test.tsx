import { render, screen } from "@testing-library/react";
import SettingsPage from "./page";

const mockUseSettings = vi.fn();

vi.mock("@/hooks/use-settings", () => ({
  useSettings: (...args: unknown[]) => mockUseSettings(...args),
}));

vi.mock("@/components/ui/loading-spinner", () => ({
  LoadingSpinner: () => <div>Loading...</div>,
}));

vi.mock("@/components/settings/settings-header", () => ({
  SettingsHeader: () => <div>Settings Header</div>,
}));

vi.mock("@/components/settings/youtube-accounts-card", () => ({
  YouTubeAccountsCard: () => <div>YouTube Accounts</div>,
}));

vi.mock("@/components/settings/video-processing-card", () => ({
  VideoProcessingCard: () => <div>Video Processing</div>,
}));

vi.mock("@/components/settings/ai-settings-card", () => ({
  AISettingsCard: () => <div>AI Settings</div>,
}));

vi.mock("@/components/settings/youtube-upload-settings-card", () => ({
  YouTubeUploadSettingsCard: () => <div>YouTube Upload Settings</div>,
}));

vi.mock("@/components/settings/settings-save-bar", () => ({
  SettingsSaveBar: () => <div>Save Bar</div>,
}));

describe("SettingsPage", () => {
  it("shows loading spinner when settings are loading", () => {
    mockUseSettings.mockReturnValue({
      settings: {},
      youtubeAccounts: [],
      isLoading: true,
      isSaving: false,
      isConnecting: false,
      handleSaveSettings: vi.fn(),
      handleConnectYouTube: vi.fn(),
      handleDeleteYouTubeAccount: vi.fn(),
      updateSetting: vi.fn(),
    });

    render(<SettingsPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders settings sections when not loading", () => {
    mockUseSettings.mockReturnValue({
      settings: {},
      youtubeAccounts: [],
      isLoading: false,
      isSaving: false,
      isConnecting: false,
      handleSaveSettings: vi.fn(),
      handleConnectYouTube: vi.fn(),
      handleDeleteYouTubeAccount: vi.fn(),
      updateSetting: vi.fn(),
    });

    render(<SettingsPage />);

    expect(screen.getByTestId("video-processing-tab")).toBeInTheDocument();
    expect(screen.getByTestId("ai-settings-tab")).toBeInTheDocument();
    expect(
      screen.getByTestId("youtube-upload-settings-tab")
    ).toBeInTheDocument();
  });
});
