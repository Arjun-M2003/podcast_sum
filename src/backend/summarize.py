import openai
import os
import logging
from typing import Dict, List
import re

logger = logging.getLogger(__name__)

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")
client = openai.OpenAI()

async def summarize_text(transcript: str, summary_type: str = "comprehensive") -> Dict:
    """
    Summarize transcript using OpenAI GPT
    
    Args:
        transcript: The full transcript text
        summary_type: Type of summary ('comprehensive', 'brief', 'key_points')
    
    Returns:
        Dict containing summary and key points
    """
    try:
        logger.info(f"Starting {summary_type} summarization")
        
        # Validate inputs
        if not transcript or not transcript.strip():
            raise ValueError("Transcript is empty or invalid")
        
        if not openai.api_key:
            raise ValueError("OpenAI API key not configured")
        
        # Prepare prompts based on summary type
        prompts = _get_prompts(summary_type)
        
        # Generate summary
        summary = await _generate_summary(transcript, prompts["summary"])
        
        # Generate key points
        key_points = await _generate_key_points(transcript, prompts["key_points"])
        
        logger.info("Summarization completed successfully")
        
        return {
            "summary": summary,
            "key_points": key_points,
            "summary_type": summary_type
        }
        
    except Exception as e:
        logger.error(f"Summarization failed: {str(e)}")
        raise e

async def _generate_summary(transcript: str, prompt_template: str) -> str:
    """Generate summary using OpenAI"""
    try:
        # Split transcript into chunks if too long
        chunks = _split_transcript(transcript)
        
        if len(chunks) == 1:
            # Single chunk - direct summarization
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": prompt_template},
                    {"role": "user", "content": f"Transcript:\n{transcript}"}
                ],
                max_tokens=1500,
                temperature=0.3
            )
            return response.choices[0].message.content.strip()
        
        else:
            # Multiple chunks - summarize each then combine
            chunk_summaries = []
            
            for i, chunk in enumerate(chunks):
                logger.info(f"Summarizing chunk {i+1}/{len(chunks)}")
                
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "Summarize this portion of a podcast transcript concisely while preserving key information."},
                        {"role": "user", "content": f"Transcript portion:\n{chunk}"}
                    ],
                    max_tokens=500,
                    temperature=0.3
                )
                chunk_summaries.append(response.choices[0].message.content.strip())
            
            # Combine chunk summaries
            combined_summary = "\n\n".join(chunk_summaries)
            
            # Final summarization
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": prompt_template},
                    {"role": "user", "content": f"Combined summaries:\n{combined_summary}"}
                ],
                max_tokens=1500,
                temperature=0.3
            )
            return response.choices[0].message.content.strip()
            
    except Exception as e:
        logger.error(f"Summary generation failed: {str(e)}")
        raise e

async def _generate_key_points(transcript: str, prompt_template: str) -> List[str]:
    """Generate key points using OpenAI"""
    try:
        # Use first chunk or full transcript if short
        text_for_analysis = _split_transcript(transcript, max_length=8000)[0]
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": prompt_template},
                {"role": "user", "content": f"Transcript:\n{text_for_analysis}"}
            ],
            max_tokens=800,
            temperature=0.3
        )
        
        # Parse key points from response
        key_points_text = response.choices[0].message.content.strip()
        key_points = _parse_key_points(key_points_text)
        
        return key_points
        
    except Exception as e:
        logger.error(f"Key points generation failed: {str(e)}")
        raise e

def _split_transcript(transcript: str, max_length: int = 12000) -> List[str]:
    """Split transcript into chunks for processing"""
    if len(transcript) <= max_length:
        return [transcript]
    
    chunks = []
    words = transcript.split()
    current_chunk = []
    current_length = 0
    
    for word in words:
        word_length = len(word) + 1  # +1 for space
        
        if current_length + word_length > max_length and current_chunk:
            chunks.append(" ".join(current_chunk))
            current_chunk = [word]
            current_length = word_length
        else:
            current_chunk.append(word)
            current_length += word_length
    
    if current_chunk:
        chunks.append(" ".join(current_chunk))
    
    return chunks

def _parse_key_points(text: str) -> List[str]:
    """Parse key points from GPT response"""
    # Look for numbered lists or bullet points
    lines = text.split('\n')
    key_points = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Remove numbering and bullet points
        line = re.sub(r'^\d+\.\s*', '', line)
        line = re.sub(r'^[-•*]\s*', '', line)
        
        if line and len(line) > 10:  # Filter out very short lines
            key_points.append(line)
    
    return key_points[:10]  # Limit to 10 key points

def _get_prompts(summary_type: str) -> Dict[str, str]:
    """Get prompts based on summary type"""
    prompts = {
        "comprehensive": {
            "summary": """You are an expert at summarizing podcast content. Create a comprehensive summary of the following podcast transcript that captures:
- Main topics and themes discussed
- Key insights and takeaways
- Important details and context
- Overall narrative flow

The summary should be detailed but concise. The summary should be around 1 to 3 paragraphs long. Write in a clear, engaging style that would help someone understand the podcast's content without listening to it.""",
            
            "key_points": """Extract the most important key points from this podcast transcript. Focus on:
- Main arguments or insights
- Actionable advice or recommendations
- Key facts or statistics mentioned
- Notable quotes or memorable statements

Format as a clear list of 5-10 key points. Each point should be specific and valuable."""
        },
        
        "brief": {
            "summary": """Create a brief, concise summary of this podcast transcript in 150-250 words. Focus on:
- The main topic or theme
- 2-3 most important points discussed
- Key takeaway or conclusion

Write in a clear, accessible style.""",
            
            "key_points": """Extract 3-5 key points from this podcast transcript. Focus on the most important insights, advice, or information that listeners should remember."""
        },
        
        "key_points": {
            "summary": """Analyze this podcast transcript and provide a structured summary focusing on key insights and actionable points. Organize the content into clear themes and highlight practical takeaways.""",
            
            "key_points": """Extract 7-10 specific, actionable key points from this podcast. Focus on practical advice, important insights, and memorable information that would be most valuable to the audience."""
        }
    }
    
    return prompts.get(summary_type, prompts["comprehensive"])