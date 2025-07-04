import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Clock, 
  Building, 
  ExternalLink, 
  Send,
  Filter,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { jobsAPI, aiAPI } from '../services/api';
import toast from 'react-hot-toast';

const JobSearch = ({ user }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [applying, setApplying] = useState({});

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getJobs(user.user_id);
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchJobs();
      return;
    }

    try {
      setLoading(true);
      const response = await jobsAPI.searchJobs(searchQuery, user.user_id);
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error searching jobs:', error);
      toast.error('Failed to search jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (job) => {
    setApplying(prev => ({ ...prev, [job.job_id]: true }));
    
    try {
      // This is a placeholder for the actual application logic
      // In the next phase, this will integrate with AI and web automation
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      toast.success(`Applied to ${job.title} at ${job.company}!`);
      
      // Update job status locally
      setJobs(prev => prev.map(j => 
        j.job_id === job.job_id 
          ? { ...j, applied: true }
          : j
      ));
      
    } catch (error) {
      console.error('Error applying to job:', error);
      toast.error('Failed to apply to job');
    } finally {
      setApplying(prev => ({ ...prev, [job.job_id]: false }));
    }
  };

  const JobCard = ({ job }) => (
    <div className="card job-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-secondary-900">{job.title}</h3>
            {job.applied && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Applied
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <Building className="w-4 h-4 text-secondary-500" />
            <span className="text-secondary-700">{job.company}</span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-secondary-600">
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{job.location}</span>
            </div>
            {job.salary_range && (
              <div className="flex items-center space-x-1">
                <DollarSign className="w-4 h-4" />
                <span>{job.salary_range}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{job.job_type}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.open(job.source_url, '_blank')}
            className="p-2 text-secondary-500 hover:text-secondary-700 rounded-lg hover:bg-secondary-100"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-secondary-700 line-clamp-3">
          {job.description}
        </p>
      </div>

      {job.requirements && job.requirements.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-secondary-900 mb-2">Key Requirements:</h4>
          <ul className="text-sm text-secondary-600 space-y-1">
            {job.requirements.slice(0, 3).map((req, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-secondary-200">
        <div className="text-xs text-secondary-500">
          Posted {new Date(job.posted_date).toLocaleDateString()}
        </div>
        <button
          onClick={() => handleApply(job)}
          disabled={applying[job.job_id] || job.applied}
          className={`btn-primary flex items-center space-x-2 ${
            job.applied ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Send className="w-4 h-4" />
          <span>
            {applying[job.job_id] ? 'Applying...' : job.applied ? 'Applied' : 'Apply Now'}
          </span>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="skeleton h-8 w-48 mb-2"></div>
          <div className="skeleton h-4 w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card">
              <div className="skeleton h-32 w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Job Search</h1>
        <p className="text-secondary-600">
          Find and apply to jobs that match your preferences
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs by title, company, or keywords..."
              className="input-field pl-10"
            />
          </div>
          <button
            type="submit"
            className="btn-primary flex items-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterOpen(!filterOpen)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button
            type="button"
            onClick={fetchJobs}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </form>
      </div>

      {/* Jobs Grid */}
      {jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <JobCard key={job.job_id} job={job} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <AlertCircle className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-secondary-900 mb-2">No jobs found</h3>
          <p className="text-secondary-600 mb-6">
            {searchQuery 
              ? "Try different keywords or clear your search to see all available jobs"
              : "Set up your preferences to see personalized job recommendations"
            }
          </p>
          <div className="flex justify-center space-x-4">
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  fetchJobs();
                }}
                className="btn-secondary"
              >
                Clear Search
              </button>
            )}
            <button
              onClick={() => window.location.href = '/preferences'}
              className="btn-primary"
            >
              Set Preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobSearch;