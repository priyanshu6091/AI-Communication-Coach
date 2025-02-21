import pytest
from src.speech_analysis import (
    calculate_fluency_score,
    calculate_confidence_score,
    generate_suggestions
)

def test_fluency_score():
    # Test ideal speech rate
    score = calculate_fluency_score(140, 0, 100)
    assert score >= 0.9, "Perfect speech rate should yield high score"
    
    # Test too slow
    score = calculate_fluency_score(80, 0, 100)
    assert score < 0.9, "Too slow speech should reduce score"
    
    # Test too fast
    score = calculate_fluency_score(200, 0, 100)
    assert score < 0.9, "Too fast speech should reduce score"
    
    # Test filler words
    score = calculate_fluency_score(140, 10, 100)
    assert score < 0.9, "High filler word count should reduce score"

def test_confidence_score():
    score = calculate_confidence_score(0.8, 0.7, 0.9)
    assert 0 <= score <= 1, "Confidence score should be between 0 and 1"
    
    perfect_score = calculate_confidence_score(1.0, 1.0, 1.0)
    assert perfect_score == 1.0, "Perfect metrics should yield maximum score"
    
    low_score = calculate_confidence_score(0.2, 0.3, 0.1)
    assert low_score < 0.5, "Low metrics should yield low score"

def test_generate_suggestions():
    # Test low tone score
    suggestions = generate_suggestions(0.4, 140, 2, 0.8)
    assert any("tone" in s.lower() for s in suggestions), "Should suggest tone improvement"
    
    # Test high speech rate
    suggestions = generate_suggestions(0.8, 180, 2, 0.8)
    assert any("slow down" in s.lower() for s in suggestions), "Should suggest slowing down"
    
    # Test many filler words
    suggestions = generate_suggestions(0.8, 140, 10, 0.8)
    assert any("filler" in s.lower() for s in suggestions), "Should suggest reducing filler words"
    
    # Test low clarity
    suggestions = generate_suggestions(0.8, 140, 2, 0.4)
    assert any("pronunciation" in s.lower() for s in suggestions), "Should suggest clarity improvement"
    
    # Test good performance
    suggestions = generate_suggestions(0.9, 140, 2, 0.9)
    assert len(suggestions) == 0, "Should not give suggestions for good performance"
