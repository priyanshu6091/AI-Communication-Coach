import { useState, useRef, useCallback, useEffect } from 'react';

interface UseMediaRecorderProps {
  onDataAvailable?: (blob: Blob) => void;
  onAudioData?: (data: Float32Array) => void;
  mimeType?: string;
}

export default function useMediaRecorder({ 
  onDataAvailable,
  onAudioData,
  mimeType = 'video/webm'
}: UseMediaRecorderProps = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string>('');
  const [duration, setDuration] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<NodeJS.Timeout>();
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const animationFrame = useRef<number>();

  // Clean up function for audio analysis
  const cleanupAudioAnalysis = useCallback(() => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    if (audioContext.current) {
      audioContext.current.close();
      audioContext.current = null;
    }
    analyser.current = null;
  }, []);

  // Set up audio analysis
  const setupAudioAnalysis = useCallback(() => {
    if (!stream.current || !onAudioData) return;

    try {
      // Create audio context and analyser
      audioContext.current = new AudioContext();
      analyser.current = audioContext.current.createAnalyser();
      analyser.current.fftSize = 2048;

      // Connect stream to analyser
      const source = audioContext.current.createMediaStreamSource(stream.current);
      source.connect(analyser.current);

      // Start analysis loop
      const analyzeAudio = () => {
        if (!analyser.current || !isRecording) return;

        const dataArray = new Float32Array(analyser.current.frequencyBinCount);
        analyser.current.getFloatTimeDomainData(dataArray);
        onAudioData(dataArray);

        animationFrame.current = requestAnimationFrame(analyzeAudio);
      };

      analyzeAudio();
    } catch (err) {
      console.error('Error setting up audio analysis:', err);
    }
  }, [onAudioData, isRecording]);

  const startRecording = useCallback(async () => {
    try {
      // Reset states
      setError('');
      setDuration(0);
      cleanupAudioAnalysis();

      // Get media stream
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });

      // Create media recorder
      mediaRecorder.current = new MediaRecorder(stream.current, {
        mimeType
      });

      // Set up data handling
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0 && onDataAvailable) {
          onDataAvailable(event.data);
        }
      };

      // Start recording
      mediaRecorder.current.start();
      setIsRecording(true);

      // Set up audio analysis if needed
      if (onAudioData) {
        setupAudioAnalysis();
      }

      // Start duration timer
      timer.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to start recording');
      console.error('Error starting recording:', err);
    }
  }, [mimeType, onDataAvailable, onAudioData, cleanupAudioAnalysis, setupAudioAnalysis]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      stream.current?.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timer.current) {
        clearInterval(timer.current);
      }
      cleanupAudioAnalysis();
    }
  }, [isRecording, cleanupAudioAnalysis]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearInterval(timer.current);
      }
      cleanupAudioAnalysis();
      if (stream.current) {
        stream.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [cleanupAudioAnalysis]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isRecording,
    error,
    duration,
    formattedDuration: formatDuration(duration),
    startRecording,
    stopRecording,
    stream: stream.current
  };
}
