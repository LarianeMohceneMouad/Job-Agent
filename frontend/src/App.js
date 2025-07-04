import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ResumeUpload from './pages/ResumeUpload';
import JobPreferences from './pages/JobPreferences';
import JobSearch from './pages/JobSearch';
import Applications from './pages/Applications';
import './App.css';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user exists in localStorage
    const userId = localStorage.getItem('userId');
    if (userId) {
      setCurrentUser({ user_id: userId });
    }
    setLoading(false);
  }, []);

  const handleLogin = (userId) => {
    localStorage.setItem('userId', userId);
    setCurrentUser({ user_id: userId });
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-secondary-50">
        <Toaster position="top-right" />
        
        {currentUser && <Navbar user={currentUser} onLogout={handleLogout} />}
        
        <main className={currentUser ? 'pt-16' : ''}>
          <Routes>
            <Route 
              path="/" 
              element={
                currentUser ? <Navigate to="/dashboard" /> : <LoginScreen onLogin={handleLogin} />
              } 
            />
            <Route 
              path="/dashboard" 
              element={currentUser ? <Dashboard user={currentUser} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/profile" 
              element={currentUser ? <Profile user={currentUser} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/resume" 
              element={currentUser ? <ResumeUpload user={currentUser} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/preferences" 
              element={currentUser ? <JobPreferences user={currentUser} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/jobs" 
              element={currentUser ? <JobSearch user={currentUser} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/applications" 
              element={currentUser ? <Applications user={currentUser} /> : <Navigate to="/" />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

const LoginScreen = ({ onLogin }) => {
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userId.trim()) {
      setIsLoading(true);
      // Simulate login process
      setTimeout(() => {
        onLogin(userId.trim());
        setIsLoading(false);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-secondary-900 mb-2">
            AI Job Application System
          </h2>
          <p className="text-secondary-600">
            Automate your job search with AI-powered applications
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="card">
          <div className="space-y-4">
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-secondary-700 mb-2">
                Enter Your User ID
              </label>
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="input-field"
                placeholder="e.g., john_doe_123"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
        
        <div className="text-center text-sm text-secondary-600">
          <p>New user? Just enter a unique ID to get started!</p>
        </div>
      </div>
    </div>
  );
};

export default App;