import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Settings, Plus, X, Save, MapPin, DollarSign, Briefcase, Target } from 'lucide-react';
import { preferencesAPI } from '../services/api';
import toast from 'react-hot-toast';

const JobPreferences = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      job_titles: [''],
      locations: [''],
      keywords: [''],
      excluded_companies: [''],
      min_salary: '',
      max_salary: '',
      experience_level: '',
      job_type: '',
    },
  });

  const jobTitlesArray = useFieldArray({ control, name: 'job_titles' });
  const locationsArray = useFieldArray({ control, name: 'locations' });
  const keywordsArray = useFieldArray({ control, name: 'keywords' });
  const excludedCompaniesArray = useFieldArray({ control, name: 'excluded_companies' });

  const experienceLevels = [
    { value: 'entry', label: 'Entry Level (0-2 years)' },
    { value: 'mid', label: 'Mid Level (3-5 years)' },
    { value: 'senior', label: 'Senior Level (6-10 years)' },
    { value: 'executive', label: 'Executive Level (10+ years)' },
  ];

  const jobTypes = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' },
  ];

  useEffect(() => {
    fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    try {
      setInitialLoading(true);
      const response = await preferencesAPI.get(user.user_id);
      const preferences = response.data;
      
      if (preferences && preferences.job_titles) {
        setValue('job_titles', preferences.job_titles.length > 0 ? preferences.job_titles : ['']);
        setValue('locations', preferences.locations?.length > 0 ? preferences.locations : ['']);
        setValue('keywords', preferences.keywords?.length > 0 ? preferences.keywords : ['']);
        setValue('excluded_companies', preferences.excluded_companies?.length > 0 ? preferences.excluded_companies : ['']);
        setValue('min_salary', preferences.min_salary || '');
        setValue('max_salary', preferences.max_salary || '');
        setValue('experience_level', preferences.experience_level || '');
        setValue('job_type', preferences.job_type || '');
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching preferences:', error);
        toast.error('Failed to load preferences');
      }
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Filter out empty values
      const cleanData = {
        user_id: user.user_id,
        job_titles: data.job_titles.filter(title => title.trim() !== ''),
        locations: data.locations.filter(location => location.trim() !== ''),
        keywords: data.keywords.filter(keyword => keyword.trim() !== ''),
        excluded_companies: data.excluded_companies.filter(company => company.trim() !== ''),
        min_salary: data.min_salary ? parseInt(data.min_salary) : null,
        max_salary: data.max_salary ? parseInt(data.max_salary) : null,
        experience_level: data.experience_level,
        job_type: data.job_type,
      };

      await preferencesAPI.save(cleanData);
      toast.success('Preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const ArrayField = ({ fieldArray, name, label, placeholder, icon: Icon }) => (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        {Icon && <Icon className="w-5 h-5 text-secondary-600" />}
        <label className="block text-sm font-medium text-secondary-700">{label}</label>
      </div>
      
      {fieldArray.fields.map((field, index) => (
        <div key={field.id} className="flex items-center space-x-2">
          <input
            {...register(`${name}.${index}`, { 
              required: index === 0 ? `At least one ${label.toLowerCase()} is required` : false 
            })}
            placeholder={placeholder}
            className="input-field flex-1"
          />
          {fieldArray.fields.length > 1 && (
            <button
              type="button"
              onClick={() => fieldArray.remove(index)}
              className="p-2 text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      
      <button
        type="button"
        onClick={() => fieldArray.append('')}
        className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 text-sm"
      >
        <Plus className="w-4 h-4" />
        <span>Add {label.toLowerCase()}</span>
      </button>
      
      {errors[name]?.[0] && (
        <p className="text-red-500 text-sm">{errors[name][0].message}</p>
      )}
    </div>
  );

  if (initialLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="card">
          <div className="skeleton h-8 w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Job Preferences</h1>
        <p className="text-secondary-600">
          Set your job search preferences to find the best matches
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Job Titles */}
          <div>
            <ArrayField
              fieldArray={jobTitlesArray}
              name="job_titles"
              label="Job Titles"
              placeholder="e.g., Software Engineer, Data Scientist"
              icon={Briefcase}
            />
          </div>

          {/* Locations */}
          <div>
            <ArrayField
              fieldArray={locationsArray}
              name="locations"
              label="Preferred Locations"
              placeholder="e.g., New York, Remote, San Francisco"
              icon={MapPin}
            />
          </div>

          {/* Experience Level */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-700">
              Experience Level
            </label>
            <select
              {...register('experience_level', { required: 'Experience level is required' })}
              className="input-field"
            >
              <option value="">Select experience level</option>
              {experienceLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
            {errors.experience_level && (
              <p className="text-red-500 text-sm">{errors.experience_level.message}</p>
            )}
          </div>

          {/* Job Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-700">
              Job Type
            </label>
            <select
              {...register('job_type', { required: 'Job type is required' })}
              className="input-field"
            >
              <option value="">Select job type</option>
              {jobTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.job_type && (
              <p className="text-red-500 text-sm">{errors.job_type.message}</p>
            )}
          </div>

          {/* Salary Range */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-secondary-600" />
              <label className="block text-sm font-medium text-secondary-700">
                Minimum Salary (Annual)
              </label>
            </div>
            <input
              type="number"
              {...register('min_salary', { 
                min: { value: 0, message: 'Salary must be positive' }
              })}
              placeholder="e.g., 50000"
              className="input-field"
            />
            {errors.min_salary && (
              <p className="text-red-500 text-sm">{errors.min_salary.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-secondary-600" />
              <label className="block text-sm font-medium text-secondary-700">
                Maximum Salary (Annual)
              </label>
            </div>
            <input
              type="number"
              {...register('max_salary', { 
                min: { value: 0, message: 'Salary must be positive' },
                validate: (value) => {
                  const minSalary = watch('min_salary');
                  if (minSalary && value && parseInt(value) < parseInt(minSalary)) {
                    return 'Maximum salary must be greater than minimum salary';
                  }
                  return true;
                }
              })}
              placeholder="e.g., 120000"
              className="input-field"
            />
            {errors.max_salary && (
              <p className="text-red-500 text-sm">{errors.max_salary.message}</p>
            )}
          </div>
        </div>

        {/* Keywords */}
        <div className="mt-8">
          <ArrayField
            fieldArray={keywordsArray}
            name="keywords"
            label="Keywords"
            placeholder="e.g., Python, React, Machine Learning"
            icon={Target}
          />
        </div>

        {/* Excluded Companies */}
        <div className="mt-8">
          <ArrayField
            fieldArray={excludedCompaniesArray}
            name="excluded_companies"
            label="Excluded Companies"
            placeholder="e.g., Company A, Company B"
            icon={X}
          />
        </div>

        <div className="flex items-center justify-between pt-6 mt-8 border-t border-secondary-200">
          <p className="text-sm text-secondary-600">
            {isDirty ? 'You have unsaved changes' : 'All changes saved'}
          </p>
          <button
            type="submit"
            disabled={loading || !isDirty}
            className="btn-primary flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobPreferences;