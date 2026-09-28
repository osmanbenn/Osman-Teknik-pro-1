import { describe, expect, it } from 'vitest';
import jsQR from 'jsqr';
import { createSafeWhatsAppMessage, createTrackingToken, generateSvgQrCode } from '../utils/security';
import { serviceTransitionError } from '../utils/serviceStage';

describe('servis takip güvenliği', () => {
  it('birbirinden farklı, tahmin edilemez takip tokenleri üretir', () => {
    const tokens = Array.from({ length: 100 }, () => createTrackingToken());
    expect(new Set(tokens).size).toBe(100);
    expect(tokens.every(token => /^qtk_[0-9a-f]{64}$/.test(token))).toBe(true);
  });

  it('fiş SVG QR içeriği standart okuyucuyla servis numarasına çözülür', () => {
    const serviceNo = 'SRV-2026-001';
    const svg = generateSvgQrCode(serviceNo, 120);
    const view = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
    expect(view).not.toBeNull();
    const scale = 4;
    const width = Number(view![1]) * scale;
    const height = Number(view![2]) * scale;
    const pixels = new Uint8ClampedArray(width * height * 4).fill(255);
    for (const match of svg.matchAll(/M(\d+),(\d+)l2,0 0,2/g)) {
      const x = Number(match[1]) * scale;
      const y = Number(match[2]) * scale;
      for (let row = y; row < y + 2 * scale; row++) {
        for (let col = x; col < x + 2 * scale; col++) {
          const offset = (row * width + col) * 4;
          pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 0;
        }
      }
    }
    expect(jsQR(pixels, width, height)?.data).toBe(serviceNo);
  });

  it('müşteriye doğrulanmamış takip URL’si göndermez', () => {
    const text = createSafeWhatsAppMessage('kabul', {
      customerName: 'Test', serviceNo: 'SRV-2026-001', deviceModel: 'Test Cihaz'
    });
    expect(text).toContain('SRV-2026-001');
    expect(text).not.toContain('osmanteknik.com/takip/');
  });

  it('teslim edilmiş servis terminaldir; geçiş yetkileri ve sıra korunur', () => {
    expect(serviceTransitionError('teslim_edildi', 'hazir', 'yonetici')).toBe('terminal');
    expect(serviceTransitionError('kabul', 'hazir', 'yonetici')).toBe('skip');
    expect(serviceTransitionError('onarimda', 'hazir', 'cirak')).toBe('apprentice');
    expect(serviceTransitionError('hazir', 'onarimda', 'teknisyen')).toBe('manager_required');
    expect(serviceTransitionError('hazir', 'teslim_edildi', 'teknisyen')).toBeNull();
  });
});
