const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.cache = new Map();
    this.isConnected = true;
    this.defaultTTL = 3600; // 1 hour
  }

  async initializeCache() {
    try {
      // Simple in-memory cache - no external dependencies
      this.cache = new Map();
      this.isConnected = true;
      logger.info('In-memory cache initialized successfully');
    } catch (error) {
      logger.error('Cache initialization error:', error);
      this.cache = new Map();
      this.isConnected = true;
    }
  }

  async get(key) {
    try {
      if (!this.isConnected) {
        return null;
      }

      // In-memory cache
      const item = this.cache.get(key);
      if (item) {
        if (item.expiry > Date.now()) {
          return item.value;
        } else {
          this.cache.delete(key);
          return null;
        }
      }
      return null;

    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (!this.isConnected) {
        return false;
      }

      // In-memory cache
      this.cache.set(key, {
        value,
        expiry: Date.now() + (ttl * 1000)
      });
      return true;

    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      if (!this.isConnected) {
        return false;
      }

      // In-memory cache
      return this.cache.delete(key);

    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      if (!this.isConnected) {
        return false;
      }

      // In-memory cache
      const item = this.cache.get(key);
      return item && item.expiry > Date.now();

    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  async flush() {
    try {
      if (!this.isConnected) {
        return false;
      }

      // In-memory cache
      this.cache.clear();
      return true;

    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  async mget(keys) {
    try {
      if (!this.isConnected) {
        return [];
      }

      // In-memory cache
      return keys.map(key => {
        const item = this.cache.get(key);
        if (item && item.expiry > Date.now()) {
          return item.value;
        }
        return null;
      });

    } catch (error) {
      logger.error('Cache mget error:', error);
      return [];
    }
  }

  async mset(keyValuePairs, ttl = this.defaultTTL) {
    try {
      if (!this.isConnected) {
        return false;
      }

      // In-memory cache
      const expiry = Date.now() + (ttl * 1000);
      keyValuePairs.forEach(([key, value]) => {
        this.cache.set(key, { value, expiry });
      });
      return true;

    } catch (error) {
      logger.error('Cache mset error:', error);
      return false;
    }
  }

  async increment(key, amount = 1, ttl = this.defaultTTL) {
    try {
      if (!this.isConnected) {
        return null;
      }

      // In-memory cache
      const item = this.cache.get(key);
      const currentValue = (item && item.expiry > Date.now()) ? item.value : 0;
      const newValue = currentValue + amount;
      this.cache.set(key, {
        value: newValue,
        expiry: Date.now() + (ttl * 1000)
      });
      return newValue;

    } catch (error) {
      logger.error('Cache increment error:', error);
      return null;
    }
  }

  async getStats() {
    try {
      if (!this.isConnected) {
        return {
          connected: false,
          type: 'none'
        };
      }

      // In-memory cache stats
      const now = Date.now();
      let activeKeys = 0;
      let expiredKeys = 0;

      this.cache.forEach((item) => {
        if (item.expiry > now) {
          activeKeys++;
        } else {
          expiredKeys++;
        }
      });

      return {
        connected: true,
        type: 'memory',
        totalKeys: this.cache.size,
        activeKeys,
        expiredKeys
      };

    } catch (error) {
      logger.error('Cache stats error:', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }

  async cleanup() {
    try {
      // Clean up expired keys in memory cache
      const now = Date.now();
      const keysToDelete = [];
      
      this.cache.forEach((item, key) => {
        if (item.expiry <= now) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach(key => this.cache.delete(key));
      logger.info(`Cleaned up ${keysToDelete.length} expired cache keys`);
    } catch (error) {
      logger.error('Cache cleanup error:', error);
    }
  }

  async disconnect() {
    try {
      this.cache.clear();
      this.isConnected = false;
      logger.info('In-memory cache disconnected');
    } catch (error) {
      logger.error('Cache disconnect error:', error);
    }
  }
}

// Create and export singleton instance
const cacheService = new CacheService();

// Auto-cleanup for in-memory cache every 10 minutes
setInterval(() => {
  cacheService.cleanup();
}, 10 * 60 * 1000);

module.exports = cacheService;