# AI Communication Coach - AI Service

This service provides AI-powered analysis of speech and video recordings for the AI Communication Coach application.

## Features

- Speech-to-text transcription using OpenAI's Whisper model
- Tone and sentiment analysis
- Speech fluency analysis (speech rate, filler words)
- Facial expression analysis
- Body language analysis
- Personalized feedback and suggestions

## Setup

1. Create a Python virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Copy `.env.example` to `.env` and configure as needed.

## Running the Service

Start the FastAPI server:
```bash
uvicorn src.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Endpoints

- `GET /`: Health check endpoint
- `POST /analyze`: Analyze a video or audio recording
  - Accepts multipart/form-data with a file
  - Returns analysis results including:
    - Transcript
    - Clarity metrics
    - Tone analysis
    - Fluency metrics
    - Video analysis (if video file)
    - Suggestions for improvement

## Testing

Run tests using pytest:
```bash
pytest tests/
```

## Models Used

- Speech Recognition: OpenAI Whisper (base model)
- Sentiment Analysis: DistilBERT
- Face and Pose Detection: MediaPipe

## Development

The service is structured into several components:

- `src/main.py`: FastAPI application and routes
- `src/speech_analysis.py`: Speech processing and analysis
- `src/video_analysis.py`: Video processing and analysis
- `tests/`: Test files

## Contributing

1. Create a new branch for your feature
2. Write tests for new functionality
3. Ensure all tests pass
4. Submit a pull request
