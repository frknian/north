# North: kişisel odak sistemi

## Ürün sınırı

Hedef kullanıcıdan gelir. Günlük seçim; mevcut görev, alan önceliği, haftalık kapasite, son tarih ve bugünkü enerjiye dayanır. En fazla iki derin ve iki hafif görev önerilir. Enerji haftayı yeniden yazmaz. Tarihi geçen görevler otomatik yarına taşınmaz; kullanıcı küçültme, havuza alma veya bırakma kararı verir.

## Uygulanan yapı

- Bugün `/`: sınırlı günlük seçim, gerçek oturum özeti, kaçırılan görev önerileri, yaklaşan etkinlikler.
- Alanlar `/areas`: oluşturma, hedef, öncelik, sıralama, arşivleme, haftalık zaman ve özel çıktı ölçüsü.
- Alan ayrıntısı `/areas/[id]`: görevler, kaynak notları, ilerleme, alan notları. Matematik ders/konu; Okuma kitap/sayfa; Satranç oyun/taktik; Projeler çıktı kayıtları.
- Haftalık havuz `/week`: bu/sonraki hafta, esnek tarih, süre, önem, enerji, kaynak ve son tarih. Normal/sınav/serbest/özel isimli modlar. Sınav modu kapasiteyi %30 azaltır; alan dağılımı kullanıcı tarafından düzenlenir.
- Takvim `/calendar`: gün/hafta/ay, etkinlikler, görevleri yeniden tarihleme ve gerçekleşen oturumlar.
- Odak `/focus/[id]`: sade ekran, gerçek zamanlı sayaç, duraklatma, sekme yenilemesinde oturum kurtarma, 10 saniyelik erken çıkış ve kısa sonuç formu.
- İlerleme `/progress`: takvim dönemine göre süre/çıktı, gerçek etkinlik zinciri, dinlenme/dondurma ve oturum geçmişi. Evrensel XP yok.
- North AI `/north-ai`: ayrı rol talimatları; planlayıcı, koç, değerlendirici, yeniden planlayıcı ve öncelik danışmanı. Şemalı öneriler yalnızca tek tek kullanıcı onayıyla uygulanır. Tanımsız hedef ve geçersiz görev/alan eşleşmeleri uygulanmaz.

## Veri ve uyumluluk

North verisi mevcut WorkspaceState içindeki sürümlü `north` alanına yazılır; mevcut Firebase/yerel kayıt altyapısı kullanılır. Eski lab, kaynak, beceri ve kariyer kayıtları silinmez. Başlangıçta mevcut siber güvenlik görevleri aktarılır. Ortak görevlerin durumları eski ekranlarla eşitlenir. Yeni alanların hedefleri boş başlar.

Oturumlar gerçek süre üzerinden kaydedilir. Bir dakikanın altındaki oturum zincir kazandırmaz. Çıktılar kullanıcının beyanıdır; bağımsız doğrulama veya yeterlilik puanı gibi sunulmaz. Kitap ve konu kayıtları ayrı ayrıntı kayıtlarıdır; oturum çıktılarına otomatik eklenerek çift sayılmaz.

## Açık sınırlar ve devam işleri

- Native bildirim engelleme / uygulama bloklama **yok**. `focus-companion.ts` yalnızca gelecekte izinli native companion için sözleşme sağlar; tarayıcı yetenekleri açıkça false.
- Hatırlatmalar şu anda uygulama içi. Arka plan push, cihaz izinleri ve native eşitleme uygulanmadı.
- AI için Firebase girişi ve sunucu API yapılandırması gerekir. Oturumsuz hata akışı kontrol edilir; gerçek hesapla üretim çağrısı ayrıca doğrulanmalıdır.
- AI yanıtları bu ilk sürümde açık ekran oturumunda tutulur; kalıcı konuşma geçmişi ve öneri geri alma henüz bu yeni modüle taşınmadı. Eski siber güvenlik koçu kendi geçmişini korur.
- Matematik sınav hazırlığı / ustalık için doğrulanmış puanlama, satranç açılış bazlı dönem analizi, ayrıntılı aylık hedef/milestone modeli henüz tamamlanmadı. Mevcut oranlar yalnızca girilen gerçek sayıların oranlarıdır.
- Haftalık modlarda alan önceliklerini otomatik yeniden dağıtma yok; kapasite düşürülür, dağılım kullanıcı kontrolündedir.

## Doğrulama

`node tests/north-focus.cjs`: yerel gün/hafta sınırları, kapasite, hedef/arşiv korumaları, kaçırılan görevler, gerçek etkinlik zinciri ve dinlenme.

`node tests/north-modules.cjs`: bilgi tekrarı ve beceri/kanıt bağlantıları.

Tip kontrolü, lint ve üretim derlemesi; tarayıcıda Bugün → Odak → erken çıkış → kısa değerlendirme akışı.
