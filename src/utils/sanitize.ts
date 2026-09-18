export function sanitizeText(value: unknown, maxLength = 2000): string {
  if (typeof value !== 'string') {
    return '';
  }

  const cleaned = value
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return '';
  }

  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
}

export function sanitizeForAi(value: unknown): string {
  const sanitized = sanitizeText(value, 4000);
  return sanitized.length === 0 ? ' ' : sanitized;
}
