import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Job } from '../types';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [jobLogs, setJobLogs] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    loadJobs(true); // Show loading spinner on first load
    
    // Auto-refresh jobs every 3 seconds
    const interval = setInterval(() => {
      loadJobs(false); // Silent refresh in background
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
      // Delete the old job and create a new one with the same URL
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

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {/* URL Input */}
        <div className="bg-white shadow sm:rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Create New Viral Clips
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Process Video'}
              </button>
            </div>
          </form>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white shadow sm:rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Recent Jobs
          </h2>
          {isLoadingJobs ? (
            <LoadingSpinner />
          ) : jobs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No jobs yet. Create one above!
            </p>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {job.video_title || job.video_url}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Status:{' '}
                        <span
                          className={`font-medium ${
                            job.status === 'completed'
                              ? 'text-green-600'
                              : job.status === 'failed'
                              ? 'text-red-600'
                              : 'text-yellow-600'
                          }`}
                        >
                          {job.status}
                        </span>
                      </p>
                      {job.progress > 0 && job.status !== 'completed' && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full transition-all"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {job.progress}% - {job.current_step}
                          </p>
                        </div>
                      )}
                      {job.error_message && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                              <p className="text-sm text-red-800 font-medium">Error:</p>
                              <p className="text-sm text-red-600 mt-1 whitespace-pre-wrap break-words">
                                {job.error_message}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {job.status === 'transcribing' && job.current_step?.includes('Loading Whisper') && (
                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <div className="flex-1">
                              <p className="text-sm text-yellow-800 font-medium">Loading AI Model...</p>
                              <p className="text-xs text-yellow-600 mt-1">
                                This may take 1-2 minutes on first use. The Whisper model is being loaded into memory.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {expandedJobId === job.id && jobLogs[job.id] && (
                        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded">
                          <p className="text-xs font-medium text-gray-700 mb-2">Job Details:</p>
                          <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap break-words font-mono">
                            {jobLogs[job.id]}
                          </pre>
                          <p className="text-xs text-gray-500 mt-2">
                            For full logs, run: <code className="bg-gray-200 px-1 rounded">docker-compose logs backend | grep "Job {job.id}"</code>
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {job.clips_created || 0} clips
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(job.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewLogs(job.id)}
                          className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                          title="View job details"
                        >
                          {expandedJobId === job.id ? 'Hide' : 'Details'}
                        </button>
                        {job.status === 'failed' && (
                          <button
                            onClick={() => handleRetryJob(job.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Retry
                          </button>
                        )}
                        {['downloading', 'transcribing', 'analyzing', 'slicing'].includes(job.status) && (
                          <button
                            onClick={() => handleCancelJob(job.id)}
                            className="text-xs text-orange-600 hover:text-orange-800 font-medium"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

