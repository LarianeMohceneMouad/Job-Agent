import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Settings, 
  Search, 
  Briefcase, 
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Brain
} from 'lucide-react';
import { applicationsAPI, jobsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    interviewsScheduled: 0,
    successRate: 0,
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch applications
      const applicationsResponse = await applicationsAPI.getApplications(user.user_id);
      const applications = applicationsResponse.data.applications || [];
      
      // Calculate stats
      const totalApplications = applications.length;
      const pendingApplications = applications.filter(app => app.status === 'pending').length;
      const interviewsScheduled = applications.filter(app => app.status === 'interview').length;
      const acceptedApplications = applications.filter(app => app.status === 'accepted').length;
      const successRate = totalApplications > 0 ? Math.round((acceptedApplications / totalApplications) * 100) : 0;
      
      setStats({
        totalApplications,
        pendingApplications,
        interviewsScheduled,
        successRate,
      });
      
      // Get recent applications (last 5)
      const sortedApplications = applications
        .sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at))
        .slice(0, 5);
      
      setRecentApplications(sortedApplications);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color = 'primary' }) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-secondary-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-secondary-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const QuickAction = ({ icon: Icon, title, description, to, color = 'primary' }) => (
    <Link
      to={to}
      className="card hover:shadow-lg transition-shadow duration-200 block"
    >
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-secondary-900 mb-1">{title}</h3>
          <p className="text-sm text-secondary-600">{description}</p>
        </div>
      </div>
    </Link>
  );

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

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card">
              <div className="skeleton h-20 w-full rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          Welcome back, {user.user_id}!
        </h1>
        <p className="text-secondary-600">
          Here's your job application overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Briefcase}
          title="Total Applications"
          value={stats.totalApplications}
          color="primary"
        />
        <StatCard
          icon={Clock}
          title="Pending"
          value={stats.pendingApplications}
          color="yellow"
        />
        <StatCard
          icon={CheckCircle}
          title="Interviews"
          value={stats.interviewsScheduled}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          title="Success Rate"
          value={`${stats.successRate}%`}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <QuickAction
              icon={FileText}
              title="Upload Resume"
              description="Upload or update your resume for better job matching"
              to="/resume"
              color="blue"
            />
            <QuickAction
              icon={Settings}
              title="Set Preferences"
              description="Configure your job search preferences and filters"
              to="/preferences"
              color="purple"
            />
            <QuickAction
              icon={Search}
              title="Search Jobs"
              description="Find and apply to jobs matching your profile"
              to="/jobs"
              color="green"
            />
          </div>
        </div>

        {/* Recent Applications */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-secondary-900">Recent Applications</h2>
            <Link
              to="/applications"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentApplications.length > 0 ? (
              recentApplications.map((application) => (
                <div key={application.application_id} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-secondary-900">
                      {application.job_title || 'Job Application'}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}>
                      {application.status}
                    </span>
                  </div>
                  <p className="text-sm text-secondary-600 mb-2">
                    {application.company || 'Company Name'}
                  </p>
                  <p className="text-xs text-secondary-500">
                    Applied on {new Date(application.applied_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="card text-center py-8">
                <AlertCircle className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
                <p className="text-secondary-600 mb-4">No applications yet</p>
                <Link
                  to="/jobs"
                  className="btn-primary"
                >
                  Start Applying
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;