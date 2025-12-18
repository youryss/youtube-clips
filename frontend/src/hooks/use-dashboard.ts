import * as React from "react"
import { toast } from "sonner"
import { api } from "@/services/api"
import type { Job } from "@/types"

export function useDashboard(pollInterval = 3000) {
  const [videoUrl, setVideoUrl] = React.useState("")
  const [jobs, setJobs] = React.useState<Job[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isLoadingJobs, setIsLoadingJobs] = React.useState(true)
  const [expandedJobId, setExpandedJobId] = React.useState<number | null>(null)
  const [jobLogs, setJobLogs] = React.useState<{ [key: number]: string }>({})

  const loadJobs = React.useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setIsLoadingJobs(true)
      }
      try {
        const response = await api.listJobs({ per_page: 10 })
        setJobs(response.jobs)
      } catch (error) {
        console.error("Failed to load jobs:", error)
      } finally {
        if (showLoading) {
          setIsLoadingJobs(false)
        }
      }
    },
    [],
  )

  React.useEffect(() => {
    loadJobs(true)

    const interval = setInterval(() => {
      loadJobs(false)
    }, pollInterval)

    return () => clearInterval(interval)
  }, [loadJobs, pollInterval])

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!videoUrl.trim()) return

      setIsSubmitting(true)
      try {
        await api.createJob(videoUrl)
        toast.success("Job created! Processing started.")
        setVideoUrl("")
        loadJobs(false)
      } catch (error: unknown) {
        const errorMessage =
          (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          "Failed to create job"
        toast.error(errorMessage)
      } finally {
        setIsSubmitting(false)
      }
    },
    [videoUrl, loadJobs],
  )

  const handleDeleteJob = React.useCallback(
    async (jobId: number) => {
      if (
        !window.confirm("Are you sure you want to delete this job and all its clips?")
      ) {
        return
      }

      try {
        await api.deleteJob(jobId)
        toast.success("Job deleted successfully")
        loadJobs(false)
      } catch (error: unknown) {
        const errorMessage =
          (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          "Failed to delete job"
        toast.error(errorMessage)
      }
    },
    [loadJobs],
  )

  const handleRetryJob = React.useCallback(
    async (jobId: number) => {
      try {
        const job = jobs.find((j) => j.id === jobId)
        if (!job) return

        await api.deleteJob(jobId)
        await api.createJob(job.video_url)
        toast.success("Job restarted!")
        loadJobs(false)
      } catch (error: unknown) {
        const errorMessage =
          (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          "Failed to retry job"
        toast.error(errorMessage)
      }
    },
    [jobs, loadJobs],
  )

  const handleCancelJob = React.useCallback(
    async (jobId: number) => {
      try {
        await api.cancelJob(jobId)
        toast.success("Job cancelled")
        loadJobs(false)
      } catch (error: unknown) {
        const errorMessage =
          (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          "Failed to cancel job"
        toast.error(errorMessage)
      }
    },
    [loadJobs],
  )

  const handleViewLogs = React.useCallback(
    async (jobId: number) => {
      if (expandedJobId === jobId) {
        setExpandedJobId(null)
        return
      }

      try {
        const logs = await api.getJobLogs(jobId)
        setJobLogs((prev) => ({ ...prev, [jobId]: JSON.stringify(logs, null, 2) }))
        setExpandedJobId(jobId)
      } catch (error: unknown) {
        const errorMessage =
          (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          "Failed to get logs"
        toast.error(errorMessage)
      }
    },
    [expandedJobId],
  )

  const totalClips = jobs.reduce(
    (sum, job) => sum + (job.clips_created || 0),
    0,
  )
  const activeJobs = jobs.filter((j) =>
    ["downloading", "transcribing", "analyzing", "slicing"].includes(j.status),
  ).length
  const completedJobs = jobs.filter((j) => j.status === "completed").length
  const successRate =
    jobs.length > 0 ? Math.round((completedJobs / jobs.length) * 100) : 0

  return {
    videoUrl,
    setVideoUrl,
    jobs,
    isSubmitting,
    isLoadingJobs,
    expandedJobId,
    jobLogs,
    handleSubmit,
    handleDeleteJob,
    handleRetryJob,
    handleCancelJob,
    handleViewLogs,
    metrics: {
      totalClips,
      activeJobs,
      completedJobs,
      successRate,
    },
  }
}


