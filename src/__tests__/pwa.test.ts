import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
const serviceWorker = readFileSync('public/sw.js', 'utf8');
const indexHtml = readFileSync('index.html', 'utf8');

describe('PWA configuration', () => {
  it('has the required install metadata', () => {
    expect(manifest.name).toBe('Osman Teknik Pro');
    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#030712');
    expect(manifest.background_color).toBe('#030712');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  it('keeps HTML and manifest theme colors aligned', () => {
    expect(indexHtml).toContain('<meta name="theme-color" content="#030712"');
    expect(manifest.theme_color).toBe('#030712');
  });

  it('links the manifest and registers mobile install metadata', () => {
    expect(indexHtml).toContain('rel="manifest" href="/manifest.webmanifest"');
    expect(indexHtml).toContain('apple-mobile-web-app-capable');
    expect(indexHtml).toContain('viewport-fit=cover');
  });

  it('does not intercept API or cross-origin requests in the service worker', () => {
    expect(serviceWorker).toContain("url.origin!==self.location.origin");
    expect(serviceWorker).toContain("url.pathname.startsWith('/api/')");
  });

  it('provides an offline navigation fallback', () => {
    expect(serviceWorker).toContain("caches.match('/index.html')");
    expect(serviceWorker).toContain("request.mode==='navigate'");
  });
});
