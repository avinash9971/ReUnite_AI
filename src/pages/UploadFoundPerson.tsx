import { useState, FormEvent, ChangeEvent, useRef } from 'react';
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
import ImageTypeSelector from '../components/ImageTypeSelector';

export function UploadFoundPerson() {
  const { user } = useAuth();
  const navigate = useNavigate();

  type ImageEntry = {
    file: File;
    preview: string;
    type: string; // 'sketch' | 'younger' | 'blurry' | ''
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [showImageTypeErrors, setShowImageTypeErrors] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5242880) {
      setError('Image must be less than 5MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImages((prev) => [...prev, { file, preview: reader.result as string, type: '' }]);
    };
    reader.readAsDataURL(file);

    setError('');

    // allow selecting the same file again if needed
    if (e.target) e.target.value = '';
  };

  const uploadSingleImage = async (file: File): Promise<string | null> => {
    if (!file || !user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('found-persons-images')
        .upload(fileName, file, {
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

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const updateImageType = (index: number, type: string) => {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, type } : img)));
    setShowImageTypeErrors(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setShowImageTypeErrors(false);

    if (images.length === 0) {
      setError('Please add at least one image to upload');
      return;
    }

    if (images.some((img) => !img.type)) {
      setShowImageTypeErrors(true);
      setError('Please select image type for all photos');
      return;
    }

    if (!user) {
      setError('You must be logged in to upload');
      return;
    }

    setLoading(true);

    try {
      const uploaded = await Promise.all(images.map((img) => uploadSingleImage(img.file)));

      if (uploaded.some((u) => !u)) {
        throw new Error('Failed to upload image');
      }

      const imagesPayload = images.map((img, i) => ({ url: uploaded[i] as string, type: img.type }));

      const { data: foundPerson, error: insertError } = await supabase
        .from('found_persons')
        .insert({
          admin_id: user.id,
          image_url: imagesPayload[0].url,
          image_type: imagesPayload[0].type,
          images: imagesPayload,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      navigate(`/matching-results/${foundPerson.id}`);
    } catch (error) {
      console.error('Submission error:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload. Please try again.');
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
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-slate-400 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-slate-700">Add one or more photos. For each photo, select its type.</p>
                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
                      >
                        Add Photo
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleAddImage}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {images.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {images.map((img, idx) => (
                        <div key={idx} className="border rounded-lg p-3">
                          <img
                            src={img.preview}
                            alt={`photo-${idx}`}
                            className="w-full h-56 object-contain rounded"
                          />

                          <div className="mt-3">
                            <ImageTypeSelector
                              value={img.type}
                              onChange={(v) => updateImageType(idx, v)}
                              error={showImageTypeErrors && !img.type ? 'Image type is required' : ''}
                            />

                            <div className="flex justify-between mt-2">
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="text-sm text-red-600"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ImageIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-sm text-slate-500">
                        No photos yet. Click <button type="button" onClick={() => fileInputRef.current?.click()} className="text-blue-600 underline">Add Photo</button> to upload.
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
                  disabled={loading || images.length === 0 || images.some((img) => !img.type)}
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
