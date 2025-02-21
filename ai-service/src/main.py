from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List
import os
from pathlib import Path

# Import analysis modules (to be implemented)
from .speech_analysis import analyze_speech
from .video_analysis import analyze_video

app = FastAPI(title="AI Communication Coach API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class AnalysisResponse(BaseModel):
    transcript: str
    clarity: Dict[str, float]
    tone: Dict[str, float]
    fluency: Dict[str, float]
    confidence: Dict[str, float]
    video_analysis: Optional[Dict[str, Dict[str, float]]]
    suggestions: List[str]

@app.get("/")
async def read_root():
    return {"message": "AI Communication Coach API"}

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_recording(file: UploadFile = File(...)):
    try:
        # Create temp directory if it doesn't exist
        temp_dir = Path("temp")
        temp_dir.mkdir(exist_ok=True)
        
        # Save uploaded file
        file_path = temp_dir / file.filename
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Determine file type and analyze accordingly
        if file.content_type.startswith('audio/'):
            results = await analyze_speech(str(file_path))
            video_analysis = None
        elif file.content_type.startswith('video/'):
            speech_results = await analyze_speech(str(file_path))
            video_results = await analyze_video(str(file_path))
            results = {**speech_results, 'video_analysis': video_results}
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        # Clean up
        os.remove(file_path)
        
        return results
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
