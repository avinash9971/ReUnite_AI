import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase, MissingPerson } from '../lib/supabase';
import { Search, Users, UserCheck, Clock, AlertCircle, Upload, CheckCircle } from 'lucide-react';

export function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [missingPersons, setMissingPersons] = useState<MissingPerson[]>([]);
  const [filteredPersons, setFilteredPersons] = useState<MissingPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'found' | 'closed'>('all');

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    found: 0,
    closed: 0,
  });

  useEffect(() => {
    if (!authLoading && (!profile || profile.role !== 'admin')) {
      navigate('/admin-login');
    }
  }, [profile, authLoading, navigate]);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setTimeout(() => setSuccessMessage(''), 5000);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchMissingPersons();
    }
  }, [profile]);

  useEffect(() => {
    filterPersons();
  }, [missingPersons, searchTerm, statusFilter]);

  const fetchMissingPersons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('missing_persons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMissingPersons(data || []);

      const active = data?.filter(p => p.status === 'active').length || 0;
      const found = data?.filter(p => p.status === 'found').length || 0;
      const closed = data?.filter(p => p.status === 'closed').length || 0;

      setStats({
        total: data?.length || 0,
        active,
        found,
        closed,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const filterPersons = () => {
    let filtered = missingPersons;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.full_name.toLowerCase().includes(term) ||
        p.aadhaar_number.includes(term) ||
        p.missing_from.toLowerCase().includes(term)
      );
    }

    setFilteredPersons(filtered);
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600 mt-2">Manage missing person reports and found persons</p>
        </div>

        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="mb-8 bg-gradient-to-r from-slate-700 to-slate-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-white mb-4 md:mb-0">
                <h2 className="text-2xl font-bold mb-2">Upload Found Person</h2>
                <p className="text-slate-200">
                  Use AI-powered facial recognition to match found persons with missing person reports
                </p>
              </div>
              <button
                onClick={() => navigate('/upload-found-person')}
                className="flex items-center space-x-3 px-6 py-3 bg-white hover:bg-slate-50 text-slate-900 font-semibold rounded-lg transition-colors shadow-md"
              >
                <Upload className="w-5 h-5" />
                <span>Upload Image</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Reports</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-80" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Cases</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.active}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-500 opacity-80" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Found</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.found}</p>
              </div>
              <UserCheck className="w-12 h-12 text-green-500 opacity-80" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-slate-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Closed</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.closed}</p>
              </div>
              <Users className="w-12 h-12 text-slate-500 opacity-80" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Missing Persons Database</h2>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, Aadhaar, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    statusFilter === 'active'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setStatusFilter('found')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    statusFilter === 'found'
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Found
                </button>
                <button
                  onClick={() => setStatusFilter('closed')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    statusFilter === 'closed'
                      ? 'bg-slate-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Closed
                </button>
              </div>
            </div>
          </div>

          {filteredPersons.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">
                {missingPersons.length === 0
                  ? 'No missing person reports yet'
                  : 'No results found for your search'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Age / Gender
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Missing From
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Aadhaar
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Reported On
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredPersons.map((person) => (
                    <tr key={person.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{person.full_name}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {person.age} yrs / {person.gender}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-slate-900">{person.missing_from}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900 font-mono">
                          {person.aadhaar_number}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            person.status === 'active'
                              ? 'bg-yellow-100 text-yellow-800'
                              : person.status === 'found'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {person.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600">
                          {new Date(person.created_at).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
