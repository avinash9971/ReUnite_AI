import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  User,
  MapPin,
  CreditCard,
  Calendar,
  Upload,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  Loader,
} from 'lucide-react';

interface FormData {
  full_name: string;
  address: string;
  aadhaar_number: string;
  gender: 'male' | 'female' | 'other' | '';
  age: string;
  image_year: string;
  missing_from: string;
}

interface FormErrors {
  [key: string]: string;
}

export function ReportMissing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    address: '',
    aadhaar_number: '',
    gender: '',
    age: '',
    image_year: '',
    missing_from: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5242880) {
        setErrors((prev) => ({ ...prev, image: 'Image must be less than 5MB' }));
        return;
      }

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          image: 'Only JPEG, PNG, and WebP images are allowed',
        }));
        return;
      }

      setImageFile(file);
      setErrors((prev) => ({ ...prev, image: '' }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Name must be at least 2 characters';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.aadhaar_number.trim()) {
      newErrors.aadhaar_number = 'Aadhaar number is required';
    } else if (!/^\d{12}$/.test(formData.aadhaar_number.replace(/\s/g, ''))) {
      newErrors.aadhaar_number = 'Aadhaar number must be 12 digits';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    const age = parseInt(formData.age);
    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (isNaN(age) || age < 1 || age > 150) {
      newErrors.age = 'Age must be between 1 and 150';
    }

    const imageYear = parseInt(formData.image_year);
    const currentYear = new Date().getFullYear();
    if (!formData.image_year) {
      newErrors.image_year = 'Image year is required';
    } else if (isNaN(imageYear) || imageYear < 1900 || imageYear > currentYear) {
      newErrors.image_year = `Year must be between 1900 and ${currentYear}`;
    }

    if (!formData.missing_from.trim()) {
      newErrors.missing_from = 'Location is required';
    }

    if (!imageFile) {
      newErrors.image = 'Photo is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('missing-persons-images')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from('missing-persons-images').getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error('Failed to upload image');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    if (!user) {
      setSubmitError('You must be logged in to submit a report');
      return;
    }

    setLoading(true);

    try {
      const imageUrl = await uploadImage();

      if (!imageUrl) {
        throw new Error('Failed to upload image');
      }

      const { error } = await supabase.from('missing_persons').insert({
        reporter_id: user.id,
        full_name: formData.full_name.trim(),
        address: formData.address.trim(),
        aadhaar_number: formData.aadhaar_number.replace(/\s/g, ''),
        gender: formData.gender,
        age: parseInt(formData.age),
        image_url: imageUrl,
        image_year: parseInt(formData.image_year),
        missing_from: formData.missing_from.trim(),
        status: 'active',
      });

      if (error) throw error;

      setSuccess(true);
      setFormData({
        full_name: '',
        address: '',
        aadhaar_number: '',
        gender: '',
        age: '',
        image_year: '',
        missing_from: '',
      });
      setImageFile(null);
      setImagePreview('');

      setTimeout(() => {
        navigate('/report-missing');
      }, 3000);
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to submit report. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold text-center">Report Missing Person</h1>
            <p className="text-center text-blue-100 mt-2">
              Please provide accurate information to help locate your loved one
            </p>
          </div>

          <div className="p-6">
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Report submitted successfully!</p>
                  <p className="text-sm text-green-700 mt-1">
                    Your report has been recorded. Our system will begin processing it immediately.
                  </p>
                </div>
              </div>
            )}

            {submitError && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{submitError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="full_name" className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-2.5 border ${
                        errors.full_name ? 'border-red-300' : 'border-slate-300'
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Enter full name of missing person"
                    />
                  </div>
                  {errors.full_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-2">
                    Residential Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className={`block w-full px-3 py-2.5 border ${
                      errors.address ? 'border-red-300' : 'border-slate-300'
                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Enter complete residential address"
                  />
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>

                <div>
                  <label
                    htmlFor="aadhaar_number"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Aadhaar Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CreditCard className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      id="aadhaar_number"
                      name="aadhaar_number"
                      value={formData.aadhaar_number}
                      onChange={handleInputChange}
                      maxLength={14}
                      className={`block w-full pl-10 pr-3 py-2.5 border ${
                        errors.aadhaar_number ? 'border-red-300' : 'border-slate-300'
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono`}
                      placeholder="XXXX XXXX XXXX"
                    />
                  </div>
                  {errors.aadhaar_number && (
                    <p className="mt-1 text-sm text-red-600">{errors.aadhaar_number}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-slate-700 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2.5 border ${
                      errors.gender ? 'border-red-300' : 'border-slate-300'
                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
                </div>

                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-slate-700 mb-2">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    min="1"
                    max="150"
                    className={`block w-full px-3 py-2.5 border ${
                      errors.age ? 'border-red-300' : 'border-slate-300'
                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Enter age"
                  />
                  {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
                </div>

                <div>
                  <label
                    htmlFor="image_year"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Year Photo Was Taken <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="number"
                      id="image_year"
                      name="image_year"
                      value={formData.image_year}
                      onChange={handleInputChange}
                      min="1900"
                      max={new Date().getFullYear()}
                      className={`block w-full pl-10 pr-3 py-2.5 border ${
                        errors.image_year ? 'border-red-300' : 'border-slate-300'
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="YYYY"
                    />
                  </div>
                  {errors.image_year && (
                    <p className="mt-1 text-sm text-red-600">{errors.image_year}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="missing_from"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Missing From (Location) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      id="missing_from"
                      name="missing_from"
                      value={formData.missing_from}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-2.5 border ${
                        errors.missing_from ? 'border-red-300' : 'border-slate-300'
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Enter location where person went missing"
                    />
                  </div>
                  {errors.missing_from && (
                    <p className="mt-1 text-sm text-red-600">{errors.missing_from}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Upload Photo <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`border-2 border-dashed ${
                      errors.image ? 'border-red-300' : 'border-slate-300'
                    } rounded-lg p-6 text-center hover:border-blue-400 transition-colors`}
                  >
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-w-full h-64 object-contain mx-auto rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview('');
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Change Photo
                        </button>
                      </div>
                    ) : (
                      <div>
                        <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <label
                          htmlFor="image"
                          className="cursor-pointer inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <Upload className="w-5 h-5" />
                          <span>Click to upload photo</span>
                        </label>
                        <input
                          type="file"
                          id="image"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                          JPEG, PNG, or WebP (Max 5MB)
                        </p>
                      </div>
                    )}
                  </div>
                  {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image}</p>}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> All information provided will be securely stored and used to
                  help locate missing persons. Please ensure all details are accurate.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Report</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
