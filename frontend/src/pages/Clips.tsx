import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Clip } from '../types';
import toast from 'react-hot-toast';
import { FiRefreshCw, FiDownload, FiUpload, FiTrash2, FiGrid, FiList, FiSearch, FiCheckCircle } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import ClipPlayerModal from '../components/ClipPlayerModal';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

const Clips: React.FC = () => {
  const [clips, setClips] = useState<Clip[]>([]);
  const [filteredClips, setFilteredClips] = useState<Clip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState<number | null>(null);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadClips();
  }, []);

  useEffect(() => {
    filterClips();
  }, [searchQuery, clips]);

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

  const filterClips = () => {
    if (!searchQuery.trim()) {
      setFilteredClips(clips);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = clips.filter(
      (clip) =>
        clip.title?.toLowerCase().includes(query) ||
        clip.filename?.toLowerCase().includes(query) ||
        clip.criteria_matched?.some((c) => c.toLowerCase().includes(query))
    );
    setFilteredClips(filtered);
  };

  const handleDownload = async (clip: Clip) => {
    try {
      const token = localStorage.getItem('access_token');
      const url = api.getDownloadUrl(clip.id);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', clip.filename);
      
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
      await api.uploadClipToYouTube(clip.id, {
        title: clip.title,
        description: `Generated viral clip: ${clip.title || clip.filename}`,
        make_shorts: true
      });
      
      toast.success('Upload started! Video is being processed by YouTube.');
      loadClips();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to upload clip';
      toast.error(errorMsg);
      
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Generated Clips</h1>
          <p className="text-neutral-600 mt-1">View and manage your viral clips</p>
        </div>
        <Button
          onClick={loadClips}
          variant="outline"
          icon={<FiRefreshCw />}
        >
          Refresh
        </Button>
      </div>

      {/* Filters and View Toggle */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clips by title, filename, or criteria..."
              variant="search"
              leftIcon={<FiSearch className="w-5 h-5" />}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setViewMode('grid')}
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              icon={<FiGrid />}
            >
              Grid
            </Button>
            <Button
              onClick={() => setViewMode('list')}
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              size="sm"
              icon={<FiList />}
            >
              List
            </Button>
          </div>
        </div>
      </Card>

      {/* Clips Display */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : filteredClips.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FiGrid className="w-full h-full" />}
            title={searchQuery ? "No clips found" : "No clips generated yet"}
            description={searchQuery ? "Try adjusting your search query" : "Create a job to generate viral clips!"}
            action={!searchQuery ? {
              label: "Go to Dashboard",
              onClick: () => window.location.href = '/dashboard'
            } : undefined}
          />
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredClips.map((clip) => (
            <Card key={clip.id} hover className="overflow-hidden">
              {/* Thumbnail */}
              <div
                className="relative aspect-video bg-neutral-200 cursor-pointer group"
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
                  <div className="w-full h-full flex items-center justify-center bg-neutral-100">
                    <svg
                      className="w-12 h-12 text-neutral-400"
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
                      className="w-8 h-8 text-neutral-900 ml-1"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                
                {/* Viral Score Badge */}
                {clip.viral_score && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="viral" size="sm">
                      {Math.round(clip.viral_score)}%
                    </Badge>
                  </div>
                )}

                {/* Uploaded Badge */}
                {clip.is_uploaded && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="success" size="sm" icon={<FiCheckCircle />}>
                      Uploaded
                    </Badge>
                  </div>
                )}
              </div>

              {/* Clip Info */}
              <div className="p-4">
                <h3 className="font-semibold text-neutral-900 mb-2 line-clamp-2 min-h-[3rem]">
                  {clip.title || clip.filename}
                </h3>
                
                <div className="space-y-1 text-sm text-neutral-500 mb-4">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium text-neutral-700">{formatDuration(clip.duration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span className="font-medium text-neutral-700">{formatFileSize(clip.file_size)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownload(clip)}
                    variant="outline"
                    size="sm"
                    icon={<FiDownload />}
                    className="flex-1"
                  >
                    Download
                  </Button>
                  <Button
                    onClick={() => handleUpload(clip)}
                    disabled={uploading === clip.id || clip.is_uploaded}
                    variant="danger"
                    size="sm"
                    icon={<FiUpload />}
                    loading={uploading === clip.id}
                    className="flex-1"
                  >
                    {clip.is_uploaded ? 'Uploaded' : 'Upload'}
                  </Button>
                  <Button
                    onClick={() => handleDelete(clip.id)}
                    variant="ghost"
                    size="sm"
                    icon={<FiTrash2 />}
                    className="text-error-600 hover:text-error-700 hover:bg-error-50"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClips.map((clip) => (
            <Card key={clip.id} hover>
              <div className="flex gap-4">
                {/* Thumbnail */}
                <div
                  className="relative w-32 h-20 bg-neutral-200 rounded-lg cursor-pointer group flex-shrink-0"
                  onClick={() => setSelectedClip(clip)}
                >
                  {clip.thumbnail_path ? (
                    <img
                      src={api.getThumbnailUrl(clip.id)}
                      alt={clip.title || 'Clip thumbnail'}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-100 rounded-lg">
                      <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-semibold text-neutral-900 truncate">
                      {clip.title || clip.filename}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {clip.viral_score && (
                        <Badge variant="viral" size="sm">
                          {Math.round(clip.viral_score)}%
                        </Badge>
                      )}
                      {clip.is_uploaded && (
                        <Badge variant="success" size="sm" icon={<FiCheckCircle />}>
                          Uploaded
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-neutral-600 mb-3">
                    <span>Duration: <span className="font-medium text-neutral-700">{formatDuration(clip.duration)}</span></span>
                    <span>Size: <span className="font-medium text-neutral-700">{formatFileSize(clip.file_size)}</span></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleDownload(clip)}
                      variant="outline"
                      size="sm"
                      icon={<FiDownload />}
                    >
                      Download
                    </Button>
                    <Button
                      onClick={() => handleUpload(clip)}
                      disabled={uploading === clip.id || clip.is_uploaded}
                      variant="danger"
                      size="sm"
                      icon={<FiUpload />}
                      loading={uploading === clip.id}
                    >
                      {clip.is_uploaded ? 'Uploaded' : 'Upload'}
                    </Button>
                    <Button
                      onClick={() => handleDelete(clip.id)}
                      variant="ghost"
                      size="sm"
                      icon={<FiTrash2 />}
                      className="text-error-600 hover:text-error-700 hover:bg-error-50"
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Video Player Modal */}
      <ClipPlayerModal
        clip={selectedClip}
        onClose={() => setSelectedClip(null)}
      />
    </div>
  );
};

export default Clips;
