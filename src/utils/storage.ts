/**
 * Güvenli Yerel Depolama (Safe LocalStorage) Yöneticisi
 * QuotaExceededError (kota aşımı) hatalarını önler, yakalar ve otomatik kurtarma sağlar.
 */

const NON_ESSENTIAL_KEYS = ['osman_ai_logs', 'osman_day_end_reports'];

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      return localStorage.getItem(key);
    } catch (err) {
      console.warn(`[safeStorage] getItem failed for key "${key}":`, err);
      return null;
    }
  },

  setItem(key: string, value: string): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      localStorage.setItem(key, value);
      return true;
    } catch (err: any) {
      const isQuotaError =
        err?.name === 'QuotaExceededError' ||
        err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        err?.code === 22 ||
        err?.code === 1014 ||
        err?.number === -2147024882;

      console.warn(`[safeStorage] setItem failed for key "${key}" (Quota error: ${isQuotaError}):`, err);

      if (isQuotaError) {
        // Otomatik Kurtarma Stratejisi 1: Önemsiz log ve rapor önbelleğini temizle
        try {
          for (const nonEssentialKey of NON_ESSENTIAL_KEYS) {
            if (nonEssentialKey !== key) {
              localStorage.removeItem(nonEssentialKey);
            }
          }
          // Tekrar dene
          localStorage.setItem(key, value);
          console.info(`[safeStorage] Successfully saved "${key}" after clearing non-essential logs.`);
          return true;
        } catch {
          // Strateji 1 yetmedi, Strateji 2: Eğer büyük görsel içeriyorsa görselleri küçült
          try {
            if (key === 'osman_services' || key === 'osman_phone_trades') {
              const sanitizedValue = sanitizePayloadImages(value);
              localStorage.setItem(key, sanitizedValue);
              console.info(`[safeStorage] Successfully saved "${key}" after compressing embedded images.`);
              return true;
            }
          } catch {
            // Son çare: Hata fırlatma, React çökmesin. Veri oturum belleğinde kalmaya devam eder.
            console.error(`[safeStorage] LocalStorage quota completely full. Keeping state in-memory.`);
          }
        }
      }
      return false;
    }
  },

  removeItem(key: string): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      localStorage.removeItem(key);
    } catch (err) {
      console.warn(`[safeStorage] removeItem failed for key "${key}":`, err);
    }
  },

  clearNonEssential(): void {
    try {
      for (const k of NON_ESSENTIAL_KEYS) {
        localStorage.removeItem(k);
      }
    } catch (err) {
      console.warn('[safeStorage] clearNonEssential failed:', err);
    }
  },

  getStorageStats(): { usedBytes: number; usedKb: number; formattedSize: string } {
    try {
      let totalBytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) {
          const val = localStorage.getItem(k) || '';
          totalBytes += k.length + val.length;
        }
      }
      const usedKb = Math.round(totalBytes / 1024);
      const formattedSize = usedKb > 1024 ? `${(usedKb / 1024).toFixed(2)} MB` : `${usedKb} KB`;
      return { usedBytes: totalBytes, usedKb, formattedSize };
    } catch {
      return { usedBytes: 0, usedKb: 0, formattedSize: '0 KB' };
    }
  },

  /**
   * Sayfa ilk açıldığında localStorage'daki eski devasa fotoğrafları temizler
   */
  sanitizeExistingData(): void {
    try {
      const keysToSanitize = ['osman_services', 'osman_phone_trades'];
      for (const key of keysToSanitize) {
        const raw = localStorage.getItem(key);
        if (raw && raw.length > 500000) { // 500 KB'den büyükse
          try {
            const sanitized = sanitizePayloadImages(raw);
            if (sanitized.length < raw.length) {
              localStorage.setItem(key, sanitized);
              console.info(`[safeStorage] Sanitized and compressed "${key}" on startup.`);
            }
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // ignore
    }
  }
};

/**
 * JSON payload içindeki büyük Base64 görselleri tespit edip optimize eden yardımcı
 */
function sanitizePayloadImages(jsonString: string): string {
  try {
    const data = JSON.parse(jsonString);
    if (!Array.isArray(data)) return jsonString;

    let modified = false;

    // Servis kayıtlarındaki fotoğrafları kontrol et
    for (const item of data) {
      if (Array.isArray(item.devicePhotos)) {
        item.devicePhotos = item.devicePhotos.map((p: any) => {
          if (typeof p?.url === 'string' && p.url.startsWith('data:image') && p.url.length > 150000) {
            modified = true;
            // Aşırı büyük resmi hafiflet
            return {
              ...p,
              url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="%2327272a" width="200" height="200"/><text fill="%23a1a1aa" font-family="sans-serif" font-size="12" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle">Cihaz Fotoğrafı (Arşiv)</text></svg>'
            };
          }
          return p;
        });
      }

      if (Array.isArray(item.photos)) {
        item.photos = item.photos.map((p: any) => {
          if (typeof p?.url === 'string' && p.url.startsWith('data:image') && p.url.length > 150000) {
            modified = true;
            return {
              ...p,
              url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="%2327272a" width="200" height="200"/><text fill="%23a1a1aa" font-family="sans-serif" font-size="12" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle">Cihaz Fotoğrafı (Arşiv)</text></svg>'
            };
          }
          return p;
        });
      }
    }

    return modified ? JSON.stringify(data) : jsonString;
  } catch {
    return jsonString;
  }
}
