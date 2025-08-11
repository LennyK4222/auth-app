"use client";

type HeartbeatConfig = {
  interval: number;
  retries: number;
  backoffMultiplier: number;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  onRetry?: (attempt: number) => void;
};

type HeartbeatListener = {
  id: string;
  callback: (status: 'online' | 'offline' | 'error') => void;
};

class HeartbeatManager {
  private static instance: HeartbeatManager;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private listeners: HeartbeatListener[] = [];
  private config: HeartbeatConfig = {
    interval: 10000, // 10 seconds
    retries: 3,
    backoffMultiplier: 1.5,
  };
  
  private currentStatus: 'online' | 'offline' | 'error' = 'offline';
  private retryCount = 0;
  private getCsrfToken: (() => string) | null = null;
  private refreshToken: (() => Promise<void>) | null = null;

  static getInstance(): HeartbeatManager {
    if (!HeartbeatManager.instance) {
      HeartbeatManager.instance = new HeartbeatManager();
    }
    return HeartbeatManager.instance;
  }

  // Configure CSRF token providers
  setCsrfProviders(
    getToken: () => string, 
    refreshToken: () => Promise<void>
  ) {
    this.getCsrfToken = getToken;
    this.refreshToken = refreshToken;
  }

  // Subscribe to heartbeat status changes
  subscribe(id: string, callback: (status: 'online' | 'offline' | 'error') => void) {
    this.listeners.push({ id, callback });
    
    // Immediately notify with current status
    callback(this.currentStatus);
    
    return () => this.unsubscribe(id);
  }

  unsubscribe(id: string) {
    this.listeners = this.listeners.filter(listener => listener.id !== id);
  }

  // Update configuration
  configure(newConfig: Partial<HeartbeatConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    // Don't auto-restart to avoid multiple interval conflicts
    // User needs to manually restart if they want new config applied immediately
  }

  // Start heartbeat
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.retryCount = 0;
    
    // Clear any existing interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // Initial heartbeat after 3 seconds
    setTimeout(() => this.sendHeartbeat(), 3000);
    
    // Set up interval
    this.intervalId = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.interval);
  }

  // Stop heartbeat
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.updateStatus('offline');
  }

  // Get current status
  getStatus() {
    return this.currentStatus;
  }

  // Manual heartbeat trigger
  async ping(): Promise<boolean> {
    return this.sendHeartbeat();
  }

  private async sendHeartbeat(): Promise<boolean> {
    if (!this.getCsrfToken || !this.refreshToken) {
      console.warn('Heartbeat: CSRF providers not configured');
      return false;
    }

    const token = this.getCsrfToken();
    if (!token) {
      return false;
    }

    try {
      const response = await fetch('/api/user/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token,
        },
        credentials: 'include',
      });

      if (response.status === 401) {
        // Redirect to login
        window.location.href = '/login';
        return false;
      }

      if (response.status === 403) {
        // Token expired, try to refresh
        if (this.retryCount < this.config.retries) {
          this.retryCount++;
          this.config.onRetry?.(this.retryCount);
          
          try {
            await this.refreshToken();
            // Wait before retry with backoff
            const delay = 1000 * Math.pow(this.config.backoffMultiplier, this.retryCount - 1);
            setTimeout(() => this.sendHeartbeat(), delay);
            return false;
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            this.handleError(refreshError);
            return false;
          }
        } else {
          // Max retries reached
          this.handleError(new Error('Max retries reached'));
          return false;
        }
      }

      if (response.ok) {
        this.retryCount = 0; // Reset retry count on success
        this.updateStatus('online');
        this.config.onSuccess?.();
        return true;
      } else {
        throw new Error(`Heartbeat failed: ${response.status}`);
      }

    } catch (error) {
      this.handleError(error);
      return false;
    }
  }

  private updateStatus(status: 'online' | 'offline' | 'error') {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      this.notifyListeners(status);
    }
  }

  private handleError(error: unknown) {
    this.updateStatus('error');
    this.config.onError?.(error);
    console.error('Heartbeat error:', error);
  }

  private notifyListeners(status: 'online' | 'offline' | 'error') {
    this.listeners.forEach(listener => {
      try {
        listener.callback(status);
      } catch (error) {
        console.error('Heartbeat listener error:', error);
      }
    });
  }
}

export const heartbeatManager = HeartbeatManager.getInstance();
export type { HeartbeatConfig };
