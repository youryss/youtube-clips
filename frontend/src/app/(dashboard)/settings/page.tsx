"use client";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useSettings } from "@/hooks/use-settings";
import { SettingsHeader } from "@/components/settings/settings-header";
import { YouTubeAccountsCard } from "@/components/settings/youtube-accounts-card";
import { VideoProcessingCard } from "@/components/settings/video-processing-card";
import { AISettingsCard } from "@/components/settings/ai-settings-card";
import { YouTubeUploadSettingsCard } from "@/components/settings/youtube-upload-settings-card";
import { SettingsSaveBar } from "@/components/settings/settings-save-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  const {
    settings,
    youtubeAccounts,
    isLoading,
    isSaving,
    isConnecting,
    handleSaveSettings,
    handleConnectYouTube,
    handleDeleteYouTubeAccount,
    updateSetting,
  } = useSettings();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsHeader />

      <YouTubeAccountsCard
        accounts={youtubeAccounts}
        onDeleteAccount={handleDeleteYouTubeAccount}
        onConnect={handleConnectYouTube}
        isConnecting={isConnecting}
      />

      <Tabs defaultValue="video-processing">
        <TabsList>
          <TabsTrigger
            value="video-processing"
            data-testid="video-processing-tab"
          >
            Video Processing
          </TabsTrigger>
          <TabsTrigger value="ai-settings" data-testid="ai-settings-tab">
            AI Settings
          </TabsTrigger>
          <TabsTrigger
            value="youtube-upload-settings"
            data-testid="youtube-upload-settings-tab"
          >
            YouTube Upload Settings
          </TabsTrigger>
        </TabsList>
        <TabsContent value="video-processing">
          <VideoProcessingCard
            settings={settings}
            updateSetting={updateSetting}
          />
        </TabsContent>
        <TabsContent value="ai-settings">
          <AISettingsCard settings={settings} updateSetting={updateSetting} />
        </TabsContent>
        <TabsContent value="youtube-upload-settings">
          <YouTubeUploadSettingsCard
            settings={settings}
            updateSetting={updateSetting}
          />
        </TabsContent>
      </Tabs>

      <SettingsSaveBar onSave={handleSaveSettings} isSaving={isSaving} />
    </div>
  );
}
