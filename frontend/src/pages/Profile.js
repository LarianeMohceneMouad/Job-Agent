import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone, MapPin, Linkedin, Github, ExternalLink, Save } from 'lucide-react';
import { userProfileAPI } from '../services/api';
import toast from 'react-hot-toast';

const Profile = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm();

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      setInitialLoading(true);
      const response = await userProfileAPI.get(user.user_id);
      const profile = response.data;
      
      // Set form values
      setValue('name', profile.name || '');
      setValue('email', profile.email || '');
      setValue('phone', profile.phone || '');
      setValue('location', profile.location || '');
      setValue('linkedin_url', profile.linkedin_url || '');
      setValue('github_url', profile.github_url || '');
      setValue('portfolio_url', profile.portfolio_url || '');
      
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      }
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await userProfileAPI.create({
        user_id: user.user_id,
        ...data,
      });
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ 
    label, 
    name, 
    type = 'text', 
    placeholder, 
    icon: Icon, 
    validation = {},
    ...props 
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-secondary-700">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
        )}
        <input
          type={type}
          placeholder={placeholder}
          className={`input-field ${Icon ? 'pl-10' : ''} ${
            errors[name] ? 'border-red-500 focus:ring-red-500' : ''
          }`}
          {...register(name, validation)}
          {...props}
        />
        {Icon && type === 'url' && (
          <ExternalLink className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
        )}
      </div>
      {errors[name] && (
        <p className="text-red-500 text-sm">{errors[name].message}</p>
      )}
    </div>
  );

  if (initialLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="card">
          <div className="skeleton h-8 w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton h-4 w-24"></div>
                <div className="skeleton h-10 w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Profile</h1>
        <p className="text-secondary-600">
          Manage your personal information and contact details
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">Personal Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Full Name"
              name="name"
              placeholder="Enter your full name"
              icon={User}
              validation={{
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters'
                }
              }}
            />
            
            <InputField
              label="Email Address"
              name="email"
              type="email"
              placeholder="Enter your email"
              icon={Mail}
              validation={{
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              }}
            />
            
            <InputField
              label="Phone Number"
              name="phone"
              type="tel"
              placeholder="Enter your phone number"
              icon={Phone}
              validation={{
                required: 'Phone number is required',
                pattern: {
                  value: /^[\+]?[\d\s\-\(\)]+$/,
                  message: 'Invalid phone number format'
                }
              }}
            />
            
            <InputField
              label="Location"
              name="location"
              placeholder="City, State/Country"
              icon={MapPin}
              validation={{
                required: 'Location is required'
              }}
            />
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">Professional Links</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="LinkedIn Profile"
              name="linkedin_url"
              type="url"
              placeholder="https://linkedin.com/in/yourprofile"
              icon={Linkedin}
              validation={{
                pattern: {
                  value: /^https?:\/\/(www\.)?linkedin\.com\/.*$/,
                  message: 'Please enter a valid LinkedIn URL'
                }
              }}
            />
            
            <InputField
              label="GitHub Profile"
              name="github_url"
              type="url"
              placeholder="https://github.com/yourusername"
              icon={Github}
              validation={{
                pattern: {
                  value: /^https?:\/\/(www\.)?github\.com\/.*$/,
                  message: 'Please enter a valid GitHub URL'
                }
              }}
            />
            
            <div className="md:col-span-2">
              <InputField
                label="Portfolio Website"
                name="portfolio_url"
                type="url"
                placeholder="https://yourportfolio.com"
                icon={ExternalLink}
                validation={{
                  pattern: {
                    value: /^https?:\/\/.*$/,
                    message: 'Please enter a valid URL'
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-secondary-200">
          <p className="text-sm text-secondary-600">
            {isDirty ? 'You have unsaved changes' : 'All changes saved'}
          </p>
          <button
            type="submit"
            disabled={loading || !isDirty}
            className="btn-primary flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;