import torch
from transformers import pipeline
import librosa
import numpy as np
from typing import Dict, List, Tuple

# Initialize speech recognition model (using Whisper)
asr_pipeline = pipeline("automatic-speech-recognition", model="openai/whisper-base")

# Initialize sentiment analysis model
sentiment_pipeline = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")

# Common filler words to detect
FILLER_WORDS = {
    'um', 'uh', 'er', 'ah', 'like', 'you know', 'sort of', 'kind of',
    'basically', 'literally', 'actually', 'so yeah', 'right'
}

async def analyze_speech(file_path: str) -> Dict:
    """
    Analyze speech for various metrics including clarity, tone, and fluency.
    """
    try:
        # Load audio file
        audio, sr = librosa.load(file_path)
        
        # Get transcript
        transcript = asr_pipeline(file_path)[0]['text']
        
        # Analyze tone (sentiment)
        sentiment_results = sentiment_pipeline(transcript)
        tone_score = sentiment_results[0]['score']
        
        # Analyze fluency
        fluency_metrics = analyze_fluency(audio, sr, transcript)
        
        # Analyze clarity
        clarity_score = analyze_clarity(audio, sr)
        
        # Generate suggestions
        suggestions = generate_suggestions(
            tone_score,
            fluency_metrics['speech_rate'],
            fluency_metrics['filler_word_count'],
            clarity_score
        )
        
        return {
            'transcript': transcript,
            'clarity': {
                'score': clarity_score,
                'pronunciation_score': clarity_score * 0.8  # Simplified metric
            },
            'tone': {
                'score': tone_score,
                'positivity': tone_score,
                'engagement': tone_score * 0.9  # Simplified metric
            },
            'fluency': {
                'score': fluency_metrics['fluency_score'],
                'speech_rate': fluency_metrics['speech_rate'],
                'filler_word_count': fluency_metrics['filler_word_count']
            },
            'confidence': {
                'score': calculate_confidence_score(
                    tone_score,
                    fluency_metrics['fluency_score'],
                    clarity_score
                )
            },
            'suggestions': suggestions
        }
    
    except Exception as e:
        raise Exception(f"Error analyzing speech: {str(e)}")

def analyze_fluency(audio: np.ndarray, sr: int, transcript: str) -> Dict:
    """
    Analyze speech fluency metrics including speech rate and filler words.
    """
    # Calculate speech rate (words per minute)
    words = transcript.split()
    duration_minutes = len(audio) / sr / 60
    speech_rate = len(words) / duration_minutes if duration_minutes > 0 else 0
    
    # Count filler words
    filler_word_count = sum(1 for word in words if word.lower() in FILLER_WORDS)
    
    # Calculate fluency score
    fluency_score = calculate_fluency_score(speech_rate, filler_word_count, len(words))
    
    return {
        'fluency_score': fluency_score,
        'speech_rate': speech_rate,
        'filler_word_count': filler_word_count
    }

def analyze_clarity(audio: np.ndarray, sr: int) -> float:
    """
    Analyze speech clarity using audio features.
    """
    # Extract audio features
    mfccs = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=13)
    spectral_centroid = librosa.feature.spectral_centroid(y=audio, sr=sr)
    
    # Calculate clarity score based on audio features
    mfcc_std = np.std(mfccs)
    centroid_mean = np.mean(spectral_centroid)
    
    # Normalize and combine features for clarity score
    clarity_score = (mfcc_std + centroid_mean) / 2
    clarity_score = min(max(clarity_score / 100, 0), 1)  # Normalize to 0-1
    
    return clarity_score

def calculate_fluency_score(
    speech_rate: float,
    filler_word_count: int,
    total_words: int
) -> float:
    """
    Calculate overall fluency score based on metrics.
    """
    # Ideal speech rate range (120-160 words per minute)
    rate_score = 1.0 - min(abs(speech_rate - 140) / 100, 1.0)
    
    # Filler word penalty
    filler_ratio = filler_word_count / total_words if total_words > 0 else 0
    filler_score = 1.0 - min(filler_ratio * 5, 1.0)
    
    # Combine scores
    fluency_score = (rate_score + filler_score) / 2
    return fluency_score

def calculate_confidence_score(
    tone_score: float,
    fluency_score: float,
    clarity_score: float
) -> float:
    """
    Calculate overall confidence score based on various metrics.
    """
    weights = {
        'tone': 0.3,
        'fluency': 0.4,
        'clarity': 0.3
    }
    
    confidence_score = (
        tone_score * weights['tone'] +
        fluency_score * weights['fluency'] +
        clarity_score * weights['clarity']
    )
    
    return confidence_score

def generate_suggestions(
    tone_score: float,
    speech_rate: float,
    filler_word_count: int,
    clarity_score: float
) -> List[str]:
    """
    Generate personalized suggestions based on analysis results.
    """
    suggestions = []
    
    if tone_score < 0.6:
        suggestions.append(
            "Try to maintain a more positive and engaging tone. "
            "Consider using more dynamic pitch variation."
        )
    
    if speech_rate < 120:
        suggestions.append(
            "Your speech rate is a bit slow. Try to speak slightly faster "
            "while maintaining clarity."
        )
    elif speech_rate > 160:
        suggestions.append(
            "Your speech rate is a bit fast. Try to slow down slightly "
            "to improve clarity and comprehension."
        )
    
    if filler_word_count > 5:
        suggestions.append(
            "Try to reduce the use of filler words like 'um', 'uh', and 'like'. "
            "Practice pausing silently instead."
        )
    
    if clarity_score < 0.6:
        suggestions.append(
            "Focus on clearer pronunciation and articulation. "
            "Practice speaking with more emphasis on consonant sounds."
        )
    
    return suggestions
