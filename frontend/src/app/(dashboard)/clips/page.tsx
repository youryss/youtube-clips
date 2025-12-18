"use client";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipPlayerModal } from "@/components/clip-player-modal";
import { useClips } from "@/hooks/use-clips";
import { ClipsHeader } from "@/components/clips/clips-header";
import { ClipsFilters } from "@/components/clips/clips-filters";
import { ClipCardGrid } from "@/components/clips/clip-card-grid";
import { ClipCardList } from "@/components/clips/clip-card-list";

export default function ClipsPage() {
  const {
    filteredClips,
    isLoading,
    uploading,
    selectedClip,
    setSelectedClip,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    loadClips,
    handleDownload,
    handleUpload,
    handleDelete,
    formatDuration,
    formatFileSize,
  } = useClips();

  return (
    <div className="space-y-6">
      <ClipsHeader onRefresh={() => loadClips(true)} />

      <ClipsFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Clips Display */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : filteredClips.length === 0 ? (
        <EmptyState
          icon={null}
          title={searchQuery ? "No clips found" : "No clips generated yet"}
          description={
            searchQuery
              ? "Try adjusting your search query"
              : "Create a job to generate viral clips!"
          }
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredClips.map((clip) => (
            <ClipCardGrid
              key={clip.id}
              clip={clip}
              uploadingId={uploading}
              onSelect={() => setSelectedClip(clip)}
              onDownload={() => handleDownload(clip)}
              onUpload={() => handleUpload(clip)}
              onDelete={() => handleDelete(clip.id)}
              formatDuration={formatDuration}
              formatFileSize={formatFileSize}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClips.map((clip) => (
            <ClipCardList
              key={clip.id}
              clip={clip}
              uploadingId={uploading}
              onSelect={() => setSelectedClip(clip)}
              onDownload={() => handleDownload(clip)}
              onUpload={() => handleUpload(clip)}
              onDelete={() => handleDelete(clip.id)}
              formatDuration={formatDuration}
              formatFileSize={formatFileSize}
            />
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
}
