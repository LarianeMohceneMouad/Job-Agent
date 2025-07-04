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

// Health Check
export const healthCheck = () => api.get('/api/health');

export default api;