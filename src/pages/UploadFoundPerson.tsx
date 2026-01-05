import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Upload,
  AlertCircle,
  Image as ImageIcon,
  Loader,
  Search,
} from 'lucide-react';

export function UploadFoundPerson() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5242880) {
        setError('Image must be less than 5MB');
        return;
      }

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Only JPEG, PNG, and WebP images are allowed');
        return;
      }

      setImageFile(file);
      setError('');

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('found-persons-images')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from('found-persons-images').getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error('Failed to upload image');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!imageFile) {
      setError('Please select an image to upload');
      return;
    }

    if (!user) {
      setError('You must be logged in to upload');
      return;
    }

    setLoading(true);

    try {
      const imageUrl = await uploadImage();

      if (!imageUrl) {
        throw new Error('Failed to upload image');
      }

      const { data: foundPerson, error: insertError } = await supabase
        .from('found_persons')
        .insert({
          admin_id: user.id,
          image_url: imageUrl,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      navigate(`/matching-results/${foundPerson.id}`);
    } catch (error) {
      console.error('Submission error:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to upload. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-8 text-white">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Upload className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center">Upload Found Person</h1>
            <p className="text-center text-slate-200 mt-2">
              Upload a photo to identify and match with missing persons database
            </p>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Upload Photo of Found Person <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full h-96 object-contain mx-auto rounded-lg shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                        }}
                        className="text-sm text-slate-600 hover:text-slate-700 font-medium"
                      >
                        Change Photo
                      </button>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <label
                        htmlFor="image"
                        className="cursor-pointer inline-flex items-center space-x-2 px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
                      >
                        <Upload className="w-5 h-5" />
                        <span>Select Image</span>
                      </label>
                      <input
                        type="file"
                        id="image"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <p className="text-sm text-slate-500 mt-4">
                        JPEG, PNG, or WebP (Max 5MB)
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        For best results, use a clear, front-facing photo
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Search className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">How it works:</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-700">
                      <li>Upload a photo of the found person</li>
                      <li>Our AI system will analyze facial features</li>
                      <li>The system will search the missing persons database</li>
                      <li>View potential matches with confidence scores</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => navigate('/admin-dashboard')}
                  className="px-6 py-2.5 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !imageFile}
                  className="px-6 py-2.5 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      <span>Find Matches</span>
                    </>
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
