import { Injectable } from '@angular/core';

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

interface CacheEntry<T> {
  ts: number;
  ttl: number;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class CacheService {

  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() - entry.ts > entry.ttl) {
        localStorage.removeItem(key);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  }

  set<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
    try {
      const entry: CacheEntry<T> = { ts: Date.now(), ttl, data };
      localStorage.setItem(key, JSON.stringify(entry));
    } catch {}
  }

  invalidate(key: string): void {
    localStorage.removeItem(key);
  }

  // Invalida todas las claves que empiecen con un prefijo
  invalidatePrefix(prefix: string): void {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(prefix))
        .forEach(k => localStorage.removeItem(k));
    } catch {}
  }
}
