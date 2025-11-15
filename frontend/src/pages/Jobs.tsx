import React from 'react';

const Jobs: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">All Jobs</h1>
        <div className="bg-white shadow sm:rounded-lg p-6">
          <p className="text-gray-600">Full job history will appear here</p>
          <p className="text-sm text-gray-500 mt-2">
            Coming soon: Filter by status, search, pagination
          </p>
        </div>
      </div>
    </div>
  );
};

export default Jobs;

