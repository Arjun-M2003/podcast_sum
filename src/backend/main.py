from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from transcribe import transcribe_audio
from summarize import summarize_text
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Podcast Summarizer API",
    description="AI-powered podcast transcription and summarization service",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class TranscribeRequest(BaseModel):
    s3_url: str
    s3_key: str
    format: str  # 'audio' or 'video'

class SummarizeRequest(BaseModel):
    s3_url: str
    s3_key: str
    format: str
    summary_type: Optional[str] = "comprehensive"  # comprehensive, brief, key_points

class TranscribeResponse(BaseModel):
    transcript: str
    duration_seconds: Optional[float]
    language: Optional[str]

class SummaryResponse(BaseModel):
    summary: str
    key_points: list[str]
    transcript: str
    duration_seconds: Optional[float]

@app.get("/")
async def root():
    return {"message": "Podcast Summarizer API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_podcast(request: TranscribeRequest):
    """
    Transcribe audio/video file from S3 URL
    """
    try:
        logger.info(f"Starting transcription for {request.s3_key}")
        
        # Transcribe the audio
        result = await transcribe_audio(
            s3_url=request.s3_url,
            s3_key=request.s3_key,
            format=request.format
        )
        
        logger.info(f"Transcription completed for {request.s3_key}")
        
        return TranscribeResponse(
            transcript=result["transcript"],
            duration_seconds=result.get("duration_seconds"),
            language=result.get("language")
        )
    
    except Exception as e:
        logger.error(f"Transcription failed for {request.s3_key}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@app.post("/summarize", response_model=SummaryResponse)
async def summarize_podcast(request: SummarizeRequest):
    """
    Transcribe and summarize audio/video file from S3 URL
    """
    try:
        logger.info(f"Starting transcription and summarization for {request.s3_key}")
        
        # First transcribe the audio
        transcription_result = await transcribe_audio(
            s3_url=request.s3_url,
            s3_key=request.s3_key,
            format=request.format
        )
        
        transcript = transcription_result["transcript"]
        logger.info(f"Transcription completed, starting summarization for {request.s3_key}")
        
        # Then summarize the transcript
        summary_result = await summarize_text(
            transcript=transcript,
            summary_type=request.summary_type
        )
        
        logger.info(f"Summarization completed for {request.s3_key}")
        
        return SummaryResponse(
            summary=summary_result["summary"],
            key_points=summary_result["key_points"],
            transcript=transcript,
            duration_seconds=transcription_result.get("duration_seconds")
        )
    
    except Exception as e:
        logger.error(f"Summarization failed for {request.s3_key}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)