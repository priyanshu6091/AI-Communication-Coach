# AI Communication Coach(Under development)

An intelligent speech training application that helps users improve their communication skills through AI-powered feedback.

## Features

- Real-time video/audio recording and analysis
- Speech-to-text transcription
- Tone and sentiment analysis
- Filler word detection
- Fluency and confidence metrics
- Progress tracking and analytics
- Optional video analysis for facial expressions and body language

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- AI Processing: Python + FastAPI
- Database: MongoDB
- Authentication: JWT

## Project Structure

```
ai-communication-coach/
├── frontend/               # React + Vite frontend
├── backend/               # Node.js + Express backend
├── ai-service/            # Python FastAPI service
└── docker/                # Docker configuration files
```

## Getting Started

### Prerequisites

- Node.js >= 18
- Python >= 3.8
- MongoDB
- Docker (optional)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install

# AI Service
cd ../ai-service
pip install -r requirements.txt
```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in each service directory
   - Update the variables with your configuration

4. Start the services:

```bash
# Frontend
cd frontend
npm run dev

# Backend
cd ../backend
npm run dev

# AI Service
cd ../ai-service
uvicorn main:app --reload
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
