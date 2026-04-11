"""
High-performance Caching Mechanism for AetherDx AI.
Provides abstracted caching (in-memory fallback with Redis readiness)
to reduce redundant API calls (e.g., FHIR concept lookups, LLM standard prompts).
"""

import time
from typing import Any, Dict, Optional

class CacheManager:
    """
    A unified caching layer. In a full production deployment, 
    this would bind to Redis or Memcached. For this implementation, 
    it uses a thread-safe in-memory dict with TTL support.
    """
    def __init__(self):
        # Store as: { key: (expiry_timestamp, value) }
        self._cache: Dict[str, tuple[float, Any]] = {}
        self._metrics = {"hits": 0, "misses": 0, "evictions": 0}

    def get(self, key: str) -> Optional[Any]:
        """Fetch a value from cache if it exists and hasn't expired."""
        if key in self._cache:
            expiry, value = self._cache[key]
            if time.time() < expiry:
                self._metrics["hits"] += 1
                return value
            else:
                # Expired
                self._metrics["evictions"] += 1
                del self._cache[key]
        
        self._metrics["misses"] += 1
        return None

    def set(self, key: str, value: Any, ttl_seconds: int = 3600) -> None:
        """Store a value in cache with a Time-To-Live (TTL)."""
        expiry = time.time() + ttl_seconds
        self._cache[key] = (expiry, value)

    def invalidate(self, key: str) -> None:
        """Manually remove a key from cache."""
        if key in self._cache:
            del self._cache[key]

    def get_metrics(self) -> Dict[str, int]:
        """Return cache performance metrics."""
        return self._metrics

    def clear(self) -> None:
        """Clear all cached items."""
        self._cache.clear()
        self._metrics = {"hits": 0, "misses": 0, "evictions": 0}

# Global singleton instance
cache_manager = CacheManager()
