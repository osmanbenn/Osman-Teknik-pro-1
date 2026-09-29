# Firebase veri geçişi ön denetimi — 29 Eylül 2026

Canlı proje: `osman-teknik-82cb3`, varsayılan Firestore veritabanı (`eur3`). Konsolda salt okunur inceleme yapıldı. Canlı veri değiştirilmedi; kural yayımlanmadı.

## Gözlenen şema

| Kaynak | Örneklerde görülen alanlar | Yeni `ServiceRecord` karşılığı |
| --- | --- | --- |
| `repairs` (iki belge incelendi) | `customer`, `device`, `desc`, `status`, `cost`, `createdAt`, `userId` | Ad/cihaz/şikâyet adayları var; doğrudan içe aktarma güvenli değil. |
| `ServisKayitlari` (bir belge incelendi) | `ariza_tanimi`, `cihaz_model`, `durum`, `fotograflar`, `giris_tarihi`, `kayit_id`, `musteri_adi` | Ayrı bir eski şema; kaynakların birleştirme kuralı belirlenmeli. |
| `users` | En az bir belgede `role: admin` | Yeni arayüzde `yonetici` olarak görüntülenir; Firestore rolü değiştirilmez. |

Authentication listesinde `osmanyozcu1@gmail.com` Google hesabı bulunuyor. İncelenen `users` koleksiyonunda bu hesabın UID'sine karşılık gelen profil bulunmadı. Canlı kurallar istemciden profil oluşturmayı reddettiği için bu hesapla uygulama verisine erişim, yetkili bir profil atanmadan doğrulanamaz. Bu rapor yeni bir rol atamaz.

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

Canlı hesabın `admin` gibi tüm servis/müşteri verisine erişen bir role yükseltilmesi ayrı, açık bir yetki kararıdır. Rol ataması yapılmadan önce erişim kapsamı onaylanmalıdır.

## Mevcut test sınırı

`npm test` salt veri denetleyicisini, `npm run test:rules` izinleri emülatörde sınar. Canlı Auth, Storage yükleme, tüm belgelerin taraması ve uçtan uca işlem doğrulanmadı.
