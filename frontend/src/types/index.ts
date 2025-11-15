export interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
  youtube_accounts_count?: number;
}

export interface Job {
  id: number;
  video_url: string;
  video_title?: string;
  video_duration?: number;
  status: 'pending' | 'downloading' | 'transcribing' | 'analyzing' | 'slicing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  current_step?: string;
  clips_created: number;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  clips?: Clip[];
  thumbnail_url?: string;
  has_thumbnail?: boolean;
  thumbnail_clip_id?: number;
}

export interface Clip {
  id: number;
  job_id: number;
  filename: string;
  file_path: string;
  thumbnail_path?: string;
  title?: string;
  duration?: number;
  start_time?: number;
  end_time?: number;
  viral_score?: number;
  criteria_matched?: string[];
  reasoning?: string;
  file_size?: number;
  is_uploaded: boolean;
  youtube_video_id?: string;
  youtube_url?: string;
  uploaded_at?: string;
  upload_error?: string;
  created_at: string;
}

export interface Settings {
  whisper_model: string;
  whisper_device: string;
  whisper_compute_type: string;
  openai_model: string;
  video_quality: string;
  min_clip_duration: number;
  max_clip_duration: number;
  clip_padding_before: number;
  clip_padding_after: number;
  max_clips_per_video: number;
  min_viral_score: number;
  active_criteria: string[];
  thumbnail_mode: string;
  thumbnail_frames: number;
  default_youtube_privacy: string;
  default_youtube_category: string;
  make_shorts: boolean;
}

export interface YouTubeAccount {
  id: number;
  channel_id: string;
  channel_title?: string;
  channel_thumbnail?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_used_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  access_token: string;
  refresh_token?: string;
}

