import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import RecordingCard from '../components/RecordingCard';

interface Recording {
  _id: string;
  title: string;
  createdAt: string;
  duration: number;
  analysis: {
    clarity: { score: number };
    fluency: { score: number };
    confidence: { score: number };
    suggestions: string[];
  };
  fileUrl: string;
}

export default function Recordings() {
  const navigate = useNavigate();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [filterBy, setFilterBy] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      const response = await api.get('/recordings');
      setRecordings(response.data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recordings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this recording?')) {
      return;
    }

    try {
      await api.delete(`/recordings/${id}`);
      setRecordings(recordings.filter(rec => rec._id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete recording');
    }
  };

  const getSortedRecordings = () => {
    let filtered = [...recordings];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(rec =>
        rec.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(rec => {
        const score = rec.analysis[filterBy as keyof typeof rec.analysis].score;
        return score >= 0.7; // Show only recordings with high scores in the selected category
      });
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'score':
          const scoreA = (
            a.analysis.clarity.score +
            a.analysis.fluency.score +
            a.analysis.confidence.score
          ) / 3;
          const scoreB = (
            b.analysis.clarity.score +
            b.analysis.fluency.score +
            b.analysis.confidence.score
          ) / 3;
          return scoreB - scoreA;
        case 'duration':
          return b.duration - a.duration;
        default:
          return 0;
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Recordings</h1>
        <button
          onClick={() => navigate('/record')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          New Recording
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search recordings..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
              Sort by
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="date">Date</option>
              <option value="score">Score</option>
              <option value="duration">Duration</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by
            </label>
            <select
              id="filter"
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">All Recordings</option>
              <option value="clarity">High Clarity</option>
              <option value="fluency">High Fluency</option>
              <option value="confidence">High Confidence</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {getSortedRecordings().map(recording => (
          <RecordingCard
            key={recording._id}
            recording={recording}
            onDelete={handleDelete}
          />
        ))}
        {getSortedRecordings().length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recordings found</h3>
            <p className="text-gray-500">
              {searchTerm || filterBy !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start by creating your first recording'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
