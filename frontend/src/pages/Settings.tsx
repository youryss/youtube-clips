import React, { useState, useEffect, useRef } from "react";
import { Settings as SettingsType, YouTubeAccount } from "../types";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  FiSave,
  FiCheckCircle,
  FiXCircle,
  FiTrash2,
  FiPlus,
  FiChevronDown,
  FiChevronUp,
  FiFileText,
} from "react-icons/fi";
import Card, { CardHeader, CardBody } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import LoadingSpinner from "../components/LoadingSpinner";

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [youtubeAccounts, setYoutubeAccounts] = useState<YouTubeAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState("transcription");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [criteria, setCriteria] = useState<{ [key: string]: string }>({});
  const [expandedCriteria, setExpandedCriteria] = useState<{
    [key: string]: boolean;
  }>({});
  const [loadingCriteria, setLoadingCriteria] = useState(false);
  const criteriaLoadedRef = useRef(false);

  useEffect(() => {
    loadSettings();
    loadYouTubeAccounts();
  }, []);

  useEffect(() => {
    if (activeTab === "viral" && !criteriaLoadedRef.current) {
      loadCriteria();
    }
  }, [activeTab]);

  const loadSettings = async () => {
    try {
      const response = await api.getSettings();
      setSettings(response.settings);
    } catch (error: any) {
      showNotification("error", "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const loadYouTubeAccounts = async () => {
    try {
      const response = await api.listYouTubeAccounts();
      setYoutubeAccounts(response.accounts);
    } catch (error) {
      console.error("Failed to load YouTube accounts:", error);
    }
  };

  const handleConnectYouTube = async () => {
    setConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/youtube/callback`;
      const { authorization_url } = await api.getYouTubeAuthUrl(redirectUri);

      sessionStorage.setItem("youtube_oauth_redirect", redirectUri);
      window.location.href = authorization_url;
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Failed to connect YouTube account"
      );
    } finally {
      setConnecting(false);
    }
  };

  const handleDeleteAccount = async (accountId: number) => {
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
      loadYouTubeAccounts();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Failed to disconnect account"
      );
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await api.updateSettings(settings);
      showNotification("success", "Settings saved successfully!");
    } catch (error: any) {
      showNotification(
        "error",
        error.response?.data?.error || "Failed to save settings"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof SettingsType, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const loadCriteria = async () => {
    if (criteriaLoadedRef.current) return; // Already loaded

    setLoadingCriteria(true);
    try {
      const response = await api.getCriteria();
      setCriteria(response.criteria);
      criteriaLoadedRef.current = true;
    } catch (error: any) {
      console.error("Failed to load criteria:", error);
      toast.error("Failed to load criteria");
    } finally {
      setLoadingCriteria(false);
    }
  };

  const toggleCriterionView = (criterionName: string) => {
    setExpandedCriteria((prev) => ({
      ...prev,
      [criterionName]: !prev[criterionName],
    }));
  };

  const formatCriterionName = (name: string): string => {
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const toggleCriteria = (criterion: string) => {
    if (!settings) return;
    const criteria = settings.active_criteria || [];
    const newCriteria = criteria.includes(criterion)
      ? criteria.filter((c) => c !== criterion)
      : [...criteria, criterion];
    setSettings({ ...settings, active_criteria: newCriteria });
  };

  const tabs = [
    { id: "transcription", label: "Transcription" },
    { id: "ai", label: "AI Analysis" },
    { id: "clips", label: "Clip Generation" },
    { id: "viral", label: "Viral Analysis" },
    { id: "thumbnails", label: "Thumbnails" },
    { id: "youtube", label: "YouTube" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!settings) {
    return (
      <Card>
        <div className="p-6 text-center">
          <p className="text-error-600">Failed to load settings</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Settings</h1>
          <p className="text-neutral-600 mt-1">
            Configure your video processing preferences
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          loading={saving}
          variant="primary"
          icon={<FiSave />}
        >
          Save Changes
        </Button>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            notification.type === "success"
              ? "bg-success-50 text-success-800 border border-success-200"
              : "bg-error-50 text-error-800 border border-error-200"
          }`}
        >
          {notification.type === "success" ? (
            <FiCheckCircle className="w-5 h-5" />
          ) : (
            <FiXCircle className="w-5 h-5" />
          )}
          <p className="font-medium">{notification.message}</p>
        </div>
      )}

      {/* Tabs */}
      <Card padding="none">
        <div className="border-b border-neutral-200">
          <div className="flex overflow-x-auto scrollbar-thin">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                  ${
                    activeTab === tab.id
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300"
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Transcription Settings */}
          {activeTab === "transcription" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    Whisper Model Settings
                  </h2>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Input
                        label="Whisper Model"
                        type="select"
                        value={settings.whisper_model}
                        onChange={(e) =>
                          handleInputChange("whisper_model", e.target.value)
                        }
                      >
                        <option value="tiny">
                          Tiny (Fastest, Less Accurate)
                        </option>
                        <option value="base">Base</option>
                        <option value="small">Small (Balanced)</option>
                        <option value="medium">Medium</option>
                        <option value="large">
                          Large (Slowest, Most Accurate)
                        </option>
                      </Input>
                      <p className="mt-1 text-xs text-neutral-500">
                        Larger models are more accurate but slower
                      </p>
                    </div>

                    <div>
                      <Input
                        label="Device"
                        type="select"
                        value={settings.whisper_device}
                        onChange={(e) =>
                          handleInputChange("whisper_device", e.target.value)
                        }
                      >
                        <option value="auto">Auto</option>
                        <option value="cpu">CPU</option>
                        <option value="cuda">CUDA (GPU)</option>
                      </Input>
                    </div>

                    <div>
                      <Input
                        label="Compute Type"
                        type="select"
                        value={settings.whisper_compute_type}
                        onChange={(e) =>
                          handleInputChange(
                            "whisper_compute_type",
                            e.target.value
                          )
                        }
                      >
                        <option value="int8">INT8 (Fast, Less Memory)</option>
                        <option value="float16">Float16</option>
                        <option value="float32">
                          Float32 (Accurate, More Memory)
                        </option>
                      </Input>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {/* AI Analysis Settings */}
          {activeTab === "ai" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    AI Model Settings
                  </h2>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Input
                        label="OpenAI Model"
                        type="select"
                        value={settings.openai_model}
                        onChange={(e) =>
                          handleInputChange("openai_model", e.target.value)
                        }
                      >
                        <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </Input>
                    </div>

                    <div>
                      <Input
                        label="Video Quality"
                        type="select"
                        value={settings.video_quality}
                        onChange={(e) =>
                          handleInputChange("video_quality", e.target.value)
                        }
                      >
                        <option value="720p">720p</option>
                        <option value="1080p">1080p (Recommended)</option>
                        <option value="1440p">1440p</option>
                        <option value="2160p">4K (2160p)</option>
                      </Input>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {/* Clip Generation Settings */}
          {activeTab === "clips" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    Clip Duration Settings
                  </h2>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Input
                        label="Min Clip Duration (seconds)"
                        type="number"
                        value={settings.min_clip_duration}
                        onChange={(e) =>
                          handleInputChange(
                            "min_clip_duration",
                            parseInt(e.target.value)
                          )
                        }
                        min="5"
                        max="60"
                      />
                    </div>

                    <div>
                      <Input
                        label="Max Clip Duration (seconds)"
                        type="number"
                        value={settings.max_clip_duration}
                        onChange={(e) =>
                          handleInputChange(
                            "max_clip_duration",
                            parseInt(e.target.value)
                          )
                        }
                        min="10"
                        max="180"
                      />
                    </div>

                    <div>
                      <Input
                        label="Padding Before (seconds)"
                        type="number"
                        step="0.1"
                        value={settings.clip_padding_before}
                        onChange={(e) =>
                          handleInputChange(
                            "clip_padding_before",
                            parseFloat(e.target.value)
                          )
                        }
                        min="0"
                        max="5"
                      />
                      <p className="mt-1 text-xs text-neutral-500">
                        Extra time before the clip starts
                      </p>
                    </div>

                    <div>
                      <Input
                        label="Padding After (seconds)"
                        type="number"
                        step="0.1"
                        value={settings.clip_padding_after}
                        onChange={(e) =>
                          handleInputChange(
                            "clip_padding_after",
                            parseFloat(e.target.value)
                          )
                        }
                        min="0"
                        max="5"
                      />
                      <p className="mt-1 text-xs text-neutral-500">
                        Extra time after the clip ends
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {/* Viral Analysis Settings */}
          {activeTab === "viral" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    Viral Analysis Configuration
                  </h2>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <Input
                        label="Max Clips Per Video"
                        type="number"
                        value={settings.max_clips_per_video}
                        onChange={(e) =>
                          handleInputChange(
                            "max_clips_per_video",
                            parseInt(e.target.value)
                          )
                        }
                        min="1"
                        max="20"
                      />
                    </div>

                    <div>
                      <Input
                        label="Min Viral Score (1-10)"
                        type="number"
                        step="0.1"
                        value={settings.min_viral_score}
                        onChange={(e) =>
                          handleInputChange(
                            "min_viral_score",
                            parseFloat(e.target.value)
                          )
                        }
                        min="1"
                        max="10"
                      />
                      <p className="mt-1 text-xs text-neutral-500">
                        Only clips above this score will be created
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">
                      Active Criteria
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        "viral_hooks",
                        "emotional_peaks",
                        "value_bombs",
                        "humor_moments",
                      ].map((criterion) => (
                        <label
                          key={criterion}
                          className="flex items-center space-x-2 cursor-pointer p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50"
                        >
                          <input
                            type="checkbox"
                            checked={
                              settings.active_criteria?.includes(criterion) ||
                              false
                            }
                            onChange={() => toggleCriteria(criterion)}
                            className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm text-neutral-700 capitalize">
                            {criterion.replace("_", " ")}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Criteria Details */}
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    Criteria Details
                  </h2>
                  <p className="text-sm text-neutral-600 mt-1">
                    View what each viral analysis category looks for
                  </p>
                </CardHeader>
                <CardBody>
                  {loadingCriteria ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {[
                        "viral_hooks",
                        "emotional_peaks",
                        "value_bombs",
                        "humor_moments",
                      ].map((criterionName) => (
                        <div
                          key={criterionName}
                          className="border border-neutral-200 rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => toggleCriterionView(criterionName)}
                            className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <FiFileText className="w-5 h-5 text-primary-600" />
                              <h3 className="text-base font-semibold text-neutral-900">
                                {formatCriterionName(criterionName)}
                              </h3>
                              {settings.active_criteria?.includes(
                                criterionName
                              ) && (
                                <Badge variant="success" size="sm">
                                  Active
                                </Badge>
                              )}
                            </div>
                            {expandedCriteria[criterionName] ? (
                              <FiChevronUp className="w-5 h-5 text-neutral-500" />
                            ) : (
                              <FiChevronDown className="w-5 h-5 text-neutral-500" />
                            )}
                          </button>
                          {expandedCriteria[criterionName] &&
                            criteria[criterionName] && (
                              <div className="p-4 bg-white border-t border-neutral-200">
                                <div className="prose prose-sm max-w-none">
                                  <pre className="whitespace-pre-wrap text-sm text-neutral-700 font-sans leading-relaxed">
                                    {criteria[criterionName]}
                                  </pre>
                                </div>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          )}

          {/* Thumbnail Settings */}
          {activeTab === "thumbnails" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    Thumbnail Generation
                  </h2>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Input
                        label="Thumbnail Mode"
                        type="select"
                        value={settings.thumbnail_mode}
                        onChange={(e) =>
                          handleInputChange("thumbnail_mode", e.target.value)
                        }
                      >
                        <option value="none">None</option>
                        <option value="basic">Basic (First Frame)</option>
                        <option value="advanced">Advanced (Best Frame)</option>
                      </Input>
                    </div>

                    <div>
                      <Input
                        label="Frames to Analyze"
                        type="number"
                        value={settings.thumbnail_frames}
                        onChange={(e) =>
                          handleInputChange(
                            "thumbnail_frames",
                            parseInt(e.target.value)
                          )
                        }
                        min="4"
                        max="20"
                      />
                      <p className="mt-1 text-xs text-neutral-500">
                        More frames = better thumbnail, slower processing
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {/* YouTube Settings */}
          {activeTab === "youtube" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-neutral-900">
                      YouTube Accounts
                    </h2>
                    <Button
                      onClick={handleConnectYouTube}
                      disabled={connecting}
                      loading={connecting}
                      variant="primary"
                      size="sm"
                      icon={<FiPlus />}
                    >
                      Connect Account
                    </Button>
                  </div>
                </CardHeader>
                <CardBody>
                  {youtubeAccounts.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">
                      <p>No YouTube accounts connected.</p>
                      <p className="text-sm mt-2">
                        Connect an account to upload clips directly to YouTube.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {youtubeAccounts.map((account) => (
                        <div
                          key={account.id}
                          className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            {account.channel_thumbnail && (
                              <img
                                src={account.channel_thumbnail}
                                alt={account.channel_title || "Channel"}
                                className="w-12 h-12 rounded-full"
                              />
                            )}
                            <div>
                              <h3 className="font-medium text-neutral-900">
                                {account.channel_title || "Unknown Channel"}
                              </h3>
                              <p className="text-sm text-neutral-500">
                                Channel ID: {account.channel_id}
                              </p>
                              {account.is_verified && (
                                <Badge
                                  variant="success"
                                  size="sm"
                                  className="mt-1"
                                >
                                  Verified
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {account.is_active && (
                              <Badge variant="success" size="sm">
                                Active
                              </Badge>
                            )}
                            <Button
                              onClick={() => handleDeleteAccount(account.id)}
                              variant="ghost"
                              size="sm"
                              icon={<FiTrash2 />}
                              className="text-error-600 hover:text-error-700 hover:bg-error-50"
                            >
                              Disconnect
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    Upload Settings
                  </h2>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Input
                        label="Default Privacy"
                        type="select"
                        value={settings.default_youtube_privacy}
                        onChange={(e) =>
                          handleInputChange(
                            "default_youtube_privacy",
                            e.target.value
                          )
                        }
                      >
                        <option value="private">Private</option>
                        <option value="unlisted">Unlisted</option>
                        <option value="public">Public</option>
                      </Input>
                    </div>

                    <div>
                      <Input
                        label="Default Category"
                        type="select"
                        value={settings.default_youtube_category}
                        onChange={(e) =>
                          handleInputChange(
                            "default_youtube_category",
                            e.target.value
                          )
                        }
                      >
                        <option value="1">Film & Animation</option>
                        <option value="2">Autos & Vehicles</option>
                        <option value="10">Music</option>
                        <option value="15">Pets & Animals</option>
                        <option value="17">Sports</option>
                        <option value="19">Travel & Events</option>
                        <option value="20">Gaming</option>
                        <option value="22">People & Blogs</option>
                        <option value="23">Comedy</option>
                        <option value="24">Entertainment</option>
                        <option value="25">News & Politics</option>
                        <option value="26">Howto & Style</option>
                        <option value="27">Education</option>
                        <option value="28">Science & Technology</option>
                      </Input>
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.make_shorts}
                          onChange={(e) =>
                            handleInputChange("make_shorts", e.target.checked)
                          }
                          className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-neutral-700">
                          Upload as YouTube Shorts
                        </span>
                      </label>
                      <p className="mt-1 ml-6 text-xs text-neutral-500">
                        Clips will be formatted and tagged as YouTube Shorts
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Settings;
