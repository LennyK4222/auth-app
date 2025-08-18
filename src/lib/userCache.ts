import { User } from '@/models/User';

interface CachedUser {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  createdAt: Date;
  lastLoginAt: Date | null;
  lastSeenAt: Date | null;
  online: boolean;
}

class UserCache {
  private static instance: UserCache;
  private cache: CachedUser[] = [];
  private lastUpdate: number = 0;
  private readonly CACHE_TTL = 30000; // 30 seconds cache
  private readonly MAX_USERS = 24;
  private isUpdating = false;

  static getInstance(): UserCache {
    if (!UserCache.instance) {
      UserCache.instance = new UserCache();
    }
    return UserCache.instance;
  }

  // Update a specific user's lastSeenAt (for heartbeat)
  async updateUserActivity(userId: string): Promise<void> {
    const now = new Date();
    
    // Update in cache if exists
    const cachedUserIndex = this.cache.findIndex(u => u.id === userId);
    if (cachedUserIndex !== -1) {
      this.cache[cachedUserIndex].lastSeenAt = now;
      this.cache[cachedUserIndex].online = true;
      
      // Re-sort cache by lastSeenAt
      this.cache.sort((a, b) => {
        const aTime = a.lastSeenAt?.getTime() || 0;
        const bTime = b.lastSeenAt?.getTime() || 0;
        return bTime - aTime;
      });
    }
    
    // Update in database (lightweight update)
    try {
      await User.updateOne({ _id: userId }, { $set: { lastSeenAt: now } });
    } catch (error) {
      console.error('Failed to update user activity in DB:', error);
    }
  }

  // Get cached users or fetch if cache is stale
  async getActiveUsers(): Promise<CachedUser[]> {
    const now = Date.now();
    
    // If cache is fresh and not empty, return it
    if (now - this.lastUpdate < this.CACHE_TTL && this.cache.length > 0) {
      return this.updateOnlineStatus(this.cache);
    }
    
    // If already updating, wait for it to complete
    if (this.isUpdating) {
      return this.updateOnlineStatus(this.cache);
    }
    
    // Refresh cache
    return this.refreshCache();
  }

  // Force refresh the cache from database
  async refreshCache(): Promise<CachedUser[]> {
    if (this.isUpdating) {
      return this.updateOnlineStatus(this.cache);
    }
    
    this.isUpdating = true;
    
    try {
      const users = await User.find(
        {},
        { 
          email: 1, 
          name: 1, 
          avatar: 1, 
          createdAt: 1, 
          lastLoginAt: 1, 
          lastSeenAt: 1 
        }
      )
      .sort({ lastSeenAt: -1, lastLoginAt: -1, createdAt: -1 })
      .limit(this.MAX_USERS)
      .lean();

      this.cache = users.map(u => ({
        id: String(u._id),
        name: u.name || null,
        email: u.email,
        avatar: u.avatar || null,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt || null,
        lastSeenAt: u.lastSeenAt || null,
        online: false // Will be calculated below
      }));

      this.lastUpdate = Date.now();
      return this.updateOnlineStatus(this.cache);
      
    } catch (error) {
      console.error('Failed to refresh user cache:', error);
      return this.updateOnlineStatus(this.cache);
    } finally {
      this.isUpdating = false;
    }
  }

  // Calculate online status based on lastSeenAt
  private updateOnlineStatus(users: CachedUser[]): CachedUser[] {
    const now = Date.now();
    const ONLINE_THRESHOLD = 60000; // 1 minute
    
    return users.map(user => ({
      ...user,
      online: user.lastSeenAt 
        ? (now - new Date(user.lastSeenAt).getTime() < ONLINE_THRESHOLD)
        : false
    }));
  }

  // Get cache stats for monitoring
  getCacheStats() {
    return {
      cacheSize: this.cache.length,
      lastUpdate: this.lastUpdate,
      age: Date.now() - this.lastUpdate,
      isUpdating: this.isUpdating
    };
  }

  // Clear cache (useful for testing)
  clearCache() {
    this.cache = [];
    this.lastUpdate = 0;
  }
}

export const userCache = UserCache.getInstance();
export type { CachedUser };
