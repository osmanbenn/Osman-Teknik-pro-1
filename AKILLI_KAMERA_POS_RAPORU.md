# Osman Teknik Pro — Akıllı Kamera POS Uygulama Raporu

Tarih: 22 Eylül 2026
Dal: `feature/akilli-kamera-pos`

## Kurulan çekirdek
- Canlı kamera/barkod altyapısı mevcut `CameraScannerModal` ile EAN-13, EAN-8, UPC-A/E, Code 128/39, ITF ve QR destekliyor.
- Seri okutma, tekrar okuma debounce, ses/titreşim, arka kamera seçimi, flaş ve manuel kod girişi korunuyor.
- Yeni `smartScan` motoru barkodu normalize eder, aktif stok kartını kesin barkod/stok koduyla eşler ve stok yoksa satışı engeller.
- Bilinmeyen barkod yeni ürün tanımlama akışına ayrılır.
- OCR metninden stok kartı adaylarını puanlayan güvenli eşleştirme eklendi; OCR sonucu otomatik satış yapmaz, kullanıcı seçimi için aday üretir.
- Stok sayım farkı hesabı çekirdeğe eklendi.
- Mevcut POS sepeti aynı ürünü yeniden okutunca adedi artırır; satış tamamlanınca stok düşümü, ödeme ve termal fiş akışı mevcut sistem üzerinden devam eder.

## Test senaryoları
1. Barkod boşluk normalizasyonu.
2. Aktif stok ürününü barkoddan bulma.
3. Stok=0 ürünün satışını engelleme.
4. Bilinmeyen barkodu yeni ürün akışına gönderme.
5. OCR metninden Infinix Note 50 Pro+ adayını bulma.
6. Stok sayım farkı (12 sistem / 9 sayım = -3).

Test dosyası: `src/__tests__/smartScan.test.ts`.

## Doğrulama sınırı
Kod seviyesi testler Vitest için eklenmiştir. GitHub bağlantısı bu çalışma ortamında komut çalıştırmadığı için npm/Vite test sonucu ancak CI veya yerel çalışma ile kesin PASS olarak işaretlenebilir. Fiziksel iPhone/Android kamera, kamera izni, flaş ve 58 mm yazıcı testi de gerçek cihaz gerektirir.

## Merge öncesi kabul kriterleri
- `npm run lint`
- `npm test`
- `npm run build`
- iOS Safari/PWA: kamera izni + arka kamera + seri okutma
- Android Chrome/PWA: kamera izni + flaş + seri okutma
- Bilinen barkod, stok=0, bilinmeyen barkod, tekrar okutma
- Nakit/kart/havale/karma ödeme
- Satış sonrası stok düşümü
- 58 mm fiş baskısı
- OCR aday eşleştirmesinde kullanıcı onayı olmadan sepete ürün eklenmemesi

## Not
OCR tarafı ürün eşleştirme motoru olarak hazırlanmıştır. Gerçek kamera karesinden OCR çıkarımı için istemci tarafı OCR veya kontrollü sunucu görüntü işleme katmanı ayrıca bağlanmalıdır; mevcut barkod satış akışı bundan bağımsız çalışır.
