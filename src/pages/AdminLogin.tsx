import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Shield, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import logo from '../assets/ddu-logo.png';


export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profile) {
          setError('Profile not found. Please contact administrator.');
          await supabase.auth.signOut();
          return;
        }

        if (profile.role !== 'admin') {
          setError('Access denied. This login is for administrators only.');
          await supabase.auth.signOut();
          return;
        }

        navigate('/admin-dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-white shadow-md py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-white">
              <img
                src={logo}
                alt="DDU College logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900">Deen Dayal Upadhyaya College</h1>
              <p className="text-sm text-slate-600">University of Delhi</p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex-1 flex items-center justify-center px-4 py-12"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url(https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-XUELrZHJHVM2IcTnliOZv3Z4bsUSLedgfQ&s)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-8 text-white">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Shield className="w-10 h-10 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-center">Administrator Login</h2>
              <p className="text-center text-slate-200 mt-2 text-sm">
                Government & Police Officials Portal
              </p>
            </div>

            <div className="px-6 py-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Official Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-slate-600 text-slate-900 placeholder-slate-400"
                      placeholder="Enter your official email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-slate-600 text-slate-900 placeholder-slate-400"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-700 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing in...' : 'Sign In as Admin'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <button
                  onClick={() => navigate('/user-login')}
                  className="w-full text-center text-sm text-slate-600 hover:text-slate-900 font-medium"
                >
                  Are you a Citizen? Click here to login
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-white bg-black bg-opacity-50 px-4 py-2 rounded-lg inline-block">
              BringHome AI - Administrator Portal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
