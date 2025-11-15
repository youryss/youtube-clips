import React, { useState, useEffect } from 'react';
import { Clip } from '../types';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';

interface ClipPlayerModalProps {
  clip: Clip | null;
  onClose: () => void;
}

const ClipPlayerModal: React.FC<ClipPlayerModalProps> = ({ clip, onClose }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clip) return;

    const loadVideo = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const url = api.getDownloadUrl(clip.id);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to load video');
        }
        
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        setVideoUrl(blobUrl);
      } catch (error) {
        console.error('Error loading video:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVideo();

    // Cleanup blob URL on unmount or when clip changes
    return () => {
      setVideoUrl((prevUrl) => {
        if (prevUrl) {
          window.URL.revokeObjectURL(prevUrl);
        }
        return null;
      });
    };
  }, [clip]);

  if (!clip) return null;

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
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {clip.title || clip.filename}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Video Player */}
        <div className="p-4">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : videoUrl ? (
              <video
                controls
                className="w-full h-full"
                src={videoUrl}
                onError={(e) => {
                  console.error('Video playback error:', e);
                }}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <p>Failed to load video</p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
            <div>
              <span className="text-gray-500">Duration:</span>
              <span className="ml-2 font-medium">{formatDuration(clip.duration)}</span>
            </div>
            <div>
              <span className="text-gray-500">Size:</span>
              <span className="ml-2 font-medium">{formatFileSize(clip.file_size)}</span>
            </div>
            {clip.viral_score && (
              <div>
                <span className="text-gray-500">Viral Score:</span>
                <span className="ml-2 font-medium text-yellow-600">
                  {Math.round(clip.viral_score)}/10
                </span>
              </div>
            )}
            {clip.criteria_matched && clip.criteria_matched.length > 0 && (
              <div>
                <span className="text-gray-500">Criteria:</span>
                <span className="ml-2 font-medium">
                  {clip.criteria_matched.length} matched
                </span>
              </div>
            )}
          </div>

          {/* AI Reasoning */}
          {clip.reasoning && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                AI Analysis & Reasoning
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {clip.reasoning}
                </p>
              </div>
            </div>
          )}

          {/* Criteria Matched */}
          {clip.criteria_matched && clip.criteria_matched.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Matched Criteria
              </h3>
              <div className="flex flex-wrap gap-2">
                {clip.criteria_matched.map((criterion, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full"
                  >
                    {criterion.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          {(clip.start_time !== undefined || clip.end_time !== undefined) && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Video Timestamps
              </h3>
              <div className="text-sm text-gray-600">
                {clip.start_time !== undefined && (
                  <span>Start: {formatDuration(clip.start_time)}</span>
                )}
                {clip.start_time !== undefined && clip.end_time !== undefined && (
                  <span className="mx-2">•</span>
                )}
                {clip.end_time !== undefined && (
                  <span>End: {formatDuration(clip.end_time)}</span>
                )}
              </div>
            </div>
          )}

          {/* YouTube Link */}
          {clip.youtube_url && (
            <div className="mt-4 pt-4 border-t">
              <a
                href={clip.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                View on YouTube
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClipPlayerModal;

