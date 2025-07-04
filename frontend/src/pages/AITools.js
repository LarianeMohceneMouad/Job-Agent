import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  FileText, 
  Mail, 
  Target, 
  Sparkles, 
  Copy, 
  Download,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';
import { aiAPI, resumeAPI, userProfileAPI } from '../services/api';
import toast from 'react-hot-toast';

const AITools = ({ user }) => {
  const [activeTab, setActiveTab] = useState('resume');
  const [loading, setLoading] = useState(false);
  const [userResume, setUserResume] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  
  // Resume Customization
  const [resumeForm, setResumeForm] = useState({
    jobTitle: '',
    jobDescription: '',
    company: ''
  });
  const [customizedResume, setCustomizedResume] = useState('');
  
  // Cover Letter
  const [coverLetterForm, setCoverLetterForm] = useState({
    jobTitle: '',
    company: '',
    jobDescription: '',
    userBackground: ''
  });
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState('');
  
  // Job Match Analysis
  const [jobMatchForm, setJobMatchForm] = useState({
    jobTitle: '',
    jobDescription: '',
    requirements: ''
  });
  const [jobMatchAnalysis, setJobMatchAnalysis] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Fetch user resume
      const resumeResponse = await resumeAPI.get(user.user_id);
      setUserResume(resumeResponse.data);
      
      // Fetch user profile
      const profileResponse = await userProfileAPI.get(user.user_id);
      setUserProfile(profileResponse.data);
      
      // Pre-fill background info
      setCoverLetterForm(prev => ({
        ...prev,
        userBackground: resumeResponse.data?.content?.substring(0, 500) || ''
      }));
      
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleCustomizeResume = async () => {
    if (!userResume) {
      toast.error('Please upload your resume first');
      return;
    }
    
    if (!resumeForm.jobTitle || !resumeForm.company || !resumeForm.jobDescription) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      toast.loading('🤖 AI is customizing your resume...', { id: 'resume-customize' });
      
      const response = await aiAPI.customizeResume({
        user_id: user.user_id,
        original_resume: userResume.content,
        job_title: resumeForm.jobTitle,
        job_description: resumeForm.jobDescription,
        company: resumeForm.company
      });
      
      setCustomizedResume(response.data.content);
      toast.success('🎉 Resume customized successfully!', { id: 'resume-customize' });
    } catch (error) {
      console.error('Error customizing resume:', error);
      toast.error('Failed to customize resume', { id: 'resume-customize' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!userProfile) {
      toast.error('Please complete your profile first');
      return;
    }
    
    if (!coverLetterForm.jobTitle || !coverLetterForm.company || !coverLetterForm.jobDescription) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      toast.loading('🤖 AI is generating your cover letter...', { id: 'cover-letter' });
      
      const response = await aiAPI.generateCoverLetter({
        user_id: user.user_id,
        applicant_name: userProfile.name || user.user_id,
        job_title: coverLetterForm.jobTitle,
        company: coverLetterForm.company,
        job_description: coverLetterForm.jobDescription,
        user_background: coverLetterForm.userBackground,
        skills: userResume?.parsed_data?.skills || []
      });
      
      setGeneratedCoverLetter(response.data.content);
      toast.success('🎉 Cover letter generated successfully!', { id: 'cover-letter' });
    } catch (error) {
      console.error('Error generating cover letter:', error);
      toast.error('Failed to generate cover letter', { id: 'cover-letter' });
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeJobMatch = async () => {
    if (!userResume) {
      toast.error('Please upload your resume first');
      return;
    }
    
    if (!jobMatchForm.jobTitle || !jobMatchForm.jobDescription) {
      toast.error('Please fill in job title and description');
      return;
    }

    try {
      setLoading(true);
      toast.loading('🤖 AI is analyzing job compatibility...', { id: 'job-match' });
      
      const requirements = jobMatchForm.requirements
        .split('\n')
        .filter(req => req.trim())
        .map(req => req.trim());
        
      const response = await aiAPI.analyzeJobMatch({
        user_id: user.user_id,
        resume_text: userResume.content,
        job_title: jobMatchForm.jobTitle,
        job_description: jobMatchForm.jobDescription,
        requirements: requirements
      });
      
      setJobMatchAnalysis(response.data.metadata);
      toast.success('🎉 Job match analysis completed!', { id: 'job-match' });
    } catch (error) {
      console.error('Error analyzing job match:', error);
      toast.error('Failed to analyze job match', { id: 'job-match' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const tabs = [
    { id: 'resume', label: 'Resume Customization', icon: FileText },
    { id: 'cover', label: 'Cover Letter', icon: Mail },
    { id: 'match', label: 'Job Matching', icon: Target },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <Brain className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-secondary-900">AI Tools</h1>
          <Sparkles className="w-6 h-6 text-yellow-500" />
        </div>
        <p className="text-secondary-600">
          Powered by Mistral 7B - Customize your applications with AI
        </p>
      </div>

      {/* Status Check */}
      {(!userResume || !userProfile) && (
        <div className="card mb-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-800">Setup Required</h3>
              <p className="text-yellow-700">
                {!userProfile && 'Complete your profile. '}
                {!userResume && 'Upload your resume. '}
                These are required for AI features.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-secondary-100 p-1 rounded-lg">
        {tabs.map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-secondary-600 hover:text-secondary-900'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Resume Customization Tab */}
      {activeTab === 'resume' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">
              Customize Resume for Job
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={resumeForm.jobTitle}
                  onChange={(e) => setResumeForm({...resumeForm, jobTitle: e.target.value})}
                  className="input-field"
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={resumeForm.company}
                  onChange={(e) => setResumeForm({...resumeForm, company: e.target.value})}
                  className="input-field"
                  placeholder="e.g., Google, Microsoft"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Job Description
                </label>
                <textarea
                  value={resumeForm.jobDescription}
                  onChange={(e) => setResumeForm({...resumeForm, jobDescription: e.target.value})}
                  className="textarea-field h-32"
                  placeholder="Paste the job description here..."
                />
              </div>
              
              <button
                onClick={handleCustomizeResume}
                disabled={loading || !userResume}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                <span>{loading ? 'Customizing...' : 'Customize Resume'}</span>
              </button>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-secondary-900">
                Customized Resume
              </h2>
              {customizedResume && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyToClipboard(customizedResume)}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </button>
                </div>
              )}
            </div>
            
            <div className="h-96 overflow-y-auto">
              {customizedResume ? (
                <pre className="text-sm text-secondary-700 whitespace-pre-wrap">
                  {customizedResume}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full text-secondary-500">
                  <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Customized resume will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cover Letter Tab */}
      {activeTab === 'cover' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">
              Generate Cover Letter
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={coverLetterForm.jobTitle}
                  onChange={(e) => setCoverLetterForm({...coverLetterForm, jobTitle: e.target.value})}
                  className="input-field"
                  placeholder="e.g., Product Manager"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={coverLetterForm.company}
                  onChange={(e) => setCoverLetterForm({...coverLetterForm, company: e.target.value})}
                  className="input-field"
                  placeholder="e.g., Apple, Amazon"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Job Description
                </label>
                <textarea
                  value={coverLetterForm.jobDescription}
                  onChange={(e) => setCoverLetterForm({...coverLetterForm, jobDescription: e.target.value})}
                  className="textarea-field h-24"
                  placeholder="Key requirements and responsibilities..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Your Background (Optional)
                </label>
                <textarea
                  value={coverLetterForm.userBackground}
                  onChange={(e) => setCoverLetterForm({...coverLetterForm, userBackground: e.target.value})}
                  className="textarea-field h-20"
                  placeholder="Brief summary of your experience..."
                />
              </div>
              
              <button
                onClick={handleGenerateCoverLetter}
                disabled={loading || !userProfile}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                <span>{loading ? 'Generating...' : 'Generate Cover Letter'}</span>
              </button>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-secondary-900">
                Generated Cover Letter
              </h2>
              {generatedCoverLetter && (
                <button
                  onClick={() => copyToClipboard(generatedCoverLetter)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
              )}
            </div>
            
            <div className="h-96 overflow-y-auto">
              {generatedCoverLetter ? (
                <div className="text-sm text-secondary-700 whitespace-pre-wrap">
                  {generatedCoverLetter}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-secondary-500">
                  <div className="text-center">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Generated cover letter will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Job Matching Tab */}
      {activeTab === 'match' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">
              Analyze Job Match
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={jobMatchForm.jobTitle}
                  onChange={(e) => setJobMatchForm({...jobMatchForm, jobTitle: e.target.value})}
                  className="input-field"
                  placeholder="e.g., Data Scientist"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Job Description
                </label>
                <textarea
                  value={jobMatchForm.jobDescription}
                  onChange={(e) => setJobMatchForm({...jobMatchForm, jobDescription: e.target.value})}
                  className="textarea-field h-32"
                  placeholder="Full job description..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Key Requirements (One per line)
                </label>
                <textarea
                  value={jobMatchForm.requirements}
                  onChange={(e) => setJobMatchForm({...jobMatchForm, requirements: e.target.value})}
                  className="textarea-field h-24"
                  placeholder="Python programming&#10;Machine learning experience&#10;Bachelor's degree"
                />
              </div>
              
              <button
                onClick={handleAnalyzeJobMatch}
                disabled={loading || !userResume}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                <span>{loading ? 'Analyzing...' : 'Analyze Match'}</span>
              </button>
            </div>
          </div>
          
          <div className="card">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">
              Match Analysis
            </h2>
            
            <div className="h-96 overflow-y-auto">
              {jobMatchAnalysis ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600 mb-2">
                      {jobMatchAnalysis.match_score || 0}%
                    </div>
                    <p className="text-sm text-secondary-600">Match Score</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-green-700 mb-2">✅ Strengths</h3>
                    <ul className="text-sm text-secondary-700 space-y-1">
                      {(jobMatchAnalysis.strengths || []).map((strength, index) => (
                        <li key={index}>• {strength}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-orange-700 mb-2">⚠️ Areas for Improvement</h3>
                    <ul className="text-sm text-secondary-700 space-y-1">
                      {(jobMatchAnalysis.gaps || []).map((gap, index) => (
                        <li key={index}>• {gap}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-blue-700 mb-2">💡 Recommendations</h3>
                    <ul className="text-sm text-secondary-700 space-y-1">
                      {(jobMatchAnalysis.recommendations || []).map((rec, index) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {jobMatchAnalysis.summary && (
                    <div>
                      <h3 className="font-semibold text-secondary-900 mb-2">📝 Summary</h3>
                      <p className="text-sm text-secondary-700">{jobMatchAnalysis.summary}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-secondary-500">
                  <div className="text-center">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Job match analysis will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITools;