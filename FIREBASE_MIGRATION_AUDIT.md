# Firebase veri geçişi ön denetimi — 29 Eylül 2026

Canlı proje: `osman-teknik-82cb3`, varsayılan Firestore veritabanı (`eur3`). Eski servis kayıtları salt okunur incelendi; kural yayımlanmadı. 29 Eylül'de kullanıcının açık onayıyla yalnızca kendi Auth UID'sine ait `users` yönetici profili oluşturuldu; servis verisi değiştirilmedi.

## Gözlenen şema

| Kaynak | Örneklerde görülen alanlar | Yeni `ServiceRecord` karşılığı |
| --- | --- | --- |
| `repairs` (iki belge incelendi) | `customer`, `device`, `desc`, `status`, `cost`, `createdAt`, `userId` | Ad/cihaz/şikâyet adayları var; doğrudan içe aktarma güvenli değil. |
| `ServisKayitlari` (bir belge incelendi) | `ariza_tanimi`, `cihaz_model`, `durum`, `fotograflar`, `giris_tarihi`, `kayit_id`, `musteri_adi` | Ayrı bir eski şema; kaynakların birleştirme kuralı belirlenmeli. |
| `users` | En az bir belgede `role: admin` | Yeni arayüzde `yonetici` olarak görüntülenir; Firestore rolü değiştirilmez. |

Authentication listesinde onaylanan Google hesabı ve karşılık gelen UID doğrulandı. 29 Eylül'de onay üzerine ilgili `users/{UID}` belgesi `email`, `displayName` ve `role: admin` alanlarıyla oluşturuldu. Yeniden açılan konsolda alanlar görüldü. Yayındaki Firestore Rules Playground'da bu UID ile `/repairs/authorization-check` için `get` simülasyonu **Simulated read allowed** verdi; bu sonuç gerçek uygulama girişinin ya da servis işlevinin uçtan uca testi değildir. Canlı uygulamada Google giriş denemesi Google'ın geçiş anahtarı doğrulamasında kaldı.

İncelenen belgeler tüm koleksiyonu temsil etmez. Kişisel bilgiler bu rapora alınmadı.

## Kayıpsız aktarım engelleri

- `repairs` örneklerinde telefon, IMEI, rıza, tahmini teslim, ödeme durumu ve aşama geçmişi yok.
- `status: pending` yeni `kabul` aşaması olarak varsayılamaz; eski uygulamadaki anlamı doğrulanmalı.
- `cost` alış maliyeti, işçilik veya müşteriye fiyat olabilir; finansal alanlara otomatik yazılmamalı.
- `device` marka/model ayrımını garanti etmiyor. `ServisKayitlari` fotoğraflarının Storage bağlantısı ayrıca doğrulanmalı.
- Yeni yerel demo kayıtlarının ID ve numaraları canlı kayıtlarla çakışabilir; toplu push/pull kapalı tutulmalı.

## Güvenli geçiş sırası

1. Her iki eski koleksiyonun tüm belgelerini salt okunur, yetkili ortamda sayıp alan/tip dağılımını ve kaynak önceliğini belirle. `auditLegacyRepairs` yalnız toplu ve kişisel veri içermeyen eksik alan sayılarını üretir.
2. Canlı verinin yedeğini al; eksik zorunlu alanlar ve belirsiz fiyat/durum eşlemeleri için kayıt bazında inceleme listesi hazırla. Müşteri rızasını varsayılan `true` yapma.
3. Test projesinde idempotent, geri alınabilir aktarımı ve servis kabul→teslim uçtan uca akışını doğrula. Sonra canlıya aşamalı geçiş ve kural dağıtımı yap.

Bu hesaba `admin` rolü verilmesi kullanıcı tarafından açıkça onaylandı. Diğer hesapların rolü değiştirilmedi.

## Mevcut test sınırı

`npm test` salt veri denetleyicisini, `npm run test:rules` izinleri emülatörde sınar. Canlı kural simülasyonu yukarıdaki UID için okuma iznini doğruladı. Gerçek uygulama Auth oturumu, Storage yükleme, tüm belgelerin taraması ve uçtan uca işlem doğrulanmadı. Yayındaki 17 Eylül sürümü hâlâ yerel örnek veriler ve eski push/pull arayüzünü gösteriyor; bu sürüme yeni PR kodu dağıtılmadı.
