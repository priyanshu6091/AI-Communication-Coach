import React from 'react';

interface FeedbackMetric {
  score?: number;
  level?: number;
  variation?: number;
  status: string;
  message: string;
}

interface FeedbackData {
  volume: FeedbackMetric;
  clarity: FeedbackMetric;
  pitch: FeedbackMetric;
  facePosition?: FeedbackMetric;
  eyeContact?: FeedbackMetric;
  posture?: FeedbackMetric;
  gestures?: FeedbackMetric;
  suggestions: string[];
}

interface FeedbackPanelProps {
  feedback: FeedbackData;
  showVideo?: boolean;
}

export default function FeedbackPanel({ feedback, showVideo = false }: FeedbackPanelProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'good':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderMetric = (label: string, metric: FeedbackMetric) => {
    const statusColor = getStatusColor(metric.status);
    const score = metric.score || metric.level || metric.variation;

    return (
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-700">{label}</h4>
          <p className="text-xs text-gray-500">{metric.message}</p>
        </div>
        <div className={`ml-4 px-3 py-1 rounded-full ${statusColor}`}>
          {score ? `${(score * 100).toFixed(0)}%` : metric.status}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Feedback</h3>
      
      <div className="space-y-2">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Audio Metrics</h4>
          {renderMetric('Volume', feedback.volume)}
          {renderMetric('Clarity', feedback.clarity)}
          {renderMetric('Pitch', feedback.pitch)}
        </div>

        {showVideo && (
          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Video Metrics</h4>
            {feedback.facePosition && renderMetric('Face Position', feedback.facePosition)}
            {feedback.eyeContact && renderMetric('Eye Contact', feedback.eyeContact)}
            {feedback.posture && renderMetric('Posture', feedback.posture)}
            {feedback.gestures && renderMetric('Gestures', feedback.gestures)}
          </div>
        )}

        {feedback.suggestions.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Suggestions</h4>
            <ul className="space-y-2">
              {feedback.suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="flex items-start text-sm text-gray-600"
                >
                  <span className="flex-shrink-0 w-5 h-5 text-blue-500 mr-2">
                    <svg
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
