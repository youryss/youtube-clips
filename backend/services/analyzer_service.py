#!/usr/bin/env python3
"""
Analyzer Service
Service for analyzing transcripts to identify viral segments
"""

import json
from typing import List, Dict, Optional
from openai import OpenAI

from .processing_config import (
    OPENAI_API_KEY,
    OPENAI_MODEL,
    MIN_CLIP_DURATION,
    MAX_CLIP_DURATION,
    MAX_CLIPS_PER_VIDEO,
    MIN_VIRAL_SCORE,
    load_criterion,
    ACTIVE_CRITERIA
)


class AnalyzerService:
    """Service for analyzing transcripts"""
    
    @staticmethod
    def _load_criteria() -> Dict[str, str]:
        """Load all active criteria from files"""
        criteria = {}
        for criterion_name in ACTIVE_CRITERIA:
            content = load_criterion(criterion_name.strip())
            if content:
                criteria[criterion_name.strip()] = content
        return criteria
    
    @staticmethod
    def _build_analysis_prompt(transcript_segments: List[Dict], criteria: Dict[str, str]) -> str:
        """Build the prompt for GPT to analyze the transcript"""
        transcript_text = "\n".join([
            f"[{seg['start_formatted']} - {seg['end_formatted']}] {seg['text']}"
            for seg in transcript_segments
        ])
        
        criteria_text = "\n\n".join([
            f"## {name.upper()}\n{content}"
            for name, content in criteria.items()
        ])
        
        prompt = f"""You are an expert at identifying viral-worthy video segments for social media platforms like TikTok, Instagram Reels, and YouTube Shorts.

Analyze the following video transcript and identify the TOP segments that have the highest potential to go viral.

# VIRAL CRITERIA

{criteria_text}

# VIDEO TRANSCRIPT

{transcript_text}

# TASK

Analyze the transcript and identify the best segments for viral short-form content. For each potential viral clip:

1. Identify the START and END timestamps FROM THE TRANSCRIPT
2. Score the viral potential (1-10)
3. Identify which criteria it matches (can be multiple)
4. Explain WHY this segment would be viral BASED ONLY ON WHAT IS ACTUALLY SAID IN THE TRANSCRIPT
5. Suggest the clip duration (aim for {MIN_CLIP_DURATION}-{MAX_CLIP_DURATION} seconds)

CRITICAL REQUIREMENTS:
- ONLY analyze content that is ACTUALLY in the transcript - DO NOT make up or imagine content
- Your reasoning MUST include DIRECT QUOTES from the transcript showing what is actually said
- You MUST provide a "key_quote" field with an exact quote from the segment
- Each clip MUST be between {MIN_CLIP_DURATION} and {MAX_CLIP_DURATION} seconds long
- Clips should be self-contained (make sense without context)
- Use the EXACT timestamps from the transcript
- Return MULTIPLE clips (up to {MAX_CLIPS_PER_VIDEO})
- Only include clips with viral score >= {MIN_VIRAL_SCORE}
- Expand clips to include full context (aim for 30-45 second clips when possible)
- Your suggested_title and reasoning must accurately reflect what is ACTUALLY said in those timestamps
- If you cannot find an exact quote for a clip, do not include that clip

Return your analysis as a JSON object with a "clips" array using this EXACT structure:
{{
  "clips": [
    {{
      "start_time": "MM:SS",
      "end_time": "MM:SS",
      "start_seconds": 0,
      "end_seconds": 0,
      "viral_score": 8.5,
      "criteria_matched": ["viral_hooks", "emotional_peaks"],
      "reasoning": "Brief explanation with DIRECT QUOTES from the transcript showing what is actually said",
      "suggested_title": "Engaging title that accurately reflects the actual content",
      "duration_seconds": 30,
      "key_quote": "An exact quote from the transcript showing the main content"
    }}
  ]
}}

Return ONLY the JSON object with the clips array, no additional text.
"""
        return prompt
    
    @staticmethod
    def _parse_time_to_seconds(time_str: str) -> float:
        """Convert time string (MM:SS or HH:MM:SS) to seconds"""
        parts = time_str.strip().split(':')
        if len(parts) == 2:
            minutes, seconds = parts
            return int(minutes) * 60 + int(seconds)
        elif len(parts) == 3:
            hours, minutes, seconds = parts
            return int(hours) * 3600 + int(minutes) * 60 + int(seconds)
        else:
            return 0
    
    @staticmethod
    def analyze_transcript(
        transcript_segments: List[Dict],
        model: Optional[str] = None,
        verbose: bool = False
    ) -> List[Dict]:
        """
        Analyze transcript to identify viral segments
        
        Args:
            transcript_segments: List of transcript segments with timestamps
            model: OpenAI model to use (defaults to OPENAI_MODEL)
            verbose: Whether to print detailed information
        
        Returns:
            List of viral segments with metadata
        """
        if not OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not set in configuration")
        
        # Load criteria
        criteria = AnalyzerService._load_criteria()
        if not criteria:
            raise ValueError("No criteria loaded. Please check criteria files.")
        
        if verbose:
            print(f"Loaded {len(criteria)} criteria: {', '.join(criteria.keys())}")
            print(f"Analyzing transcript with {len(transcript_segments)} segments...")
        
        # Build prompt
        prompt = AnalyzerService._build_analysis_prompt(transcript_segments, criteria)
        
        # Call OpenAI API
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        try:
            response = client.chat.completions.create(
                model=model or OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a precise transcript analyzer. You ONLY describe what is literally said in the transcript. You never invent, imagine, or embellish content. Your descriptions must be factually accurate based solely on the actual words in the transcript."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                response_format={"type": "json_object"} if "gpt-4" in (model or OPENAI_MODEL) else None
            )
            
            if not hasattr(response, 'choices') or not response.choices:
                print("Error: Invalid API response structure")
                return []
            
            if not hasattr(response.choices[0], 'message') or not hasattr(response.choices[0].message, 'content'):
                print("Error: Invalid message structure in API response")
                return []
            
            # Parse response
            content = response.choices[0].message.content
            
            if not content or not isinstance(content, str):
                print("Error: Empty or invalid content in API response")
                return []
            
            if verbose:
                print(f"Raw API response preview: {content[:300]}...")
            
            # Extract JSON if wrapped in markdown
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            # Parse JSON
            try:
                data = json.loads(content)
                if isinstance(data, dict):
                    if "clips" in data:
                        viral_segments = data["clips"]
                    elif "segments" in data:
                        viral_segments = data["segments"]
                    elif all(key in data for key in ['start_time', 'end_time', 'viral_score']):
                        viral_segments = [data]
                    else:
                        for key, value in data.items():
                            if isinstance(value, list) and len(value) > 0 and isinstance(value[0], dict):
                                viral_segments = value
                                break
                        else:
                            viral_segments = []
                elif isinstance(data, list):
                    viral_segments = data
                else:
                    print(f"Error: Unexpected data type: {type(data)}")
                    return []
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON response: {e}")
                print(f"Response content: {content[:500]}")
                return []
            
            # Process and validate segments
            validated_segments = []
            for i, seg in enumerate(viral_segments):
                if not isinstance(seg, dict):
                    continue
                
                # Convert time strings to seconds if not already present
                if 'start_seconds' not in seg and 'start_time' in seg:
                    seg['start_seconds'] = AnalyzerService._parse_time_to_seconds(seg['start_time'])
                if 'end_seconds' not in seg and 'end_time' in seg:
                    seg['end_seconds'] = AnalyzerService._parse_time_to_seconds(seg['end_time'])
                
                # Calculate duration
                duration = seg.get('end_seconds', 0) - seg.get('start_seconds', 0)
                seg['duration_seconds'] = duration
                
                # Validate duration and viral score
                if MIN_CLIP_DURATION <= duration <= MAX_CLIP_DURATION:
                    if seg.get('viral_score', 0) >= MIN_VIRAL_SCORE:
                        validated_segments.append(seg)
            
            if verbose:
                print(f"Found {len(validated_segments)} valid viral segments")
            
            # Sort by viral score and limit
            validated_segments.sort(key=lambda x: x.get('viral_score', 0), reverse=True)
            return validated_segments[:MAX_CLIPS_PER_VIDEO]
        
        except Exception as e:
            print(f"Error calling OpenAI API: {e}")
            if verbose:
                import traceback
                traceback.print_exc()
            return []
