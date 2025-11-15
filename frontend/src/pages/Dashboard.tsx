import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Job } from '../types';
import toast from 'react-hot-toast';
import { FiFilm, FiList, FiCheckCircle, FiXCircle, FiChevronRight, FiChevronDown, FiPlay, FiTrash2, FiRefreshCw, FiX } from 'react-icons/fi';
import Card, { CardHeader, CardBody, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import MetricCard from '../components/ui/MetricCard';
import StatusIndicator from '../components/ui/StatusIndicator';
import ProgressBar from '../components/ui/ProgressBar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';

const Dashboard: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [jobLogs, setJobLogs] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    loadJobs(true);
    
    const interval = setInterval(() => {
      loadJobs(false);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const loadJobs = async (showLoading = false) => {
    if (showLoading) {
      setIsLoadingJobs(true);
    }
    try {
      const response = await api.listJobs({ per_page: 10 });
      setJobs(response.jobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      if (showLoading) {
        setIsLoadingJobs(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;

    setIsLoading(true);
    try {
      await api.createJob(videoUrl);
      toast.success('Job created! Processing started.');
      setVideoUrl('');
      loadJobs(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create job');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!window.confirm('Are you sure you want to delete this job and all its clips?')) {
      return;
    }

    try {
      await api.deleteJob(jobId);
      toast.success('Job deleted successfully');
      loadJobs(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete job');
    }
  };

  const handleRetryJob = async (jobId: number) => {
    try {
      const job = jobs.find(j => j.id === jobId);
      if (!job) return;
      
      await api.deleteJob(jobId);
      await api.createJob(job.video_url);
      toast.success('Job restarted!');
      loadJobs(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to retry job');
    }
  };

  const handleCancelJob = async (jobId: number) => {
    try {
      await api.cancelJob(jobId);
      toast.success('Job cancelled');
      loadJobs(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to cancel job');
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
      toast.error(error.response?.data?.error || 'Failed to get logs');
    }
  };

  // Calculate metrics
  const totalClips = jobs.reduce((sum, job) => sum + (job.clips_created || 0), 0);
  const activeJobs = jobs.filter(j => ['downloading', 'transcribing', 'analyzing', 'slicing'].includes(j.status)).length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const successRate = jobs.length > 0 ? Math.round((completedJobs / jobs.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-600 mt-1">Monitor your video processing jobs and clips</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Clips"
          value={totalClips}
          icon={<FiFilm className="w-6 h-6" />}
          iconColor="primary"
        />
        <MetricCard
          title="Active Jobs"
          value={activeJobs}
          icon={<FiPlay className="w-6 h-6" />}
          iconColor="warning"
        />
        <MetricCard
          title="Completed Jobs"
          value={completedJobs}
          icon={<FiCheckCircle className="w-6 h-6" />}
          iconColor="success"
        />
        <MetricCard
          title="Success Rate"
          value={`${successRate}%`}
          icon={<FiList className="w-6 h-6" />}
          iconColor="info"
        />
      </div>

      {/* Create New Job Card */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-neutral-900">Create New Viral Clips</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                loading={isLoading}
                variant="primary"
                size="md"
              >
                Process Video
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Recent Jobs Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-900">Recent Jobs</h2>
          <button className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium">
            View All
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>

        {isLoadingJobs ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <EmptyState
              icon={<FiList className="w-full h-full" />}
              title="No jobs yet"
              description="Create your first job by pasting a YouTube URL above"
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} hover>
                <CardBody>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-neutral-900 truncate">
                            {job.video_title || job.video_url}
                          </h3>
                          <div className="flex items-center gap-3 mt-2">
                            <StatusIndicator status={job.status} />
                            <span className="text-sm text-neutral-500">
                              {new Date(job.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-neutral-900">
                            {job.clips_created || 0} clips
                          </p>
                        </div>
                      </div>

                      {job.progress > 0 && job.status !== 'completed' && (
                        <div className="mt-4">
                          <ProgressBar
                            value={job.progress}
                            variant={
                              job.status === 'failed' ? 'error' :
                              ['downloading', 'transcribing', 'analyzing', 'slicing'].includes(job.status) ? 'primary' :
                              'warning'
                            }
                            label={job.current_step}
                            showLabel
                          />
                        </div>
                      )}

                      {job.error_message && (
                        <div className="mt-4 p-3 bg-error-50 border border-error-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <FiXCircle className="w-5 h-5 text-error-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-error-800">Error</p>
                              <p className="text-sm text-error-600 mt-1 whitespace-pre-wrap break-words">
                                {job.error_message}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {job.status === 'transcribing' && job.current_step?.includes('Loading Whisper') && (
                        <div className="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-warning-600 border-t-transparent mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-warning-800">Loading AI Model...</p>
                              <p className="text-xs text-warning-600 mt-1">
                                This may take 1-2 minutes on first use. The Whisper model is being loaded into memory.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {expandedJobId === job.id && jobLogs[job.id] && (
                        <div className="mt-4 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                          <p className="text-xs font-medium text-neutral-700 mb-2">Job Details:</p>
                          <pre className="text-xs text-neutral-600 overflow-x-auto whitespace-pre-wrap break-words font-mono">
                            {jobLogs[job.id]}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </CardBody>
                <CardFooter>
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={() => handleViewLogs(job.id)}
                      variant="ghost"
                      size="sm"
                      icon={expandedJobId === job.id ? <FiChevronDown /> : <FiChevronRight />}
                    >
                      {expandedJobId === job.id ? 'Hide Details' : 'View Details'}
                    </Button>
                    <div className="flex items-center gap-2">
                      {job.status === 'failed' && (
                        <Button
                          onClick={() => handleRetryJob(job.id)}
                          variant="outline"
                          size="sm"
                          icon={<FiRefreshCw />}
                        >
                          Retry
                        </Button>
                      )}
                      {['downloading', 'transcribing', 'analyzing', 'slicing'].includes(job.status) && (
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
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
