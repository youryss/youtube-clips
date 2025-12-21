import * as React from "react"
import { toast } from "sonner"
import { api } from "@/services/api"
import type { Clip } from "@/types"

// Union types must remain as type aliases since interfaces cannot represent unions
type ViewMode = "grid" | "list"

export function useClips(pollInterval?: number) {
  const [clips, setClips] = React.useState<Clip[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [uploading, setUploading] = React.useState<number | null>(null)
  const [selectedClip, setSelectedClip] = React.useState<Clip | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid")

  const loadClips = React.useCallback(
    async (force = false) => {
      if (!force && !clips.length) {
        // initial load will continue
      }
      setIsLoading(true)
      try {
        const response = await api.listClips({ per_page: 50 })
        setClips(response.clips)
      } catch (error) {
        console.error("Failed to load clips:", error)
        toast.error("Failed to load clips")
      } finally {
        setIsLoading(false)
      }
    },
    [clips.length],
  )

  React.useEffect(() => {
    loadClips()
  }, [loadClips])

  React.useEffect(() => {
    if (!pollInterval) return
    const id = setInterval(() => {
      loadClips(true)
    }, pollInterval)
    return () => clearInterval(id)
  }, [pollInterval, loadClips])

  const filteredClips = React.useMemo(() => {
    if (!searchQuery.trim()) return clips
    const query = searchQuery.toLowerCase()
    return clips.filter(
      (clip) =>
        clip.title?.toLowerCase().includes(query) ||
        clip.filename?.toLowerCase().includes(query) ||
        clip.criteria_matched?.some((c) => c.toLowerCase().includes(query)),
    )
  }, [clips, searchQuery])

  const handleDownload = React.useCallback(async (clip: Clip) => {
    try {
      const token = localStorage.getItem("access_token")
      const url = api.getDownloadUrl(clip.id)

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Download failed")
      }

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.setAttribute("download", clip.filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)

      toast.success("Download started")
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Failed to download clip")
    }
  }, [])

  const handleUpload = React.useCallback(
    async (clip: Clip) => {
      if (clip.is_uploaded) {
        toast.info("Clip already uploaded to YouTube")
        return
      }

      setUploading(clip.id)
      try {
        await api.uploadClipToYouTube(clip.id, {
          title: clip.title,
          description: `Generated viral clip: ${clip.title || clip.filename}`,
          make_shorts: true,
        })

        toast.success("Upload started! Video is being processed by YouTube.")
        loadClips(true)
      } catch (error: unknown) {
        const errorMsg =
          (error as { response?: { data?: { error?: string; message?: string } } })?.response?.data
            ?.error ||
          (error as { response?: { data?: { error?: string; message?: string } } })?.response?.data
            ?.message ||
          "Failed to upload clip"
        toast.error(errorMsg)
      } finally {
        setUploading(null)
      }
    },
    [loadClips],
  )

  const handleDelete = React.useCallback(
    async (clipId: number) => {
      if (!window.confirm("Are you sure you want to delete this clip?")) {
        return
      }

      try {
        await api.deleteClip(clipId)
        toast.success("Clip deleted")
        loadClips(true)
      } catch (error: unknown) {
        const errorMessage =
          (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          "Failed to delete clip"
        toast.error(errorMessage)
      }
    },
    [loadClips],
  )

  const formatDuration = React.useCallback((seconds?: number) => {
    if (!seconds) return "N/A"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }, [])

  const formatFileSize = React.useCallback((bytes?: number) => {
    if (!bytes) return "N/A"
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }, [])

  return {
    clips,
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
  }
}


