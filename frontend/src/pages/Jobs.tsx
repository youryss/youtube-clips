import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Job } from "../types";
import toast from "react-hot-toast";
import {
  FiSearch,
  FiRefreshCw,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiList,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiPlay,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiFileText,
} from "react-icons/fi";
import LoadingSpinner from "../components/LoadingSpinner";
import Card, { CardBody, CardFooter } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import StatusIndicator from "../components/ui/StatusIndicator";
import ProgressBar from "../components/ui/ProgressBar";
import EmptyState from "../components/ui/EmptyState";
import Badge from "../components/ui/Badge";

const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [jobLogs, setJobLogs] = useState<{ [key: number]: string }>({});
  const [jobTranscripts, setJobTranscripts] = useState<{
    [key: number]: string;
  }>({});
  const [sortBy, setSortBy] = useState<"date" | "status" | "clips">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const itemsPerPage = 10;

  useEffect(() => {
    loadJobs();
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      loadJobs(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterAndSortJobs();
  }, [searchQuery, statusFilter, jobs, sortBy, sortOrder]);

  const loadJobs = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      const response = await api.listJobs({ per_page: 100 });
      setJobs(response.jobs);
    } catch (error) {
      console.error("Failed to load jobs:", error);
      if (showLoading) {
        toast.error("Failed to load jobs");
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const filterAndSortJobs = () => {
    let filtered = [...jobs];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.video_title?.toLowerCase().includes(query) ||
          job.video_url?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "processing") {
        filtered = filtered.filter((j) =>
          ["downloading", "transcribing", "analyzing", "slicing"].includes(
            j.status
          )
        );
      } else {
        filtered = filtered.filter((job) => job.status === statusFilter);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "date":
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "clips":
          comparison = (a.clips_created || 0) - (b.clips_created || 0);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    setFilteredJobs(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleDeleteJob = async (jobId: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this job and all its clips?"
      )
    ) {
      return;
    }

    try {
      await api.deleteJob(jobId);
      toast.success("Job deleted successfully");
      loadJobs();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete job");
    }
  };

  const handleRetryJob = async (jobId: number) => {
    try {
      const job = jobs.find((j) => j.id === jobId);
      if (!job) return;

      await api.deleteJob(jobId);
      await api.createJob(job.video_url);
      toast.success("Job restarted!");
      loadJobs();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to retry job");
    }
  };

  const handleCancelJob = async (jobId: number) => {
    try {
      await api.cancelJob(jobId);
      toast.success("Job cancelled");
      loadJobs();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to cancel job");
    }
  };

  const handleViewLogs = async (jobId: number) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
      return;
    }

    try {
      const logs = await api.getJobLogs(jobId);
      setJobLogs({ ...jobLogs, [jobId]: JSON.stringify(logs, null, 2) });
      setExpandedJobId(jobId);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to get logs");
    }
  };

  const handleViewTranscript = async (jobId: number) => {
    // If transcript already loaded, just toggle
    if (jobTranscripts[jobId]) {
      if (expandedJobId === jobId) {
        setExpandedJobId(null);
      } else {
        setExpandedJobId(jobId);
      }
      return;
    }

    try {
      const response = await api.getJobTranscript(jobId);
      setJobTranscripts({ ...jobTranscripts, [jobId]: response.transcript });
      setExpandedJobId(jobId);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load transcript");
    }
  };

  const statusTabs = [
    { value: "all", label: "All", icon: FiList },
    { value: "completed", label: "Completed", icon: FiCheckCircle },
    { value: "processing", label: "Processing", icon: FiPlay },
    { value: "failed", label: "Failed", icon: FiXCircle },
    { value: "pending", label: "Pending", icon: FiClock },
  ];

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

  const getStatusCount = (status: string) => {
    if (status === "all") return jobs.length;
    if (status === "processing") {
      return jobs.filter((j) =>
        ["downloading", "transcribing", "analyzing", "slicing"].includes(
          j.status
        )
      ).length;
    }
    return jobs.filter((j) => j.status === status).length;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">All Jobs</h1>
          <p className="text-neutral-600 mt-1">
            View and manage all your video processing jobs
          </p>
        </div>
        <Button
          onClick={() => loadJobs(true)}
          variant="outline"
          icon={<FiRefreshCw />}
        >
          Refresh
        </Button>
      </div>

      {/* Filters and Controls */}
      <Card>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs by title or URL..."
                variant="search"
                leftIcon={<FiSearch className="w-5 h-5" />}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setViewMode("grid")}
                variant={viewMode === "grid" ? "primary" : "outline"}
                size="sm"
                icon={<FiGrid />}
              >
                Grid
              </Button>
              <Button
                onClick={() => setViewMode("list")}
                variant={viewMode === "list" ? "primary" : "outline"}
                size="sm"
                icon={<FiList />}
              >
                List
              </Button>
            </div>
          </div>

          {/* Status Tabs and Sort */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full sm:w-auto">
              {statusTabs.map((tab) => {
                const count = getStatusCount(tab.value);
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                      transition-colors duration-base
                      ${
                        statusFilter === tab.value
                          ? "bg-primary-600 text-white"
                          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "date" | "status" | "clips")
                }
                className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="date">Date</option>
                <option value="status">Status</option>
                <option value="clips">Clips</option>
              </select>
              <Button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                variant="outline"
                size="sm"
                icon={sortOrder === "asc" ? <FiChevronUp /> : <FiChevronDown />}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Jobs Display */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : paginatedJobs.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FiList className="w-full h-full" />}
            title={
              searchQuery || statusFilter !== "all"
                ? "No jobs found"
                : "No jobs yet"
            }
            description={
              searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Create a job from the dashboard to get started!"
            }
            action={
              !searchQuery && statusFilter === "all"
                ? {
                    label: "Go to Dashboard",
                    onClick: () => (window.location.href = "/dashboard"),
                  }
                : undefined
            }
          />
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paginatedJobs.map((job) => (
            <Card key={job.id} hover>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0 w-32 h-20 bg-neutral-200 rounded-lg overflow-hidden">
                      {job.thumbnail_url ? (
                        <img
                          src={job.thumbnail_url}
                          alt={job.video_title || "Video thumbnail"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to clip thumbnail if YouTube thumbnail fails
                            if (job.thumbnail_clip_id) {
                              (e.target as HTMLImageElement).src =
                                api.getThumbnailUrl(job.thumbnail_clip_id);
                            } else {
                              // Show placeholder if all thumbnails fail
                              (e.target as HTMLImageElement).style.display =
                                "none";
                              const parent = (e.target as HTMLImageElement)
                                .parentElement;
                              if (
                                parent &&
                                !parent.querySelector(".thumbnail-placeholder")
                              ) {
                                const placeholder =
                                  document.createElement("div");
                                placeholder.className =
                                  "thumbnail-placeholder w-full h-full flex items-center justify-center bg-neutral-100";
                                placeholder.innerHTML =
                                  '<svg class="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>';
                                parent.appendChild(placeholder);
                              }
                            }
                          }}
                        />
                      ) : job.thumbnail_clip_id ? (
                        <img
                          src={api.getThumbnailUrl(job.thumbnail_clip_id)}
                          alt={job.video_title || "Video thumbnail"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                            const parent = (e.target as HTMLImageElement)
                              .parentElement;
                            if (
                              parent &&
                              !parent.querySelector(".thumbnail-placeholder")
                            ) {
                              const placeholder = document.createElement("div");
                              placeholder.className =
                                "thumbnail-placeholder w-full h-full flex items-center justify-center bg-neutral-100";
                              placeholder.innerHTML =
                                '<svg class="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>';
                              parent.appendChild(placeholder);
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-100">
                          <svg
                            className="w-8 h-8 text-neutral-400"
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
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900 truncate mb-2">
                        {job.video_title || job.video_url}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusIndicator status={job.status} />
                        <Badge variant="neutral" size="sm">
                          {job.clips_created || 0} clips
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {job.progress > 0 && job.status !== "completed" && (
                    <ProgressBar
                      value={job.progress}
                      variant={
                        job.status === "failed"
                          ? "error"
                          : [
                              "downloading",
                              "transcribing",
                              "analyzing",
                              "slicing",
                            ].includes(job.status)
                          ? "primary"
                          : "warning"
                      }
                      label={job.current_step}
                      showLabel
                      size="sm"
                    />
                  )}

                  {job.error_message && (
                    <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <FiAlertCircle className="w-4 h-4 text-error-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-error-600 line-clamp-2">
                          {job.error_message}
                        </p>
                      </div>
                    </div>
                  )}

                  {expandedJobId === job.id && jobLogs[job.id] && (
                    <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                      <p className="text-xs font-medium text-neutral-700 mb-2">
                        Job Details:
                      </p>
                      <pre className="text-xs text-neutral-600 overflow-x-auto whitespace-pre-wrap break-words font-mono max-h-32 overflow-y-auto">
                        {jobLogs[job.id]}
                      </pre>
                    </div>
                  )}

                  {expandedJobId === job.id && jobTranscripts[job.id] && (
                    <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                      <h4 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                        <FiFileText className="w-4 h-4" />
                        Full Transcription
                      </h4>
                      <div className="text-sm text-neutral-700 whitespace-pre-wrap break-words max-h-64 overflow-y-auto leading-relaxed">
                        {jobTranscripts[job.id]}
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
              <CardFooter>
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs text-neutral-500">
                    {new Date(job.created_at).toLocaleString()}
                  </span>
                  <div className="flex items-center gap-2">
                    {job.status === "completed" && (
                      <Button
                        onClick={() => handleViewTranscript(job.id)}
                        variant="outline"
                        size="sm"
                        icon={<FiFileText />}
                      >
                        {expandedJobId === job.id && jobTranscripts[job.id]
                          ? "Hide Transcript"
                          : "Transcript"}
                      </Button>
                    )}
                    <Button
                      onClick={() => handleViewLogs(job.id)}
                      variant="ghost"
                      size="sm"
                      icon={
                        expandedJobId === job.id ? (
                          <FiChevronUp />
                        ) : (
                          <FiChevronDown />
                        )
                      }
                    >
                      {expandedJobId === job.id ? "Hide" : "Details"}
                    </Button>
                    {job.status === "failed" && (
                      <Button
                        onClick={() => handleRetryJob(job.id)}
                        variant="outline"
                        size="sm"
                        icon={<FiRefreshCw />}
                      >
                        Retry
                      </Button>
                    )}
                    {[
                      "downloading",
                      "transcribing",
                      "analyzing",
                      "slicing",
                    ].includes(job.status) && (
                      <Button
                        onClick={() => handleCancelJob(job.id)}
                        variant="outline"
                        size="sm"
                        icon={<FiX />}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      onClick={() => handleDeleteJob(job.id)}
                      variant="ghost"
                      size="sm"
                      icon={<FiTrash2 />}
                      className="text-error-600 hover:text-error-700 hover:bg-error-50"
                    />
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedJobs.map((job) => (
            <Card key={job.id} hover>
              <CardBody>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-4 mb-3">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0 w-32 h-20 bg-neutral-200 rounded-lg overflow-hidden">
                        {job.thumbnail_url ? (
                          <img
                            src={job.thumbnail_url}
                            alt={job.video_title || "Video thumbnail"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to clip thumbnail if YouTube thumbnail fails
                              if (job.thumbnail_clip_id) {
                                (e.target as HTMLImageElement).src =
                                  api.getThumbnailUrl(job.thumbnail_clip_id);
                              } else {
                                // Show placeholder if all thumbnails fail
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                                const parent = (e.target as HTMLImageElement)
                                  .parentElement;
                                if (
                                  parent &&
                                  !parent.querySelector(
                                    ".thumbnail-placeholder"
                                  )
                                ) {
                                  const placeholder =
                                    document.createElement("div");
                                  placeholder.className =
                                    "thumbnail-placeholder w-full h-full flex items-center justify-center bg-neutral-100";
                                  placeholder.innerHTML =
                                    '<svg class="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>';
                                  parent.appendChild(placeholder);
                                }
                              }
                            }}
                          />
                        ) : job.thumbnail_clip_id ? (
                          <img
                            src={api.getThumbnailUrl(job.thumbnail_clip_id)}
                            alt={job.video_title || "Video thumbnail"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                              const parent = (e.target as HTMLImageElement)
                                .parentElement;
                              if (
                                parent &&
                                !parent.querySelector(".thumbnail-placeholder")
                              ) {
                                const placeholder =
                                  document.createElement("div");
                                placeholder.className =
                                  "thumbnail-placeholder w-full h-full flex items-center justify-center bg-neutral-100";
                                placeholder.innerHTML =
                                  '<svg class="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>';
                                parent.appendChild(placeholder);
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-neutral-100">
                            <svg
                              className="w-8 h-8 text-neutral-400"
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
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-neutral-900 truncate mb-2">
                          {job.video_title || job.video_url}
                        </h3>
                        <div className="flex items-center gap-3 flex-wrap">
                          <StatusIndicator status={job.status} />
                          <Badge variant="neutral" size="sm">
                            {job.clips_created || 0} clips
                          </Badge>
                          <span className="text-sm text-neutral-500">
                            {new Date(job.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {job.progress > 0 && job.status !== "completed" && (
                      <div className="mt-3">
                        <ProgressBar
                          value={job.progress}
                          variant={
                            job.status === "failed"
                              ? "error"
                              : [
                                  "downloading",
                                  "transcribing",
                                  "analyzing",
                                  "slicing",
                                ].includes(job.status)
                              ? "primary"
                              : "warning"
                          }
                          label={job.current_step}
                          showLabel
                        />
                      </div>
                    )}

                    {job.error_message && (
                      <div className="mt-3 p-3 bg-error-50 border border-error-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <FiAlertCircle className="w-4 h-4 text-error-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-error-600 line-clamp-2">
                            {job.error_message}
                          </p>
                        </div>
                      </div>
                    )}

                    {expandedJobId === job.id && jobLogs[job.id] && (
                      <div className="mt-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                        <p className="text-xs font-medium text-neutral-700 mb-2">
                          Job Details:
                        </p>
                        <pre className="text-xs text-neutral-600 overflow-x-auto whitespace-pre-wrap break-words font-mono max-h-32 overflow-y-auto">
                          {jobLogs[job.id]}
                        </pre>
                      </div>
                    )}

                    {expandedJobId === job.id && jobTranscripts[job.id] && (
                      <div className="mt-3 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                          <FiFileText className="w-4 h-4" />
                          Full Transcription
                        </h4>
                        <div className="text-sm text-neutral-700 whitespace-pre-wrap break-words max-h-64 overflow-y-auto leading-relaxed">
                          {jobTranscripts[job.id]}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      {job.status === "completed" && (
                        <Button
                          onClick={() => handleViewTranscript(job.id)}
                          variant="outline"
                          size="sm"
                          icon={<FiFileText />}
                        >
                          {expandedJobId === job.id && jobTranscripts[job.id]
                            ? "Hide"
                            : "Transcript"}
                        </Button>
                      )}
                      <Button
                        onClick={() => handleViewLogs(job.id)}
                        variant="ghost"
                        size="sm"
                        icon={
                          expandedJobId === job.id ? (
                            <FiChevronUp />
                          ) : (
                            <FiChevronDown />
                          )
                        }
                      >
                        {expandedJobId === job.id ? "Hide" : "Details"}
                      </Button>
                      {job.status === "failed" && (
                        <Button
                          onClick={() => handleRetryJob(job.id)}
                          variant="outline"
                          size="sm"
                          icon={<FiRefreshCw />}
                        >
                          Retry
                        </Button>
                      )}
                      {[
                        "downloading",
                        "transcribing",
                        "analyzing",
                        "slicing",
                      ].includes(job.status) && (
                        <Button
                          onClick={() => handleCancelJob(job.id)}
                          variant="outline"
                          size="sm"
                          icon={<FiX />}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDeleteJob(job.id)}
                        variant="ghost"
                        size="sm"
                        icon={<FiTrash2 />}
                        className="text-error-600 hover:text-error-700 hover:bg-error-50"
                      />
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-neutral-600">
              Showing {startIndex + 1} to{" "}
              {Math.min(endIndex, filteredJobs.length)} of {filteredJobs.length}{" "}
              jobs
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                icon={<FiChevronLeft />}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 10) {
                    page = i + 1;
                  } else if (currentPage <= 5) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 4) {
                    page = totalPages - 9 + i;
                  } else {
                    page = currentPage - 4 + i;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`
                        w-8 h-8 rounded-lg text-sm font-medium
                        transition-colors duration-base
                        ${
                          currentPage === page
                            ? "bg-primary-600 text-white"
                            : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                        }
                      `}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <Button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                icon={<FiChevronRight />}
                iconPosition="right"
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Jobs;
