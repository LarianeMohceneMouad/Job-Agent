import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  Globe, 
  MapPin, 
  Building, 
  ExternalLink, 
  Send,
  Filter,
  CheckCircle,
  AlertCircle,
  Loader,
  Zap,
  Target,
  Download
} from 'lucide-react';
import { jobDiscoveryAPI, aiAPI, preferencesAPI } from '../services/api';
import toast from 'react-hot-toast';

const JobDiscovery = ({ user }) => {
  const [discoveredJobs, setDiscoveredJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [sources, setSources] = useState([]);
  const [selectedSources, setSelectedSources] = useState(['justjoinit', 'inhire', 'companies']);
  const [searchForm, setSearchForm] = useState({
    keywords: '',
    locations: '',
    jobTitles: ''
  });
  const [applying, setApplying] = useState({});
  const [filterSource, setFilterSource] = useState('all');

  useEffect(() => {
    fetchAvailableSources();
    fetchDiscoveredJobs();
    loadUserPreferences();
  }, [user]);

  const fetchAvailableSources = async () => {
    try {
      const response = await jobDiscoveryAPI.getAvailableSources();
      setSources(response.data.sources || []);
    } catch (error) {
      console.error('Error fetching sources:', error);
    }
  };

  const fetchDiscoveredJobs = async () => {
    try {
      setLoading(true);
      const source = filterSource === 'all' ? null : filterSource;
      const response = await jobDiscoveryAPI.getDiscoveredJobs(user.user_id, source);
      setDiscoveredJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error fetching discovered jobs:', error);
      toast.error('Failed to load discovered jobs');
    } finally {
      setLoading(false);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const response = await preferencesAPI.get(user.user_id);
      const preferences = response.data;
      
      if (preferences && preferences.job_titles) {
        setSearchForm({
          keywords: preferences.keywords?.join(', ') || '',
          locations: preferences.locations?.join(', ') || '',
          jobTitles: preferences.job_titles?.join(', ') || ''
        });
      }
    } catch (error) {
      // Preferences not found, keep defaults
    }
  };

  const handleDiscoverJobs = async () => {
    try {
      setDiscovering(true);
      toast.loading('🕸️ Discovering jobs from web sources...', { id: 'job-discovery' });

      const keywords = searchForm.keywords.split(',').map(k => k.trim()).filter(k => k);
      const locations = searchForm.locations.split(',').map(l => l.trim()).filter(l => l);
      const jobTitles = searchForm.jobTitles.split(',').map(t => t.trim()).filter(t => t);

      const response = await jobDiscoveryAPI.discoverJobs({
        user_id: user.user_id,
        keywords,
        locations,
        job_titles: jobTitles,
        sources: selectedSources
      });

      if (response.data.success) {
        toast.success(`🎉 Discovered ${response.data.jobs_found} jobs from ${response.data.sources_scraped.join(', ')}!`, { id: 'job-discovery' });
        await fetchDiscoveredJobs();
      }
    } catch (error) {
      console.error('Error discovering jobs:', error);
      toast.error('Failed to discover jobs', { id: 'job-discovery' });
    } finally {
      setDiscovering(false);
    }
  };

  const handleRefreshJobs = async () => {
    try {
      setDiscovering(true);
      toast.loading('🔄 Refreshing job discoveries...', { id: 'refresh-jobs' });

      const response = await jobDiscoveryAPI.refreshJobs(user.user_id);
      
      if (response.data.success) {
        toast.success(`✨ ${response.data.message}`, { id: 'refresh-jobs' });
        await fetchDiscoveredJobs();
      }
    } catch (error) {
      console.error('Error refreshing jobs:', error);
      toast.error('Failed to refresh jobs', { id: 'refresh-jobs' });
    } finally {
      setDiscovering(false);
    }
  };

  const handleApplyToJob = async (job) => {
    const jobId = job.job_id || job._id;
    setApplying(prev => ({ ...prev, [jobId]: true }));
    
    try {
      toast.loading('🤖 AI is applying to this job...', { id: `apply-${jobId}` });

      const response = await aiAPI.applyToJob(user.user_id, {
        job_id: jobId,
        title: job.title,
        company: job.company,
        description: job.description,
        requirements: job.requirements || [],
        location: job.location,
        job_type: job.job_type,
        salary_range: job.salary_range,
        source_url: job.source_url
      });
      
      if (response.data.success) {
        toast.success(`🎉 AI applied to ${job.title} at ${job.company}!`, { id: `apply-${jobId}` });
        
        // Update job status locally
        setDiscoveredJobs(prev => prev.map(j => 
          (j.job_id === jobId || j._id === jobId) 
            ? { ...j, applied: true }
            : j
        ));
      }
      
    } catch (error) {
      console.error('Error applying to job:', error);
      if (error.response?.status === 404) {
        toast.error('Please upload your resume and complete your profile first', { id: `apply-${jobId}` });
      } else {
        toast.error('Failed to apply to job. Please try again.', { id: `apply-${jobId}` });
      }
    } finally {
      setApplying(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const getSourceIcon = (source) => {
    if (source?.includes('JustJoin')) return '🇵🇱';
    if (source?.includes('InHire')) return '🇪🇺';
    if (source?.includes('Career') || source?.includes('Company')) return '🏢';
    return '🌐';
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const posted = new Date(date);
    const diffInHours = Math.floor((now - posted) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const JobCard = ({ job }) => {
    const jobId = job.job_id || job._id;
    
    return (
      <div className="card hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary-500">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-secondary-900">{job.title}</h3>
              {job.applied && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Applied
                </span>
              )}
              <span className="text-lg">{getSourceIcon(job.source)}</span>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <Building className="w-4 h-4 text-secondary-500" />
              <span className="text-secondary-700 font-medium">{job.company}</span>
              <span className="text-xs text-secondary-500">via {job.source}</span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-secondary-600 mb-3">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{job.location}</span>
              </div>
              {job.salary_range && (
                <div className="flex items-center space-x-1">
                  <span className="text-green-600 font-medium">{job.salary_range}</span>
                </div>
              )}
              <div className="text-xs text-secondary-500">
                {getTimeAgo(job.posted_date || job.discovery_timestamp)}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.open(job.source_url, '_blank')}
              className="p-2 text-secondary-500 hover:text-secondary-700 rounded-lg hover:bg-secondary-100"
              title="View original posting"
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
            Discovered from {job.source}
          </div>
          <button
            onClick={() => handleApplyToJob(job)}
            disabled={applying[jobId] || job.applied}
            className={`btn-primary flex items-center space-x-2 ${
              job.applied ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {applying[jobId] ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>
              {applying[jobId] ? '🤖 AI Applying...' : job.applied ? 'Applied' : '🤖 AI Apply'}
            </span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <Globe className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-secondary-900">Job Discovery</h1>
          <Zap className="w-6 h-6 text-yellow-500" />
        </div>
        <p className="text-secondary-600">
          Discover jobs from JustJoinIT, InHire, and company career pages
        </p>
      </div>

      {/* Discovery Controls */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-secondary-900 mb-4">Web Job Discovery</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Keywords
            </label>
            <input
              type="text"
              value={searchForm.keywords}
              onChange={(e) => setSearchForm({...searchForm, keywords: e.target.value})}
              className="input-field"
              placeholder="e.g., Python, React, DevOps"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Locations
            </label>
            <input
              type="text"
              value={searchForm.locations}
              onChange={(e) => setSearchForm({...searchForm, locations: e.target.value})}
              className="input-field"
              placeholder="e.g., Remote, Warsaw, Europe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Job Titles
            </label>
            <input
              type="text"
              value={searchForm.jobTitles}
              onChange={(e) => setSearchForm({...searchForm, jobTitles: e.target.value})}
              className="input-field"
              placeholder="e.g., Software Engineer, Developer"
            />
          </div>
        </div>

        {/* Source Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Discovery Sources
          </label>
          <div className="flex flex-wrap gap-3">
            {sources.map((source) => (
              <label key={source.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedSources.includes(source.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedSources([...selectedSources, source.id]);
                    } else {
                      setSelectedSources(selectedSources.filter(s => s !== source.id));
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm text-secondary-700">{source.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleDiscoverJobs}
            disabled={discovering || selectedSources.length === 0}
            className="btn-primary flex items-center space-x-2"
          >
            {discovering ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>{discovering ? 'Discovering...' : 'Discover Jobs'}</span>
          </button>
          
          <button
            onClick={handleRefreshJobs}
            disabled={discovering}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Results */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-secondary-900">
            Discovered Jobs ({discoveredJobs.length})
          </h2>
          <select
            value={filterSource}
            onChange={(e) => {
              setFilterSource(e.target.value);
              setTimeout(fetchDiscoveredJobs, 100);
            }}
            className="input-field max-w-xs"
          >
            <option value="all">All Sources</option>
            {sources.map(source => (
              <option key={source.id} value={source.name}>{source.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card">
              <div className="skeleton h-48 w-full"></div>
            </div>
          ))}
        </div>
      ) : discoveredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {discoveredJobs.map((job) => (
            <JobCard key={job.job_id || job._id} job={job} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Globe className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-secondary-900 mb-2">No jobs discovered yet</h3>
          <p className="text-secondary-600 mb-6">
            Click "Discover Jobs" to find opportunities from web sources
          </p>
          <button
            onClick={handleDiscoverJobs}
            disabled={discovering || selectedSources.length === 0}
            className="btn-primary"
          >
            Start Discovery
          </button>
        </div>
      )}
    </div>
  );
};

export default JobDiscovery;