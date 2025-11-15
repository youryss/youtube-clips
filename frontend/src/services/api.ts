import axios, { AxiosInstance } from 'axios';
import { AuthResponse, LoginCredentials, RegisterData, User, Job, Clip, Settings, YouTubeAccount } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle token refresh on 401
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, clear and redirect to login
          localStorage.removeItem('access_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/register', data);
    return response.data;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    const response = await this.client.get<{ user: User }>('/auth/me');
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
  }

  // Jobs endpoints
  async listJobs(params?: { page?: number; per_page?: number; status?: string }): Promise<{
    jobs: Job[];
    total: number;
    page: number;
    per_page: number;
    pages: number;
  }> {
    const response = await this.client.get('/jobs', { params });
    return response.data;
  }

  async getJob(id: number): Promise<{ job: Job }> {
    const response = await this.client.get(`/jobs/${id}`);
    return response.data;
  }

  async createJob(video_url: string): Promise<{ message: string; job: Job }> {
    const response = await this.client.post('/jobs', { video_url });
    return response.data;
  }

  async cancelJob(id: number): Promise<{ message: string; job: Job }> {
    const response = await this.client.post(`/jobs/${id}/cancel`);
    return response.data;
  }

  async getJobLogs(id: number): Promise<{ job_id: number; status: string; error_message?: string; current_step?: string; progress: number; message: string }> {
    const response = await this.client.get(`/jobs/${id}/logs`);
    return response.data;
  }

  async deleteJob(id: number): Promise<{ message: string }> {
    const response = await this.client.delete(`/jobs/${id}`);
    return response.data;
  }

  // Clips endpoints
  async listClips(params?: { page?: number; per_page?: number }): Promise<{
    clips: Clip[];
    total: number;
    page: number;
    per_page: number;
    pages: number;
  }> {
    const response = await this.client.get('/clips', { params });
    return response.data;
  }

  async getClip(id: number): Promise<{ clip: Clip }> {
    const response = await this.client.get(`/clips/${id}`);
    return response.data;
  }

  getDownloadUrl(id: number): string {
    return `${API_URL}/api/clips/${id}/download`;
  }

  getThumbnailUrl(id: number): string {
    return `${API_URL}/api/clips/${id}/thumbnail`;
  }

  async uploadClipToYouTube(
    clipId: number,
    options?: {
      title?: string;
      description?: string;
      tags?: string[];
      category?: string;
      privacy?: string;
      make_shorts?: boolean;
    }
  ): Promise<{ message: string; video_id?: string; video_url?: string; shorts_url?: string }> {
    const response = await this.client.post(`/youtube/clips/${clipId}/upload`, options || {});
    return response.data;
  }

  async deleteClip(id: number): Promise<{ message: string }> {
    const response = await this.client.delete(`/clips/${id}`);
    return response.data;
  }

  // Settings endpoints
  async getSettings(): Promise<{ settings: Settings }> {
    const response = await this.client.get('/settings');
    return response.data;
  }

  async updateSettings(settings: Partial<Settings>): Promise<{ message: string; settings: Settings }> {
    const response = await this.client.put('/settings', settings);
    return response.data;
  }

  // YouTube accounts endpoints
  async listYouTubeAccounts(): Promise<{ accounts: YouTubeAccount[] }> {
    const response = await this.client.get('/youtube/accounts');
    return response.data;
  }

  async getYouTubeAuthUrl(redirectUri?: string): Promise<{ authorization_url: string; state: string }> {
    const params = redirectUri ? { redirect_uri: redirectUri } : {};
    const response = await this.client.get('/youtube/auth/url', { params });
    return response.data;
  }

  async handleYouTubeCallback(code: string, state: string, redirectUri?: string): Promise<{ message: string; account: YouTubeAccount }> {
    const response = await this.client.post('/youtube/auth/callback', {
      code,
      state,
      redirect_uri: redirectUri
    });
    return response.data;
  }

  async deleteYouTubeAccount(id: number): Promise<{ message: string }> {
    const response = await this.client.delete(`/youtube/accounts/${id}`);
    return response.data;
  }
}

export const api = new APIClient();
export default api;

