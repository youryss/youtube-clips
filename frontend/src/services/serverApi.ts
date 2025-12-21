import axios, { AxiosInstance, AxiosError } from "axios";
import { cookies } from "next/headers";
import type { Clip } from "@/types";

// For server-side requests in Docker, use the service name
// For local development or client-side, use localhost
// NEXT_PUBLIC_API_URL is for client-side (browser)
// API_URL_INTERNAL is for server-side (Node.js in Docker)
const API_URL =
  process.env.API_URL_INTERNAL || // Server-side internal URL (for Docker)
  process.env.NEXT_PUBLIC_API_URL || // Client-side URL (for browser)
  "http://localhost:5000"; // Fallback for local development

class ServerAPIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 second timeout
    });
  }

  /**
   * Get the authentication token from cookies
   * Falls back to checking for access_token cookie
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const cookieStore = await cookies();
      // Try to get token from cookie (if stored there)
      const token = cookieStore.get("access_token")?.value;
      return token || null;
    } catch {
      // If cookies() fails (e.g., in client component), return null
      return null;
    }
  }

  /**
   * Create an authenticated request config
   */
  private async getAuthConfig(
    token?: string
  ): Promise<{ headers: Record<string, string> }> {
    const authToken = token || (await this.getAuthToken());

    if (!authToken) {
      throw new Error("Authentication required. No token found in cookies.");
    }

    return {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    };
  }

  /**
   * Handle API errors consistently
   */
  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{
        error?: string;
        message?: string;
      }>;

      // Server responded with error status
      if (axiosError.response) {
        const status = axiosError.response.status;
        const message =
          axiosError.response.data?.error ||
          axiosError.response.data?.message ||
          axiosError.message;

        switch (status) {
          case 401:
            throw new Error("Unauthorized. Please log in again.");
          case 403:
            throw new Error(
              "Forbidden. You don't have permission to access this resource."
            );
          case 404:
            // Try to extract more context from the error message
            const errorMsg = message?.toLowerCase() || "";
            if (errorMsg.includes("clip")) {
              throw new Error(
                `Clip not found. The clip may not exist or you may not have permission to access it.`
              );
            }
            throw new Error("Resource not found.");
          case 500:
            throw new Error("Server error. Please try again later.");
          default:
            throw new Error(message || `Request failed with status ${status}`);
        }
      }

      // Request was made but no response received (network error, timeout, etc.)
      if (axiosError.request) {
        const baseUrl = API_URL;
        const errorMessage =
          axiosError.code === "ECONNABORTED"
            ? `Request timeout. The server at ${baseUrl} took too long to respond.`
            : axiosError.code === "ERR_NETWORK"
            ? `Network error. Unable to connect to the backend server at ${baseUrl}. Please ensure:\n1. The backend is running (check port ${
                baseUrl.split(":").pop() || "5000"
              })\n2. The NEXT_PUBLIC_API_URL environment variable is set correctly\n3. There are no firewall or network restrictions`
            : `Network error connecting to ${baseUrl}. Please check your connection and ensure the backend is running.`;

        throw new Error(errorMessage);
      }

      // AxiosError without response or request (configuration error, etc.)
      throw new Error(axiosError.message || "Network request failed");
    }

    // Non-Axios errors
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred");
  }

  /**
   * List all clips for the authenticated user
   * @param params - Optional pagination parameters
   * @param token - Optional token to override cookie-based auth
   * @returns Paginated list of clips
   * @throws Error if authentication fails
   */
  async listClips(
    params?: { page?: number; per_page?: number },
    token?: string
  ): Promise<{
    clips: Clip[];
    total: number;
    page: number;
    per_page: number;
    pages: number;
  }> {
    try {
      const authConfig = await this.getAuthConfig(token);
      const response = await this.client.get<{
        clips: Clip[];
        total: number;
        page: number;
        per_page: number;
        pages: number;
      }>("/clips", {
        ...authConfig,
        params,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get clip details by ID
   * @param clipId - The clip ID (string or number)
   * @param token - Optional token to override cookie-based auth
   * @returns Clip data
   * @throws Error if authentication fails or clip is not found
   */
  async getClip(
    clipId: string | number,
    token?: string
  ): Promise<{ clip: Clip }> {
    try {
      const authConfig = await this.getAuthConfig(token);
      const url = `/clips/${Number(clipId)}`;

      const response = await this.client.get<{ clip: Clip }>(url, authConfig);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const serverApi = new ServerAPIClient();
