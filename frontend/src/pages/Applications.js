import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  ExternalLink,
  Eye,
  Filter,
  Download,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { applicationsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Applications = ({ user }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [viewingApplication, setViewingApplication] = useState(null);

  const statusOptions = [
    { value: 'all', label: 'All Applications' },
    { value: 'pending', label: 'Pending' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'interview', label: 'Interview' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'accepted', label: 'Accepted' },
  ];

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationsAPI.getApplications(user.user_id);
      setApplications(response.data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => 
    filter === 'all' || app.status === filter
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'submitted':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'interview':
        return <Calendar className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'submitted': return 'text-blue-600 bg-blue-100';
      case 'interview': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'accepted': return 'text-green-700 bg-green-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const ApplicationCard = ({ application }) => (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-secondary-900">
              {application.job_title || 'Job Application'}
            </h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}>
              {application.status}
            </span>
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <Briefcase className="w-4 h-4 text-secondary-500" />
            <span className="text-secondary-700">{application.company || 'Company Name'}</span>
          </div>
          <div className="text-sm text-secondary-600">
            Applied on {new Date(application.applied_at).toLocaleDateString()}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(application.status)}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-secondary-200">
        <div className="text-xs text-secondary-500">
          Application ID: {application.application_id}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewingApplication(application)}
            className="btn-secondary flex items-center space-x-2 text-sm"
          >
            <Eye className="w-4 h-4" />
            <span>View</span>
          </button>
          {application.source_url && (
            <button
              onClick={() => window.open(application.source_url, '_blank')}
              className="p-2 text-secondary-500 hover:text-secondary-700 rounded-lg hover:bg-secondary-100"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const ApplicationModal = ({ application, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-secondary-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-secondary-900">
              {application.job_title || 'Job Application'}
            </h2>
            <button
              onClick={onClose}
              className="text-secondary-500 hover:text-secondary-700"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-secondary-900 mb-2">Company</h3>
              <p className="text-secondary-700">{application.company || 'N/A'}</p>
            </div>
            <div>
              <h3 className="font-semibold text-secondary-900 mb-2">Status</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}>
                {application.status}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-secondary-900 mb-2">Applied Date</h3>
              <p className="text-secondary-700">
                {new Date(application.applied_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-secondary-900 mb-2">Application ID</h3>
              <p className="text-secondary-700 text-sm">{application.application_id}</p>
            </div>
          </div>

          {application.customized_resume && (
            <div>
              <h3 className="font-semibold text-secondary-900 mb-2">Customized Resume</h3>
              <div className="bg-secondary-50 p-4 rounded-lg">
                <p className="text-sm text-secondary-700 whitespace-pre-wrap">
                  {application.customized_resume.substring(0, 300)}...
                </p>
                <button className="mt-2 text-primary-600 hover:text-primary-700 text-sm">
                  View Full Resume
                </button>
              </div>
            </div>
          )}

          {application.cover_letter && (
            <div>
              <h3 className="font-semibold text-secondary-900 mb-2">Cover Letter</h3>
              <div className="bg-secondary-50 p-4 rounded-lg">
                <p className="text-sm text-secondary-700 whitespace-pre-wrap">
                  {application.cover_letter.substring(0, 300)}...
                </p>
                <button className="mt-2 text-primary-600 hover:text-primary-700 text-sm">
                  View Full Cover Letter
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-secondary-200 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
          <button className="btn-primary flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );

  const getStats = () => {
    const total = applications.length;
    const pending = applications.filter(app => app.status === 'pending').length;
    const interviews = applications.filter(app => app.status === 'interview').length;
    const accepted = applications.filter(app => app.status === 'accepted').length;
    const successRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

    return { total, pending, interviews, accepted, successRate };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="skeleton h-8 w-48 mb-2"></div>
          <div className="skeleton h-4 w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">My Applications</h1>
        <p className="text-secondary-600">
          Track and manage your job applications
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-600">Total</p>
              <p className="text-xl font-bold text-secondary-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-full">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-600">Pending</p>
              <p className="text-xl font-bold text-secondary-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-600">Interviews</p>
              <p className="text-xl font-bold text-secondary-900">{stats.interviews}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-full">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-600">Success Rate</p>
              <p className="text-xl font-bold text-secondary-900">{stats.successRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card mb-6">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-secondary-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field max-w-xs"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="text-sm text-secondary-600">
            Showing {filteredApplications.length} of {applications.length} applications
          </span>
        </div>
      </div>

      {/* Applications Grid */}
      {filteredApplications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApplications.map((application) => (
            <ApplicationCard key={application.application_id} application={application} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <AlertCircle className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-secondary-900 mb-2">
            {filter === 'all' ? 'No applications yet' : `No ${filter} applications`}
          </h3>
          <p className="text-secondary-600 mb-6">
            {filter === 'all' 
              ? "Start applying to jobs to see your applications here"
              : `No applications with status "${filter}" found`
            }
          </p>
          <div className="flex justify-center space-x-4">
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="btn-secondary"
              >
                Show All
              </button>
            )}
            <button
              onClick={() => window.location.href = '/jobs'}
              className="btn-primary"
            >
              Browse Jobs
            </button>
          </div>
        </div>
      )}

      {/* Application Modal */}
      {viewingApplication && (
        <ApplicationModal
          application={viewingApplication}
          onClose={() => setViewingApplication(null)}
        />
      )}
    </div>
  );
};

export default Applications;