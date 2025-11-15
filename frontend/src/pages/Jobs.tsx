import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Job } from '../types';
import toast from 'react-hot-toast';
import { FiSearch, FiFilter, FiRefreshCw, FiTrash2, FiChevronLeft, FiChevronRight, FiGrid, FiList } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import StatusIndicator from '../components/ui/StatusIndicator';
import ProgressBar from '../components/ui/ProgressBar';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';

const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [searchQuery, statusFilter, jobs]);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const response = await api.listJobs({ per_page: 100 });
      setJobs(response.jobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const filterJobs = () => {
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
    if (statusFilter !== 'all') {
      filtered = filtered.filter((job) => job.status === statusFilter);
    }

    setFilteredJobs(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!window.confirm('Are you sure you want to delete this job and all its clips?')) {
      return;
    }

    try {
      await api.deleteJob(jobId);
      toast.success('Job deleted successfully');
      loadJobs();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete job');
    }
  };

  const statusTabs = [
    { value: 'all', label: 'All' },
    { value: 'completed', label: 'Completed' },
    { value: 'processing', label: 'Processing' },
    { value: 'failed', label: 'Failed' },
    { value: 'pending', label: 'Pending' },
  ];

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

  const getStatusCount = (status: string) => {
    if (status === 'all') return jobs.length;
    if (status === 'processing') {
      return jobs.filter(j => ['downloading', 'transcribing', 'analyzing', 'slicing'].includes(j.status)).length;
    }
    return jobs.filter(j => j.status === status).length;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">All Jobs</h1>
          <p className="text-neutral-600 mt-1">View and manage all your video processing jobs</p>
        </div>
        <Button
          onClick={loadJobs}
          variant="outline"
          icon={<FiRefreshCw />}
        >
          Refresh
        </Button>
      </div>

      {/* Filters */}
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

          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {statusTabs.map((tab) => {
              const count = getStatusCount(tab.value);
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                    transition-colors duration-base
                    ${
                      statusFilter === tab.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }
                  `}
                >
                  {tab.label} ({count})
                </button>
              );
            })}
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
            title={searchQuery || statusFilter !== 'all' ? "No jobs found" : "No jobs yet"}
            description={searchQuery || statusFilter !== 'all' ? "Try adjusting your filters" : "Create a job from the dashboard to get started!"}
            action={!searchQuery && statusFilter === 'all' ? {
              label: "Go to Dashboard",
              onClick: () => window.location.href = '/dashboard'
            } : undefined}
          />
        </Card>
      ) : viewMode === 'grid' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paginatedJobs.map((job) => (
              <Card key={job.id} hover>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900 truncate mb-2">
                        {job.video_title || job.video_url}
                      </h3>
                      <div className="flex items-center gap-2">
                        <StatusIndicator status={job.status} />
                        <Badge variant="neutral" size="sm">
                          {job.clips_created || 0} clips
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {job.progress > 0 && job.status !== 'completed' && (
                    <ProgressBar
                      value={job.progress}
                      variant={
                        job.status === 'failed' ? 'error' :
                        ['downloading', 'transcribing', 'analyzing', 'slicing'].includes(job.status) ? 'primary' :
                        'warning'
                      }
                      label={job.current_step}
                      showLabel
                      size="sm"
                    />
                  )}

                  {job.error_message && (
                    <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
                      <p className="text-sm text-error-600 line-clamp-2">
                        {job.error_message}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                    <span className="text-xs text-neutral-500">
                      {new Date(job.created_at).toLocaleString()}
                    </span>
                    <Button
                      onClick={() => handleDeleteJob(job.id)}
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
        </>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedJobs.map((job) => (
              <Card key={job.id} hover>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-4 mb-3">
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

                    {job.progress > 0 && job.status !== 'completed' && (
                      <div className="mt-3">
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
                      <div className="mt-3 p-3 bg-error-50 border border-error-200 rounded-lg">
                        <p className="text-sm text-error-600 line-clamp-2">
                          {job.error_message}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    <Button
                      onClick={() => handleDeleteJob(job.id)}
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
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredJobs.length)} of {filteredJobs.length} jobs
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                icon={<FiChevronLeft />}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`
                      w-8 h-8 rounded-lg text-sm font-medium
                      transition-colors duration-base
                      ${
                        currentPage === page
                          ? 'bg-primary-600 text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }
                    `}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
