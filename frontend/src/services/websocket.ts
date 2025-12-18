import { io, Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:5001";

class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(WS_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on("connect", () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      this.reconnectAttempts++;
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinJobRoom(jobId: number): void {
    if (this.socket) {
      this.socket.emit("join", { room: `job_${jobId}` });
    }
  }

  leaveJobRoom(jobId: number): void {
    if (this.socket) {
      this.socket.emit("leave", { room: `job_${jobId}` });
    }
  }

  onJobUpdate(callback: (data: unknown) => void): void {
    if (this.socket) {
      this.socket.on("job_update", callback);
    }
  }

  onProgress(
    callback: (data: { job_id: number; progress: number; step: string }) => void
  ): void {
    if (this.socket) {
      this.socket.on("progress", callback);
    }
  }

  onLog(
    callback: (data: { job_id: number; message: string; level: string }) => void
  ): void {
    if (this.socket) {
      this.socket.on("log", callback);
    }
  }

  onError(callback: (data: { job_id: number; error: string }) => void): void {
    if (this.socket) {
      this.socket.on("error", callback);
    }
  }

  onComplete(
    callback: (data: { job_id: number; clips_created: number }) => void
  ): void {
    if (this.socket) {
      this.socket.on("complete", callback);
    }
  }

  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export const websocket = new WebSocketClient();
export default websocket;
