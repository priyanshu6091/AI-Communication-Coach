import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useMediaRecorder from '../hooks/useMediaRecorder';
import { recordingsApi } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import FeedbackPanel from '../components/FeedbackPanel';

interface FeedbackData {
  volume: any;
  clarity: any;
  pitch: any;
  facePosition?: any;
  eyeContact?: any;
  posture?: any;
  gestures?: any;
  suggestions: string[];
}

export default function Record() {
  const navigate = useNavigate();
  const { sendMessage, lastMessage, connected } = useWebSocket();
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [feedback, setFeedback] = useState<FeedbackData>({
    volume: { status: 'good', message: 'Initializing...' },
    clarity: { status: 'good', message: 'Initializing...' },
    pitch: { status: 'good', message: 'Initializing...' },
    suggestions: []
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const recordedBlob = useRef<Blob | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const mediaStreamSource = useRef<MediaStreamAudioSourceNode | null>(null);
  // const { connected, sendMessage } = useWebSocket();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // const audioContext = useRef<AudioContext | null>(null);
  // const analyser = useRef<AnalyserNode | null>(null);
  // const mediaStreamSource = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameId = useRef<number | undefined>(undefined);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage?.type === 'feedback') {
      setFeedback(lastMessage.data);
    }
  }, [lastMessage]);

  const handleDataAvailable = (blob: Blob) => {
    recordedBlob.current = blob;
    if (previewRef.current) {
      previewRef.current.src = URL.createObjectURL(blob);
    }
  };

  const {
    isRecording,
    error: recordingError,
    duration,
    formattedDuration,
    startRecording,
    stopRecording,
    stream
  } = useMediaRecorder({
    onDataAvailable: handleDataAvailable
  });

  // Set up audio analysis when recording starts
  useEffect(() => {
    if (!stream || !isRecording || !connected) return;

    const initAudioAnalysis = async () => {
      try {
        if (!audioContext.current) {
          audioContext.current = new AudioContext();
        }

        if (!analyser.current) {
          analyser.current = audioContext.current.createAnalyser();
          analyser.current.fftSize = 2048;
        }

        if (!mediaStreamSource.current) {
          mediaStreamSource.current = audioContext.current.createMediaStreamSource(stream);
          mediaStreamSource.current.connect(analyser.current);
        }

        setIsAnalyzing(true);
      } catch (error) {
        console.error('Error initializing audio analysis:', error);
        setIsAnalyzing(false);
      }
    };

    initAudioAnalysis();

    return () => {
      setIsAnalyzing(false);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [stream, isRecording, connected]);

  const analyzeAudio = useCallback(() => {
    if (!analyser.current || !isAnalyzing || !connected) return;

    const dataArray = new Uint8Array(analyser.current.frequencyBinCount);
    analyser.current.getByteFrequencyData(dataArray);

    try {
      sendMessage('audio_data', { audio: Array.from(dataArray) });
    } catch (error) {
      console.error('Error sending audio data:', error);
      setIsAnalyzing(false);
      return;
    }

    animationFrameId.current = requestAnimationFrame(analyzeAudio);
  }, [connected, sendMessage, isAnalyzing]);

  useEffect(() => {
    if (isAnalyzing && connected) {
      analyzeAudio();
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isAnalyzing, connected, analyzeAudio]);

  const cleanup = useCallback(() => {
    setIsAnalyzing(false);
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (mediaStreamSource.current) {
      mediaStreamSource.current.disconnect();
      mediaStreamSource.current = null;
    }
    if (analyser.current) {
      analyser.current.disconnect();
      analyser.current = null;
    }
    if (audioContext.current?.state !== 'closed') {
      audioContext.current?.close();
      audioContext.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);
  const handleStartRecording = async () => {
    if (previewRef.current) {
      previewRef.current.src = '';
    }
    recordedBlob.current = null;
    
    // Reset feedback
    setFeedback({
      volume: { status: 'good', message: 'Initializing...' },
      clarity: { status: 'good', message: 'Initializing...' },
      pitch: { status: 'good', message: 'Initializing...' },
      suggestions: []
    });

    await startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();
    
    // Clean up audio analysis
    if (audioContext.current) {
      audioContext.current.close();
    }
  };

  const handleUpload = async () => {
    if (!recordedBlob.current || !title) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('type', 'video');
      formData.append('duration', duration.toString());
      formData.append('recording', recordedBlob.current, `${title}.webm`);

      await recordingsApi.post('/', formData);
      navigate('/recordings');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload recording');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recording Section */}
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Record Your Speech
            </h3>
            
            {/* Error messages */}
            {(recordingError || uploadError || !connected) && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-600 rounded-md p-4 text-sm">
                {!connected ? 'Connecting to analysis server...' : (recordingError || uploadError)}
              </div>
            )}

            {/* Recording preview */}
            <div className="mt-4 aspect-video bg-black rounded-lg overflow-hidden">
              {isRecording ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  ref={previewRef}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Recording controls */}
            <div className="mt-4">
              {!isRecording && !recordedBlob.current && (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  disabled={!connected}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Recording
                </button>
              )}

              {isRecording && (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">{formattedDuration}</span>
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Stop Recording
                  </button>
                </div>
              )}
            </div>

            {/* Upload form */}
            {recordedBlob.current && !isRecording && (
              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Recording Title
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="title"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Enter a title for your recording"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={!title || isUploading}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                      ${(!title || isUploading) ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {isUploading ? 'Uploading...' : 'Upload Recording'}
                  </button>

                  <button
                    type="button"
                    onClick={handleStartRecording}
                    disabled={!connected}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Record Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Section */}
        <div className={`transition-opacity duration-300 ${isRecording ? 'opacity-100' : 'opacity-50'}`}>
          <FeedbackPanel feedback={feedback} showVideo={true} />
        </div>
      </div>
    </div>
  );
}
