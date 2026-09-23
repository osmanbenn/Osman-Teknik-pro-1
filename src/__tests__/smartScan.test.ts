import { describe, expect, it } from 'vitest';
import type { StockItem } from '../types';
import { normalizeScanCode, rankProductsFromOcr, resolveScan, stockCountDifference } from '../utils/smartScan';

const stock: StockItem[] = [
  { id:'1', barcode:'8690012345678', stockCode:'INF-N50P-12256', name:'Infinix Note 50 Pro+ 12/256 Titanium Gray', category:'Telefon', quantity:4, minStock:1, costUsd:500, salePriceTl:25999, supplierName:'Test', isActive:true, createdAt:'2026-09-22', updatedAt:'2026-09-22' },
  { id:'2', barcode:'8690099999999', stockCode:'ADP-25W', name:'Samsung 25W Adaptör', category:'Şarj Aleti', quantity:0, minStock:2, costUsd:8, salePriceTl:549, supplierName:'Test', isActive:true, createdAt:'2026-09-22', updatedAt:'2026-09-22' }
];

describe('akıllı kamera satış ve sayım motoru', () => {
  it('barkodu normalize eder', () => expect(normalizeScanCode(' 8690 012345678 ')).toBe('8690012345678'));
  it('aktif ürünü barkoddan bulur', () => expect(resolveScan('8690012345678', stock).status).toBe('found'));
  it('stok sıfır ürünü satış için out_of_stock döndürür ama ürünü tanır', () => {
    const result = resolveScan('8690099999999', stock);
    expect(result.status).toBe('out_of_stock');
    expect(result.product?.id).toBe('2');
  });
  it('bilinmeyen barkodu yeni ürün akışına yollar', () => expect(resolveScan('1234567890123', stock).status).toBe('not_found'));
  it('OCR metninden en yakın ürünü sıralar', () => {
    const result = rankProductsFromOcr('INFINIX NOTE 50 PRO+ 12GB 256GB Titanium Gray', stock);
    expect(result[0]?.product.id).toBe('1');
    expect(result[0]?.score).toBeGreaterThan(50);
  });
  it('OCR eşleşmesi satış yapmaz, yalnızca aday döndürür', () => {
    const before = stock[0].quantity;
    rankProductsFromOcr('Infinix Note 50 Pro Titanium Gray', stock);
    expect(stock[0].quantity).toBe(before);
  });
  it('stok sayımında eksik farkı negatif hesaplar', () => expect(stockCountDifference(12, 9)).toBe(-3));
  it('stok sayımında fazla farkı pozitif hesaplar', () => expect(stockCountDifference(9, 12)).toBe(3));
  it('stok sayımında eşit miktarı sıfır fark döndürür', () => expect(stockCountDifference(12, 12)).toBe(0));
});
