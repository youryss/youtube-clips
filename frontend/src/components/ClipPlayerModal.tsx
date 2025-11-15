import React, { useState, useEffect } from 'react';
import { Clip } from '../types';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import Modal from './ui/Modal';
import Badge from './ui/Badge';
import { FiCheckCircle } from 'react-icons/fi';

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

    return () => {
      if (videoUrl) {
        window.URL.revokeObjectURL(videoUrl);
      }
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
    <Modal
      isOpen={!!clip}
      onClose={onClose}
      title={clip.title || clip.filename}
      size="xl"
    >
      <div className="space-y-6">
        {/* Video Player */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <LoadingSpinner size="lg" variant="white" />
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

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-neutral-50 rounded-lg">
            <p className="text-xs text-neutral-500 mb-1">Duration</p>
            <p className="text-sm font-semibold text-neutral-900">{formatDuration(clip.duration)}</p>
          </div>
          <div className="p-3 bg-neutral-50 rounded-lg">
            <p className="text-xs text-neutral-500 mb-1">File Size</p>
            <p className="text-sm font-semibold text-neutral-900">{formatFileSize(clip.file_size)}</p>
          </div>
          {clip.viral_score && (
            <div className="p-3 bg-neutral-50 rounded-lg">
              <p className="text-xs text-neutral-500 mb-1">Viral Score</p>
              <Badge variant="viral" size="sm" className="mt-1">
                {Math.round(clip.viral_score)}/10
              </Badge>
            </div>
          )}
          {clip.criteria_matched && clip.criteria_matched.length > 0 && (
            <div className="p-3 bg-neutral-50 rounded-lg">
              <p className="text-xs text-neutral-500 mb-1">Criteria</p>
              <p className="text-sm font-semibold text-neutral-900">
                {clip.criteria_matched.length} matched
              </p>
            </div>
          )}
        </div>

        {/* AI Reasoning */}
        {clip.reasoning && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-2">
              AI Analysis & Reasoning
            </h3>
            <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                {clip.reasoning}
              </p>
            </div>
          </div>
        )}

        {/* Criteria Matched */}
        {clip.criteria_matched && clip.criteria_matched.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-2">
              Matched Criteria
            </h3>
            <div className="flex flex-wrap gap-2">
              {clip.criteria_matched.map((criterion, idx) => (
                <Badge
                  key={idx}
                  variant="success"
                  size="sm"
                >
                  {criterion.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        {(clip.start_time !== undefined || clip.end_time !== undefined) && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-2">
              Video Timestamps
            </h3>
            <div className="text-sm text-neutral-600">
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
          <div className="pt-4 border-t border-neutral-200">
            <a
              href={clip.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-error-600 hover:text-error-700 font-medium"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              View on YouTube
            </a>
          </div>
        )}

        {/* Upload Status */}
        {clip.is_uploaded && (
          <div className="pt-4 border-t border-neutral-200">
            <Badge variant="success" size="md" icon={<FiCheckCircle />}>
              Uploaded to YouTube
            </Badge>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ClipPlayerModal;
