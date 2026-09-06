# North Intelligence

North Intelligence, North içindeki görev ve odak kayıtlarından sürdürülebilir çalışma desenleri çıkaran deterministik analiz katmanıdır. Cihaz, tarayıcı, mikrofon, kamera veya klavye etkinliğini izlemez.

## İlk sürüm

- Son 4 ve 12 haftalık hareketli pencereler
- Günün saati ve alan-saat tamamlama oranları
- Oturum süresi aralıkları
- Planlanan ve gerçek süre karşılaştırması
- Yeniden planlama sayıları
- Etkin haftaların ortanca odak süresine dayalı kapasite tahmini
- Yakın tarihe daha yüksek ağırlık veren desen analizi
- Yetersiz, beliren, güvenilir ve güçlü desen durumları
- Planlayıcı ve haftalık değerlendirme için yapılandırılmış bağlam
- Öneriyi kabul etme, mevcut planı koruma, yanlış işaretleme ve bir haftalık deney

## Güven ilkesi

Bir veya iki kayıt güçlü bir davranış sonucu üretmez. 3–5 kayıt beliren, 6–14 kayıt güvenilir, 15 ve üzeri kayıt güçlü desen olarak gösterilir. Eşikler yorumun gücünü sınırlar; ham metrikler her zaman kanıt sayısıyla birlikte sunulur.

## Saklanan veri

`NorthState.intelligence` içinde desen özeti, kullanıcının gizlediği veya yanlış işaretlediği desenler, aktif deneyler ve açıkça kabul edilmiş saat/süre kilitleri saklanır. Ham oturum kanıtı `NorthState.activities` içinde kalır.

Yeni odak kaydı; planlanan ve gerçek süreyi, başlangıcı, enerji seviyesini, duraklatma sayısını, erken bitirmeyi, tamamlanma yüzdesini ve görev türünü kaydeder. Eski kayıtlar eksik alanlarla geriye dönük uyumlu kalır.

## AI sınırı

Oranlar ve dağılımlar uygulama içinde hesaplanır. AI yalnızca yapılandırılmış, güvenilir desenleri yorumlar ve öneriye dönüştürür; metrik hesaplamaz ve değişiklikleri kullanıcı onayı olmadan uygulamaz.
