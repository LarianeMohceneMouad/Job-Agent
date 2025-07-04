import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User Profile API
export const userProfileAPI = {
  create: (profileData) => api.post('/api/users/profile', profileData),
  get: (userId) => api.get(`/api/users/profile/${userId}`),
  update: (profileData) => api.post('/api/users/profile', profileData),
};

// Resume API
export const resumeAPI = {
  upload: (formData) => api.post('/api/resumes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  get: (userId) => api.get(`/api/resumes/${userId}`),
};

// Job Preferences API
export const preferencesAPI = {
  save: (preferences) => api.post('/api/preferences', preferences),
  get: (userId) => api.get(`/api/preferences/${userId}`),
};

// Jobs API
export const jobsAPI = {
  getJobs: (userId) => api.get(`/api/jobs?user_id=${userId}`),
  searchJobs: (query, userId) => api.get(`/api/jobs/search?query=${query}&user_id=${userId}`),
};

// Applications API
export const applicationsAPI = {
  getApplications: (userId) => api.get(`/api/applications/${userId}`),
  createApplication: (applicationData) => api.post('/api/applications', applicationData),
  updateApplication: (applicationId, updateData) => api.put(`/api/applications/${applicationId}`, updateData),
};

// AI API
export const aiAPI = {
  customizeResume: (data) => api.post('/api/ai/customize-resume', data),
  generateCoverLetter: (data) => api.post('/api/ai/generate-cover-letter', data),
  analyzeJobMatch: (data) => api.post('/api/ai/analyze-job-match', data),
  applyToJob: (userId, jobData) => api.post(`/api/ai/apply-to-job?user_id=${userId}`, jobData),
  getUserAIContent: (userId) => api.get(`/api/ai/user-content/${userId}`),
};

// Job Discovery API (Phase 3: Web Automation)
export const jobDiscoveryAPI = {
  discoverJobs: (data) => api.post('/api/discover/jobs', data),
  getDiscoveredJobs: (userId, source = null, limit = 50) => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (source) params.append('source', source);
    return api.get(`/api/discover/jobs/${userId}?${params}`);
  },
  getAvailableSources: () => api.get('/api/discover/sources'),
  refreshJobs: (userId) => api.post(`/api/discover/refresh-jobs?user_id=${userId}`),
};

// Health Check
export const healthCheck = () => api.get('/api/health');

export default api;