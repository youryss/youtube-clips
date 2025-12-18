import * as React from "react";
import { toast } from "sonner";
import { api } from "@/services/api";
import type { Settings, YouTubeAccount } from "@/types";

export function useSettings() {
  const [settings, setSettings] = React.useState<Settings | null>(null);
  const [youtubeAccounts, setYoutubeAccounts] = React.useState<
    YouTubeAccount[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [settingsRes, accountsRes] = await Promise.all([
        api.getSettings(),
        api.listYouTubeAccounts(),
      ]);
      setSettings(settingsRes.settings);
      setYoutubeAccounts(accountsRes.accounts);
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveSettings = React.useCallback(async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      await api.updateSettings(settings);
      toast.success("Settings saved successfully");
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to save settings";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  const handleConnectYouTube = React.useCallback(async () => {
    setIsConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/youtube/callback`;
      const response = await api.getYouTubeAuthUrl(redirectUri);
      window.location.href = response.authorization_url;
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to start YouTube authorization";
      toast.error(errorMessage);
      setIsConnecting(false);
    }
  }, []);

  const handleDeleteYouTubeAccount = React.useCallback(
    async (accountId: number) => {
      if (
        !window.confirm(
          "Are you sure you want to disconnect this YouTube account?"
        )
      ) {
        return;
      }

      try {
        await api.deleteYouTubeAccount(accountId);
        toast.success("YouTube account disconnected");
        loadData();
      } catch (error: unknown) {
        const errorMessage =
          (error as { response?: { data?: { error?: string } } })?.response
            ?.data?.error || "Failed to disconnect account";
        toast.error(errorMessage);
      }
    },
    [loadData]
  );

  const updateSetting = React.useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    },
    []
  );

  return {
    settings,
    youtubeAccounts,
    isLoading,
    isSaving,
    isConnecting,
    handleSaveSettings,
    handleConnectYouTube,
    handleDeleteYouTubeAccount,
    updateSetting,
  };
}
