#!/usr/bin/env python3
"""
Viral Analyzer Module
Uses OpenAI to analyze transcripts and identify viral-worthy segments
"""

import json
from typing import List, Dict, Optional
from openai import OpenAI
import config


def load_criteria() -> Dict[str, str]:
    """
    Load all active criteria from files
    
    Returns:
        Dictionary mapping criterion name to its content
    """
    criteria = {}
    for criterion_name in config.ACTIVE_CRITERIA:
        content = config.load_criterion(criterion_name.strip())
        if content:
            criteria[criterion_name.strip()] = content
    return criteria


def build_analysis_prompt(transcript_segments: List[Dict], criteria: Dict[str, str]) -> str:
    """
    Build the prompt for GPT to analyze the transcript
    
    Args:
        transcript_segments: List of transcript segments with timestamps
        criteria: Dictionary of criteria to use for analysis
    
    Returns:
        Formatted prompt string
    """
    # Format transcript with timestamps
    transcript_text = "\n".join([
        f"[{seg['start_formatted']} - {seg['end_formatted']}] {seg['text']}"
        for seg in transcript_segments
    ])
    
    # Format criteria
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
5. Suggest the clip duration (aim for {config.MIN_CLIP_DURATION}-{config.MAX_CLIP_DURATION} seconds)

CRITICAL REQUIREMENTS:
- ONLY analyze content that is ACTUALLY in the transcript - DO NOT make up or imagine content
- Your reasoning MUST include DIRECT QUOTES from the transcript showing what is actually said
- You MUST provide a "key_quote" field with an exact quote from the segment
- Each clip MUST be between {config.MIN_CLIP_DURATION} and {config.MAX_CLIP_DURATION} seconds long
- Clips should be self-contained (make sense without context)
- Use the EXACT timestamps from the transcript
- Return MULTIPLE clips (up to {config.MAX_CLIPS_PER_VIDEO})
- Only include clips with viral score >= {config.MIN_VIRAL_SCORE}
- Expand clips to include full context (aim for 30-45 second clips when possible)
- Your suggested_title and reasoning must accurately reflect what is ACTUALLY said in those timestamps
- If you cannot find an exact quote for a clip, do not include that clip

⚠️ WARNING: If you describe content that is not actually in the transcript, the clips will be completely wrong!

# EXAMPLE OF GOOD vs BAD ANALYSIS

GOOD Example:
Transcript says: "[00:15-00:35] I just tried the new headset and wow, the resolution is incredible. I can actually read text clearly now."
Good analysis:
- reasoning: "Reviewer says 'wow, the resolution is incredible' and 'I can actually read text clearly now', showing genuine excitement about visual quality"
- key_quote: "wow, the resolution is incredible. I can actually read text clearly now"
- title: "VR Headset's Amazing Resolution Impresses Reviewer"

BAD Example (DO NOT DO THIS):
Transcript says: "[00:15-00:35] I just tried the new headset and wow, the resolution is incredible. I can actually read text clearly now."
Bad analysis:
- reasoning: "Reviewer discovers groundbreaking VR technology that revolutionizes gaming" ❌ WRONG - Mentions "gaming" which isn't in the transcript!
- key_quote: "groundbreaking technology" ❌ WRONG - This phrase isn't in the transcript!

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


def parse_time_to_seconds(time_str: str) -> float:
    """
    Convert time string (MM:SS or HH:MM:SS) to seconds
    
    Args:
        time_str: Time string
    
    Returns:
        Time in seconds
    """
    parts = time_str.strip().split(':')
    if len(parts) == 2:
        minutes, seconds = parts
        return int(minutes) * 60 + int(seconds)
    elif len(parts) == 3:
        hours, minutes, seconds = parts
        return int(hours) * 3600 + int(minutes) * 60 + int(seconds)
    else:
        return 0


def analyze_transcript(
    transcript_segments: List[Dict],
    model: str = None,
    verbose: bool = False
) -> List[Dict]:
    """
    Analyze transcript using OpenAI to identify viral segments
    
    Args:
        transcript_segments: List of transcript segments from transcribe module
        model: OpenAI model to use (defaults to config.OPENAI_MODEL)
        verbose: Whether to print detailed information
    
    Returns:
        List of viral segments with metadata
    """
    if not config.validate_config():
        raise ValueError("Invalid configuration. Please check your .env file.")
    
    # Load criteria
    criteria = load_criteria()
    if not criteria:
        raise ValueError("No criteria loaded. Please check criteria files.")
    
    if verbose:
        print(f"Loaded {len(criteria)} criteria: {', '.join(criteria.keys())}")
        print(f"Analyzing transcript with {len(transcript_segments)} segments...")
    
    # Build prompt
    prompt = build_analysis_prompt(transcript_segments, criteria)
    
    # Call OpenAI API
    client = OpenAI(api_key=config.OPENAI_API_KEY)
    
    try:
        response = client.chat.completions.create(
            model=model or config.OPENAI_MODEL,
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
            temperature=0.3,  # Lower temperature for more factual, less creative responses
            response_format={"type": "json_object"} if "gpt-4" in (model or config.OPENAI_MODEL) else None
        )
        
        # Validate response object structure
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
        
        # Try to extract JSON if it's wrapped in markdown or other text
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        
        # Try to parse as JSON object first, then as array
        try:
            data = json.loads(content)
            if isinstance(data, dict):
                # Check if this is a wrapped response with clips/segments array
                if "clips" in data:
                    viral_segments = data["clips"]
                elif "segments" in data:
                    viral_segments = data["segments"]
                # Check if this is a single clip object (has required fields)
                elif all(key in data for key in ['start_time', 'end_time', 'viral_score']):
                    # Single clip object - wrap it in an array
                    viral_segments = [data]
                    if verbose:
                        print("Response is a single clip object, wrapped in array")
                else:
                    # Try to find an array of clip objects
                    for key, value in data.items():
                        if isinstance(value, list) and len(value) > 0:
                            # Check if it's an array of objects (not strings)
                            if isinstance(value[0], dict):
                                viral_segments = value
                                if verbose:
                                    print(f"Found clip array in '{key}' field")
                                break
                    else:
                        viral_segments = []
                        if verbose:
                            print(f"Warning: No clip array found in response object. Keys: {list(data.keys())}")
            elif isinstance(data, list):
                viral_segments = data
            else:
                print(f"Error: Unexpected data type: {type(data)}")
                return []
            
            if verbose:
                print(f"Extracted {len(viral_segments) if isinstance(viral_segments, list) else 0} segments from API response")
                if viral_segments and len(viral_segments) > 0:
                    print(f"First segment type: {type(viral_segments[0])}")
                    print(f"First segment preview: {str(viral_segments[0])[:200]}")
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON response: {e}")
            print(f"Response content: {content[:500]}")
            return []
        
        # Process and validate segments
        validated_segments = []
        for i, seg in enumerate(viral_segments):
            # Validate that segment is a dictionary
            if not isinstance(seg, dict):
                if verbose:
                    print(f"Skipping segment {i}: not a dictionary (got {type(seg)})")
                continue
            
            # Convert time strings to seconds if not already present
            if 'start_seconds' not in seg and 'start_time' in seg:
                seg['start_seconds'] = parse_time_to_seconds(seg['start_time'])
            if 'end_seconds' not in seg and 'end_time' in seg:
                seg['end_seconds'] = parse_time_to_seconds(seg['end_time'])
            
            # Calculate duration
            duration = seg.get('end_seconds', 0) - seg.get('start_seconds', 0)
            seg['duration_seconds'] = duration
            
            # Validate duration
            if config.MIN_CLIP_DURATION <= duration <= config.MAX_CLIP_DURATION:
                # Validate viral score
                if seg.get('viral_score', 0) >= config.MIN_VIRAL_SCORE:
                    validated_segments.append(seg)
            elif verbose:
                print(f"Skipping segment: duration {duration}s outside range")
        
        if verbose:
            print(f"Found {len(validated_segments)} valid viral segments")
        
        # Sort by viral score
        validated_segments.sort(key=lambda x: x.get('viral_score', 0), reverse=True)
        
        # Limit to max clips
        return validated_segments[:config.MAX_CLIPS_PER_VIDEO]
    
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        if verbose:
            import traceback
            print("Full traceback:")
            traceback.print_exc()
        return []


def format_segment_summary(segment: Dict) -> str:
    """
    Format a segment as a human-readable summary
    
    Args:
        segment: Viral segment dictionary
    
    Returns:
        Formatted string
    """
    return f"""
Clip: {segment.get('suggested_title', 'Untitled')}
Time: {segment.get('start_time', '00:00')} - {segment.get('end_time', '00:00')} ({segment.get('duration_seconds', 0)}s)
Viral Score: {segment.get('viral_score', 0)}/10
Criteria: {', '.join(segment.get('criteria_matched', []))}
Reason: {segment.get('reasoning', 'No reason provided')}
""".strip()

