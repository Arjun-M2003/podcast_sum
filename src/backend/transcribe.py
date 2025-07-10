import whisper
import requests
import os
import tempfile
import logging
from typing import Dict, Optional
import torch

logger = logging.getLogger(__name__)

# Load Whisper model (use 'base' for faster processing, 'large' for better accuracy)
MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "base")
logger.info(f"Loading Whisper model: {MODEL_SIZE}")

# Check if CUDA is available
device = "cuda" if torch.cuda.is_available() else "cpu"
logger.info(f"Using device: {device}")

model = whisper.load_model(MODEL_SIZE, device=device)

async def transcribe_audio(s3_url: str, s3_key: str, format: str) -> Dict:
    """
    Download audio/video from S3 and transcribe using Whisper
    
    Args:
        s3_url: Direct S3 URL to the file
        s3_key: S3 key for the file
        format: 'audio' or 'video'
    
    Returns:
        Dict containing transcript and metadata
    """
    try:
        logger.info(f"Starting transcription for {s3_key}")
        
        # Create cache directory if it doesn't exist
        cache_dir = "/app/cache"
        os.makedirs(cache_dir, exist_ok=True)
        
        # Generate local filename
        file_extension = _get_file_extension(s3_key)
        local_filename = f"{cache_dir}/{s3_key.split('/')[-1]}"
        
        # Download file from S3
        logger.info(f"Downloading file from {s3_url}")
        await _download_file(s3_url, local_filename)
        
        # Transcribe using Whisper
        logger.info("Starting Whisper transcription")
        result = model.transcribe(
            local_filename,
            task="transcribe",
            fp16=False,  # Use fp32 for better stability
            verbose=True
        )
        
        # Clean up local file
        _cleanup_file(local_filename)
        
        logger.info(f"Transcription completed for {s3_key}")
        
        return {
            "transcript": result["text"].strip(),
            "language": result.get("language"),
            "duration_seconds": result.get("duration"),
            "segments": result.get("segments", [])
        }
        
    except Exception as e:
        logger.error(f"Transcription failed for {s3_key}: {str(e)}")
        # Clean up file if it exists
        if 'local_filename' in locals():
            _cleanup_file(local_filename)
        raise e

async def _download_file(url: str, local_path: str) -> None:
    """Download file from URL to local path"""
    try:
        response = requests.get(url, stream=True, timeout=300)
        response.raise_for_status()
        
        with open(local_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        
        logger.info(f"File downloaded successfully to {local_path}")
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to download file from {url}: {str(e)}")
        raise Exception(f"Failed to download file: {str(e)}")

def _get_file_extension(s3_key: str) -> str:
    """Extract file extension from S3 key"""
    return s3_key.split('.')[-1].lower()

def _cleanup_file(file_path: str) -> None:
    """Remove local file if it exists"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Cleaned up file: {file_path}")
    except Exception as e:
        logger.warning(f"Failed to clean up file {file_path}: {str(e)}")

def get_supported_formats() -> Dict[str, list]:
    """Return supported audio and video formats"""
    return {
        "audio": ["mp3", "wav", "m4a", "aac", "ogg", "flac", "wma"],
        "video": ["mp4", "mov", "avi", "mkv", "webm", "flv", "wmv"]
    }