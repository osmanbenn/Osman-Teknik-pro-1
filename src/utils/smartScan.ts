import type { StockItem } from '../types';

export type ScanStatus = 'found' | 'out_of_stock' | 'not_found';

export interface ScanResolution {
  status: ScanStatus;
  code: string;
  product?: StockItem;
}

export function normalizeScanCode(value: string): string {
  return value.trim().replace(/\s+/g, '');
}

export function resolveScan(code: string, stock: StockItem[]): ScanResolution {
  const clean = normalizeScanCode(code);
  if (!clean) return { status: 'not_found', code: clean };

  const product = stock.find(item =>
    item.isActive &&
    (normalizeScanCode(item.barcode || '') === clean ||
      item.stockCode.toLocaleLowerCase('tr-TR') === clean.toLocaleLowerCase('tr-TR'))
  );

  if (!product) return { status: 'not_found', code: clean };
  if (product.quantity <= 0) return { status: 'out_of_stock', code: clean, product };
  return { status: 'found', code: clean, product };
}

export function rankProductsFromOcr(text: string, stock: StockItem[], limit = 3): Array<{ product: StockItem; score: number }> {
  const tokens = text
    .toLocaleLowerCase('tr-TR')
    .replace(/[^a-z0-9çğıöşü+]+/gi, ' ')
    .split(/\s+/)
    .filter(token => token.length >= 2);

  if (!tokens.length) return [];

  return stock
    .filter(item => item.isActive)
    .map(product => {
      const haystack = [product.name, product.category, product.stockCode]
        .join(' ')
        .toLocaleLowerCase('tr-TR');
      const hits = tokens.filter(token => haystack.includes(token)).length;
      return { product, score: Math.round((hits / tokens.length) * 100) };
    })
    .filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score || b.product.quantity - a.product.quantity)
    .slice(0, limit);
}

export function stockCountDifference(systemQuantity: number, countedQuantity: number): number {
  return countedQuantity - systemQuantity;
}
