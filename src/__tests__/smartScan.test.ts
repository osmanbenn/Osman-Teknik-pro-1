import { describe, expect, it } from 'vitest';
import type { StockItem } from '../types';
import { normalizeScanCode, rankProductsFromOcr, resolveScan, stockCountDifference } from '../utils/smartScan';

const stock: StockItem[] = [
  { id:'1', barcode:'8690012345678', stockCode:'INF-N50P-12256', name:'Infinix Note 50 Pro+ 12/256 Titanium Gray', category:'Telefon', quantity:4, minStock:1, costUsd:500, salePriceTl:25999, supplierName:'Test', isActive:true, createdAt:'2026-09-22', updatedAt:'2026-09-22' },
  { id:'2', barcode:'8690099999999', stockCode:'ADP-25W', name:'Samsung 25W Adaptör', category:'Şarj Aleti', quantity:0, minStock:2, costUsd:8, salePriceTl:549, supplierName:'Test', isActive:true, createdAt:'2026-09-22', updatedAt:'2026-09-22' }
];

describe('akıllı kamera satış motoru', () => {
  it('barkodu normalize eder', () => expect(normalizeScanCode(' 8690 012345678 ')).toBe('8690012345678'));
  it('aktif ürünü barkoddan bulur', () => expect(resolveScan('8690012345678', stock).status).toBe('found'));
  it('stok sıfır ürünün satışını engeller', () => expect(resolveScan('8690099999999', stock).status).toBe('out_of_stock'));
  it('bilinmeyen barkodu yeni ürün akışına yollar', () => expect(resolveScan('1234567890123', stock).status).toBe('not_found'));
  it('OCR metninden en yakın ürünü sıralar', () => {
    const result = rankProductsFromOcr('INFINIX NOTE 50 PRO+ 12GB 256GB Titanium Gray', stock);
    expect(result[0]?.product.id).toBe('1');
    expect(result[0]?.score).toBeGreaterThan(50);
  });
  it('stok sayım farkını doğru hesaplar', () => expect(stockCountDifference(12, 9)).toBe(-3));
});
