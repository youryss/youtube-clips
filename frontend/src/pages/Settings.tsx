import React, { useState, useEffect } from 'react';
import { Settings as SettingsType, YouTubeAccount } from '../types';
import api from '../services/api';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [youtubeAccounts, setYoutubeAccounts] = useState<YouTubeAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadSettings();
    loadYouTubeAccounts();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.getSettings();
      setSettings(response.settings);
    } catch (error: any) {
      showNotification('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const loadYouTubeAccounts = async () => {
    try {
      const response = await api.listYouTubeAccounts();
      setYoutubeAccounts(response.accounts);
    } catch (error) {
      console.error('Failed to load YouTube accounts:', error);
    }
  };

  const handleConnectYouTube = async () => {
    setConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/youtube/callback`;
      const { authorization_url } = await api.getYouTubeAuthUrl(redirectUri);
      
      // Store state in sessionStorage for callback
      sessionStorage.setItem('youtube_oauth_redirect', redirectUri);
      
      // Open OAuth window
      window.location.href = authorization_url;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to connect YouTube account');
    } finally {
      setConnecting(false);
    }
  };

  const handleDeleteAccount = async (accountId: number) => {
    if (!window.confirm('Are you sure you want to disconnect this YouTube account?')) {
      return;
    }

    try {
      await api.deleteYouTubeAccount(accountId);
      toast.success('YouTube account disconnected');
      loadYouTubeAccounts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to disconnect account');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await api.updateSettings(settings);
      showNotification('success', 'Settings saved successfully!');
    } catch (error: any) {
      showNotification('error', error.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof SettingsType, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const toggleCriteria = (criterion: string) => {
    if (!settings) return;
    const criteria = settings.active_criteria || [];
    const newCriteria = criteria.includes(criterion)
      ? criteria.filter(c => c !== criterion)
      : [...criteria, criterion];
    setSettings({ ...settings, active_criteria: newCriteria });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-800">Failed to load settings</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`mb-6 p-4 rounded-md ${
              notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            <p className="font-medium">{notification.message}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Whisper Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Transcription Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Whisper Model
                </label>
                <select
                  value={settings.whisper_model}
                  onChange={(e) => handleInputChange('whisper_model', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="tiny">Tiny (Fastest, Less Accurate)</option>
                  <option value="base">Base</option>
                  <option value="small">Small (Balanced)</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large (Slowest, Most Accurate)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">Larger models are more accurate but slower</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device
                </label>
                <select
                  value={settings.whisper_device}
                  onChange={(e) => handleInputChange('whisper_device', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="auto">Auto</option>
                  <option value="cpu">CPU</option>
                  <option value="cuda">CUDA (GPU)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compute Type
                </label>
                <select
                  value={settings.whisper_compute_type}
                  onChange={(e) => handleInputChange('whisper_compute_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="int8">INT8 (Fast, Less Memory)</option>
                  <option value="float16">Float16</option>
                  <option value="float32">Float32 (Accurate, More Memory)</option>
                </select>
              </div>
            </div>
          </div>

          {/* AI Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Analysis Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAI Model
                </label>
                <select
                  value={settings.openai_model}
                  onChange={(e) => handleInputChange('openai_model', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Quality
                </label>
                <select
                  value={settings.video_quality}
                  onChange={(e) => handleInputChange('video_quality', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="720p">720p</option>
                  <option value="1080p">1080p (Recommended)</option>
                  <option value="1440p">1440p</option>
                  <option value="2160p">4K (2160p)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Clip Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Clip Generation Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Clip Duration (seconds)
                </label>
                <input
                  type="number"
                  value={settings.min_clip_duration}
                  onChange={(e) => handleInputChange('min_clip_duration', parseInt(e.target.value))}
                  min="5"
                  max="60"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Clip Duration (seconds)
                </label>
                <input
                  type="number"
                  value={settings.max_clip_duration}
                  onChange={(e) => handleInputChange('max_clip_duration', parseInt(e.target.value))}
                  min="10"
                  max="180"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Padding Before (seconds)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.clip_padding_before}
                  onChange={(e) => handleInputChange('clip_padding_before', parseFloat(e.target.value))}
                  min="0"
                  max="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Extra time before the clip starts</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Padding After (seconds)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.clip_padding_after}
                  onChange={(e) => handleInputChange('clip_padding_after', parseFloat(e.target.value))}
                  min="0"
                  max="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Extra time after the clip ends</p>
              </div>
            </div>
          </div>

          {/* Viral Analysis Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Viral Analysis Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Clips Per Video
                </label>
                <input
                  type="number"
                  value={settings.max_clips_per_video}
                  onChange={(e) => handleInputChange('max_clips_per_video', parseInt(e.target.value))}
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Viral Score (1-10)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.min_viral_score}
                  onChange={(e) => handleInputChange('min_viral_score', parseFloat(e.target.value))}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Only clips above this score will be created</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Active Criteria
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['viral_hooks', 'emotional_peaks', 'value_bombs', 'humor_moments'].map((criterion) => (
                  <label key={criterion} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.active_criteria?.includes(criterion) || false}
                      onChange={() => toggleCriteria(criterion)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {criterion.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Thumbnail Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Thumbnail Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thumbnail Mode
                </label>
                <select
                  value={settings.thumbnail_mode}
                  onChange={(e) => handleInputChange('thumbnail_mode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">None</option>
                  <option value="basic">Basic (First Frame)</option>
                  <option value="advanced">Advanced (Best Frame)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frames to Analyze
                </label>
                <input
                  type="number"
                  value={settings.thumbnail_frames}
                  onChange={(e) => handleInputChange('thumbnail_frames', parseInt(e.target.value))}
                  min="4"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">More frames = better thumbnail, slower processing</p>
              </div>
            </div>
          </div>

          {/* YouTube Accounts */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">YouTube Accounts</h2>
              <button
                onClick={handleConnectYouTube}
                disabled={connecting}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {connecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                    </svg>
                    Connect YouTube Account
                  </>
                )}
              </button>
            </div>

            {youtubeAccounts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No YouTube accounts connected.</p>
                <p className="text-sm mt-2">Connect an account to upload clips directly to YouTube.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {youtubeAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      {account.channel_thumbnail && (
                        <img
                          src={account.channel_thumbnail}
                          alt={account.channel_title || 'Channel'}
                          className="w-12 h-12 rounded-full"
                        />
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {account.channel_title || 'Unknown Channel'}
                        </h3>
                        <p className="text-sm text-gray-500">Channel ID: {account.channel_id}</p>
                        {account.is_verified && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {account.is_active && (
                        <span className="text-sm text-green-600 font-medium">Active</span>
                      )}
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* YouTube Upload Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">YouTube Upload Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Privacy
                </label>
                <select
                  value={settings.default_youtube_privacy}
                  onChange={(e) => handleInputChange('default_youtube_privacy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="private">Private</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="public">Public</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Category
                </label>
                <select
                  value={settings.default_youtube_category}
                  onChange={(e) => handleInputChange('default_youtube_category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.make_shorts}
                    onChange={(e) => handleInputChange('make_shorts', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Upload as YouTube Shorts
                  </span>
                </label>
                <p className="mt-1 ml-6 text-xs text-gray-500">
                  Clips will be formatted and tagged as YouTube Shorts
                </p>
              </div>
            </div>
          </div>

          {/* Save Button (Bottom) */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                'Save All Settings'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

