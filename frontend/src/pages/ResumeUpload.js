import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Eye, Download } from 'lucide-react';
import { resumeAPI } from '../services/api';
import toast from 'react-hot-toast';

const ResumeUpload = ({ user }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [currentResume, setCurrentResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetchCurrentResume();
  }, [user]);

  const fetchCurrentResume = async () => {
    try {
      setLoading(true);
      const response = await resumeAPI.get(user.user_id);
      setCurrentResume(response.data);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching resume:', error);
        toast.error('Failed to load resume');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      toast.error('Please select a PDF file');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', user.user_id);

      const response = await resumeAPI.upload(formData);
      
      toast.success('Resume uploaded successfully!');
      setFile(null);
      setCurrentResume(response.data);
      
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast.error('Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const SkillTag = ({ skill }) => (
    <span className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full mr-2 mb-2">
      {skill}
    </span>
  );

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="card">
          <div className="skeleton h-8 w-48 mb-6"></div>
          <div className="skeleton h-64 w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Resume Management</h1>
        <p className="text-secondary-600">
          Upload and manage your resume for job applications
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="card">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">Upload New Resume</h2>
          
          <div
            className={`file-upload-area ${dragOver ? 'dragover' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
          >
            <Upload className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-secondary-700 mb-2">
              Drop your resume here or click to browse
            </p>
            <p className="text-sm text-secondary-500">
              PDF files only, max 10MB
            </p>
          </div>

          <input
            id="file-input"
            type="file"
            accept=".pdf"
            onChange={(e) => handleFileSelect(e.target.files[0])}
            className="hidden"
          />

          {file && (
            <div className="mt-4 p-4 bg-secondary-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-primary-600" />
                <div className="flex-1">
                  <p className="font-medium text-secondary-900">{file.name}</p>
                  <p className="text-sm text-secondary-600">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <AlertCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 flex space-x-4">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="btn-primary flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Uploading...' : 'Upload Resume'}</span>
            </button>
            
            {file && (
              <button
                onClick={() => setFile(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Current Resume Section */}
        <div className="card">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">Current Resume</h2>
          
          {currentResume ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-secondary-900">{currentResume.file_name}</p>
                  <p className="text-sm text-secondary-600">
                    Uploaded on {new Date(currentResume.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Parsed Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-secondary-900 mb-2">Contact Information</h3>
                  <div className="space-y-2">
                    {currentResume.parsed_data.emails?.length > 0 && (
                      <div>
                        <span className="text-sm text-secondary-600">Email: </span>
                        <span className="text-sm text-secondary-900">
                          {currentResume.parsed_data.emails.join(', ')}
                        </span>
                      </div>
                    )}
                    {currentResume.parsed_data.phones?.length > 0 && (
                      <div>
                        <span className="text-sm text-secondary-600">Phone: </span>
                        <span className="text-sm text-secondary-900">
                          {currentResume.parsed_data.phones.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {currentResume.parsed_data.skills?.length > 0 && (
                  <div>
                    <h3 className="font-medium text-secondary-900 mb-2">Detected Skills</h3>
                    <div className="flex flex-wrap">
                      {currentResume.parsed_data.skills.map((skill, index) => (
                        <SkillTag key={index} skill={skill} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-secondary-200">
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      // Open text content in a new window/modal
                      const newWindow = window.open('', '_blank');
                      newWindow.document.write(`
                        <html>
                          <head><title>Resume Content</title></head>
                          <body style="font-family: Arial, sans-serif; padding: 20px;">
                            <h1>Resume Content</h1>
                            <pre style="white-space: pre-wrap; word-wrap: break-word;">
                              ${currentResume.content}
                            </pre>
                          </body>
                        </html>
                      `);
                    }}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Content</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
              <p className="text-secondary-600 mb-4">No resume uploaded yet</p>
              <p className="text-sm text-secondary-500">
                Upload your resume to get started with job applications
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeUpload;