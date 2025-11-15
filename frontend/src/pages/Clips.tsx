import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Clip } from '../types';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import ClipPlayerModal from '../components/ClipPlayerModal';

const Clips: React.FC = () => {
  const [clips, setClips] = useState<Clip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState<number | null>(null);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);

  useEffect(() => {
    loadClips();
  }, []);

  const loadClips = async () => {
    setIsLoading(true);
    try {
      const response = await api.listClips({ per_page: 50 });
      setClips(response.clips);
    } catch (error) {
      console.error('Failed to load clips:', error);
      toast.error('Failed to load clips');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (clip: Clip) => {
    try {
      const token = localStorage.getItem('access_token');
      const url = api.getDownloadUrl(clip.id);
      
      // Create a temporary link with authentication
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', clip.filename);
      
      // Fetch with auth header and create blob URL
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download clip');
    }
  };

  const handleUpload = async (clip: Clip) => {
    if (clip.is_uploaded) {
      toast('Clip already uploaded to YouTube', { icon: 'ℹ️' });
      return;
    }

    setUploading(clip.id);
    try {
      const result = await api.uploadClipToYouTube(clip.id, {
        title: clip.title,
        description: `Generated viral clip: ${clip.title || clip.filename}`,
        make_shorts: true
      });
      
      toast.success('Upload started! Video is being processed by YouTube.');
      loadClips();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to upload clip';
      toast.error(errorMsg);
      
      // If no account, suggest connecting one
      if (errorMsg.includes('No active YouTube account')) {
        setTimeout(() => {
          if (window.confirm('Would you like to connect a YouTube account now?')) {
            window.location.href = '/settings';
          }
        }, 2000);
      }
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (clipId: number) => {
    if (!window.confirm('Are you sure you want to delete this clip?')) {
      return;
    }

    try {
      await api.deleteClip(clipId);
      toast.success('Clip deleted');
      loadClips();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete clip');
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Generated Clips</h1>
          <button
            onClick={loadClips}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : clips.length === 0 ? (
          <div className="bg-white shadow sm:rounded-lg p-6">
            <p className="text-gray-600 text-center py-8">
              No clips generated yet. Create a job to generate viral clips!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {clips.map((clip) => (
              <div
                key={clip.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Thumbnail */}
                <div
                  className="relative aspect-video bg-gray-200 cursor-pointer group"
                  onClick={() => setSelectedClip(clip)}
                >
                  {clip.thumbnail_path ? (
                    <img
                      src={api.getThumbnailUrl(clip.id)}
                      alt={clip.title || 'Clip thumbnail'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <svg
                        className="w-12 h-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all">
                    <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg
                        className="w-8 h-8 text-gray-900 ml-1"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Viral Score Badge */}
                  {clip.viral_score && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                      <span>Viral</span>
                      <span>{Math.round(clip.viral_score)}%</span>
                    </div>
                  )}
                </div>

                {/* Clip Info */}
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {clip.title || clip.filename}
                  </h3>
                  
                  <div className="space-y-1 text-sm text-gray-500 mb-4">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">{formatDuration(clip.duration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="font-medium">{formatFileSize(clip.file_size)}</span>
                    </div>
                    {clip.is_uploaded && (
                      <div className="flex items-center gap-1 text-green-600">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-xs">Uploaded</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(clip)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download
                    </button>
                    <button
                      onClick={() => handleUpload(clip)}
                      disabled={uploading === clip.id || clip.is_uploaded}
                      className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                    >
                      {uploading === clip.id ? (
                        <LoadingSpinner size="sm" />
                      ) : clip.is_uploaded ? (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Uploaded
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                          </svg>
                          Upload
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(clip.id)}
                      className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800"
                      title="Delete clip"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Video Player Modal */}
      <ClipPlayerModal
        clip={selectedClip}
        onClose={() => setSelectedClip(null)}
      />
    </div>
  );
};

export default Clips;
