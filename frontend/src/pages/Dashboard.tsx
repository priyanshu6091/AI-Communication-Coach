import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ProgressData {
  dates: string[];
  scores: {
    clarity: number[];
    fluency: number[];
    confidence: number[];
  };
}

interface StatsSummary {
  totalRecordings: number;
  averageScore: number;
  improvementRate: number;
  practiceTime: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState<ProgressData>({
    dates: [],
    scores: {
      clarity: [],
      fluency: [],
      confidence: []
    }
  });
  const [stats, setStats] = useState<StatsSummary>({
    totalRecordings: 0,
    averageScore: 0,
    improvementRate: 0,
    practiceTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [progressRes, statsRes] = await Promise.all([
          api.get('/recordings/progress'),
          api.get('/recordings/stats')
        ]);
        setProgressData(progressRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const progressChartData = {
    labels: progressData.dates,
    datasets: [
      {
        label: 'Clarity',
        data: progressData.scores.clarity,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      },
      {
        label: 'Fluency',
        data: progressData.scores.fluency,
        borderColor: 'rgb(153, 102, 255)',
        tension: 0.1
      },
      {
        label: 'Confidence',
        data: progressData.scores.confidence,
        borderColor: 'rgb(255, 159, 64)',
        tension: 0.1
      }
    ]
  };

  const progressChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Your Progress Over Time'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    }
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's an overview of your communication progress
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Total Recordings</h3>
          <p className="text-3xl font-bold text-indigo-600 mt-2">
            {stats.totalRecordings}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Average Score</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {stats.averageScore.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Improvement</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            +{stats.improvementRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Practice Time</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {Math.round(stats.practiceTime / 60)}h {stats.practiceTime % 60}m
          </p>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <Line data={progressChartData} options={progressChartOptions} />
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {/* Add recent activity items here */}
            <p className="text-gray-600">No recent activity</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-4">
            <button
              onClick={() => window.location.href = '/record'}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Start New Recording
            </button>
            <button
              onClick={() => window.location.href = '/recordings'}
              className="w-full bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              View All Recordings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
