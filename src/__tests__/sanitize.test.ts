import { describe, expect, it } from 'vitest';
import { sanitizeForAi, sanitizeText } from '../utils/sanitize';

describe('sanitizeText', () => {
  it('trims whitespace and collapses repeated spaces', () => {
    expect(sanitizeText('  hello   world  ')).toBe('hello world');
  });

  it('removes control characters', () => {
    expect(sanitizeText('hi\u0001there')).toBe('hi there');
  });

  it('truncates long text', () => {
    const longText = 'a'.repeat(5000);
    expect(sanitizeText(longText, 100).length).toBe(100);
  });

  it('returns empty string for non-string values', () => {
    expect(sanitizeText(undefined)).toBe('');
  });
});

describe('sanitizeForAi', () => {
  it('returns a safe prompt string for AI requests', () => {
    expect(sanitizeForAi('  Teknisyen,  arızayı kontrol et  ')).toBe('Teknisyen, arızayı kontrol et');
  });

  it('never returns empty string', () => {
    expect(sanitizeForAi('')).toBe(' ');
  });
});
