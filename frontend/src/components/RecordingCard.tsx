import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

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

interface RecordingCardProps {
  recording: Recording;
  onDelete: (id: string) => void;
}

export default function RecordingCard({ recording, onDelete }: RecordingCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const averageScore = (
    (recording.analysis.clarity.score +
      recording.analysis.fluency.score +
      recording.analysis.confidence.score) /
    3 *
    100
  ).toFixed(1);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlay = () => {
    const audio = new Audio(recording.fileUrl);
    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.play();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{recording.title}</h3>
          <p className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(recording.createdAt), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePlay}
            className="text-indigo-600 hover:text-indigo-800"
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => onDelete(recording._id)}
            className="text-red-600 hover:text-red-800"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Duration: {formatDuration(recording.duration)}</span>
          <span>Score: {averageScore}%</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-green-50 rounded p-2 text-center">
            <div className="text-green-700 font-semibold">
              {(recording.analysis.clarity.score * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-green-600">Clarity</div>
          </div>
          <div className="bg-blue-50 rounded p-2 text-center">
            <div className="text-blue-700 font-semibold">
              {(recording.analysis.fluency.score * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-blue-600">Fluency</div>
          </div>
          <div className="bg-purple-50 rounded p-2 text-center">
            <div className="text-purple-700 font-semibold">
              {(recording.analysis.confidence.score * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-purple-600">Confidence</div>
          </div>
        </div>
      </div>

      <div>
        <button
          onClick={() => setShowAnalysis(!showAnalysis)}
          className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
        >
          {showAnalysis ? 'Hide Analysis' : 'Show Analysis'}
          <svg
            className={`w-4 h-4 ml-1 transform transition-transform ${
              showAnalysis ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {showAnalysis && (
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold text-gray-900">Suggestions for Improvement:</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              {recording.analysis.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
