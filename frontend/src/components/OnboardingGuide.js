import React, { useState } from 'react';
import { X, CheckCircle, FileText, User, Settings, Brain, Search, Briefcase } from 'lucide-react';

const OnboardingGuide = ({ onClose, onStepComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to AI Job Application System! 🎉",
      description: "Let's get you set up to start applying to jobs with AI assistance.",
      icon: Brain,
      color: "primary"
    },
    {
      title: "Complete Your Profile",
      description: "Add your personal information including contact details and professional links.",
      icon: User,
      color: "blue",
      link: "/profile"
    },
    {
      title: "Upload Your Resume",
      description: "Upload your PDF resume. Our AI will parse and extract your skills automatically.",
      icon: FileText,
      color: "green",
      link: "/resume"
    },
    {
      title: "Set Job Preferences",
      description: "Tell us what kind of jobs you're looking for - titles, locations, salary range, etc.",
      icon: Settings,
      color: "purple",
      link: "/preferences"
    },
    {
      title: "Use AI Tools",
      description: "Customize resumes, generate cover letters, and analyze job matches with AI.",
      icon: Brain,
      color: "orange",
      link: "/ai-tools"
    },
    {
      title: "Browse & Apply to Jobs",
      description: "Find jobs and use our 🤖 AI Apply feature for automated applications.",
      icon: Search,
      color: "pink",
      link: "/jobs"
    },
    {
      title: "Track Your Applications",
      description: "Monitor all your job applications and view AI-generated content.",
      icon: Briefcase,
      color: "teal",
      link: "/applications"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
      localStorage.setItem('onboarding_completed', 'true');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGoToStep = (step) => {
    onStepComplete(step.link);
    onClose();
  };

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-secondary-900">Getting Started</h2>
            <button
              onClick={onClose}
              className="text-secondary-400 hover:text-secondary-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center mb-6">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-${currentStepData.color}-100 flex items-center justify-center`}>
              <IconComponent className={`w-8 h-8 text-${currentStepData.color}-600`} />
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              {currentStepData.title}
            </h3>
            <p className="text-secondary-600 text-sm">
              {currentStepData.description}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-secondary-500 mb-2">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-secondary-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between space-x-3">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {currentStepData.link && currentStep > 0 ? (
              <button
                onClick={() => handleGoToStep(currentStepData)}
                className="btn-primary flex-1"
              >
                Go to {currentStepData.title.split(' ')[currentStep === 1 ? 1 : 0]}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="btn-primary flex-1"
              >
                {currentStep === steps.length - 1 ? 'Get Started!' : 'Next'}
              </button>
            )}
          </div>

          {/* Skip option */}
          <div className="text-center mt-4">
            <button
              onClick={() => {
                onClose();
                localStorage.setItem('onboarding_completed', 'true');
              }}
              className="text-sm text-secondary-500 hover:text-secondary-700"
            >
              Skip guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingGuide;