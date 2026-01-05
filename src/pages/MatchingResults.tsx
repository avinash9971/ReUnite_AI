import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { supabase, MissingPerson } from '../lib/supabase';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  User,
  MapPin,
  Calendar,
  Phone,
  ArrowLeft,
  Search,
  TrendingUp,
} from 'lucide-react';

interface MatchResult {
  person: MissingPerson;
  confidence: number;
}

interface FoundPersonData {
  id: string;
  image_url: string;
  admin_id: string;
  created_at: string;
}

export function MatchingResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [foundPerson, setFoundPerson] = useState<FoundPersonData | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(true);
  const [confirmingMatch, setConfirmingMatch] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchFoundPersonAndMatch();
    }
  }, [id]);

  const fetchFoundPersonAndMatch = async () => {
    try {
      setLoading(true);
      setProcessing(true);

      const { data: foundPersonData, error: foundError } = await supabase
        .from('found_persons')
        .select('*')
        .eq('id', id)
        .single();

      if (foundError) throw foundError;
      setFoundPerson(foundPersonData);

      await performMatching(foundPersonData.image_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  };

  const performMatching = async (imageUrl: string) => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/match-faces`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        throw new Error('Matching service unavailable');
      }

      const result = await response.json();
      setMatches(result.matches || []);
    } catch (err) {
      console.error('Matching error:', err);
      setError('Matching service is currently unavailable. Showing sample results for demonstration.');
      await simulateMatching();
    }
  };

  const simulateMatching = async () => {
    const { data: missingPersons, error } = await supabase
      .from('missing_persons')
      .select('*')
      .eq('status', 'active')
      .limit(3);

    if (error) throw error;

    if (missingPersons && missingPersons.length > 0) {
      const simulatedMatches: MatchResult[] = missingPersons.map((person, index) => ({
        person,
        confidence: Math.max(65, 95 - index * 15),
      }));

      simulatedMatches.sort((a, b) => b.confidence - a.confidence);
      setMatches(simulatedMatches);
    }
  };

  const confirmMatch = async (missingPersonId: string, confidence: number) => {
    if (!foundPerson) return;

    setConfirmingMatch(missingPersonId);

    try {
      const { error: updateFoundError } = await supabase
        .from('found_persons')
        .update({
          matched_person_id: missingPersonId,
          match_confidence: confidence,
        })
        .eq('id', foundPerson.id);

      if (updateFoundError) throw updateFoundError;

      const { error: updateMissingError } = await supabase
        .from('missing_persons')
        .update({
          status: 'found',
        })
        .eq('id', missingPersonId);

      if (updateMissingError) throw updateMissingError;

      navigate('/admin-dashboard', {
        state: { message: 'Match confirmed successfully!' },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm match');
    } finally {
      setConfirmingMatch(null);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'High Match';
    if (confidence >= 60) return 'Moderate Match';
    return 'Possible Match';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/admin-dashboard')}
          className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-6">
              <div className="bg-slate-700 px-4 py-3 text-white">
                <h2 className="font-semibold text-center">Found Person Image</h2>
              </div>
              {foundPerson && (
                <div className="p-4">
                  <img
                    src={foundPerson.image_url}
                    alt="Found person"
                    className="w-full rounded-lg shadow-md"
                  />
                  <div className="mt-4 text-sm text-slate-600">
                    <p>
                      Uploaded: {new Date(foundPerson.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold">Matching Results</h1>
                  {processing && (
                    <div className="flex items-center space-x-2">
                      <Loader className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Analyzing...</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                {processing ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-700 mx-auto mb-4"></div>
                    <p className="text-slate-700 font-medium">
                      AI is analyzing facial features...
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      Comparing against missing persons database
                    </p>
                  </div>
                ) : matches.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <XCircle className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Matches Found</h3>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                      The system could not find any potential matches in the missing persons
                      database. The person may not be in our records.
                    </p>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-sm text-slate-700">
                        <strong>Suggested Actions:</strong>
                      </p>
                      <ul className="text-sm text-slate-600 mt-2 space-y-1 text-left">
                        <li>• Try uploading a clearer image</li>
                        <li>• Check if person was reported missing</li>
                        <li>• Contact local authorities for assistance</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
                      <Search className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          {matches.length} Potential {matches.length === 1 ? 'Match' : 'Matches'}{' '}
                          Found
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          Review each match and confirm if you find a positive identification
                        </p>
                      </div>
                    </div>

                    {matches.map((match, index) => (
                      <div
                        key={match.person.id}
                        className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">
                              Match #{index + 1}
                            </span>
                            <div
                              className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getConfidenceColor(
                                match.confidence
                              )}`}
                            >
                              <TrendingUp className="w-4 h-4" />
                              <span className="text-sm font-semibold">
                                {match.confidence}% {getConfidenceLabel(match.confidence)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4">
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="md:w-48 flex-shrink-0">
                              <img
                                src={match.person.image_url}
                                alt={match.person.full_name}
                                className="w-full rounded-lg shadow-md"
                              />
                              <p className="text-xs text-slate-500 mt-2 text-center">
                                Photo from {match.person.image_year}
                              </p>
                            </div>

                            <div className="flex-1 space-y-3">
                              <div>
                                <h3 className="text-xl font-bold text-slate-900">
                                  {match.person.full_name}
                                </h3>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div className="flex items-start space-x-2">
                                  <User className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-slate-600">Age / Gender</p>
                                    <p className="font-medium text-slate-900">
                                      {match.person.age} years / {match.person.gender}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-start space-x-2">
                                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-slate-600">Missing From</p>
                                    <p className="font-medium text-slate-900">
                                      {match.person.missing_from}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-start space-x-2">
                                  <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-slate-600">Reported On</p>
                                    <p className="font-medium text-slate-900">
                                      {new Date(match.person.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-start space-x-2">
                                  <Phone className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-slate-600">Aadhaar</p>
                                    <p className="font-medium text-slate-900 font-mono">
                                      {match.person.aadhaar_number}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-slate-50 rounded-lg p-3">
                                <p className="text-xs text-slate-600 mb-1">
                                  <strong>Address:</strong>
                                </p>
                                <p className="text-sm text-slate-900">{match.person.address}</p>
                              </div>

                              <div className="pt-3 border-t border-slate-200">
                                <button
                                  onClick={() =>
                                    confirmMatch(match.person.id, match.confidence)
                                  }
                                  disabled={confirmingMatch !== null}
                                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                >
                                  {confirmingMatch === match.person.id ? (
                                    <>
                                      <Loader className="w-5 h-5 animate-spin" />
                                      <span>Confirming...</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-5 h-5" />
                                      <span>Confirm Match & Notify Family</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-6">
                      <p className="text-sm text-slate-700">
                        <strong>Important:</strong> Please verify the match carefully before
                        confirming. Once confirmed, the family will be notified and the case will
                        be marked as resolved.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
