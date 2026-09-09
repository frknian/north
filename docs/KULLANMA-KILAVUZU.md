# Planorth — Kapsamlı Sistem & Kullanım Kılavuzu

> **Sürüm:** 2.4.0 (Son Güncel Durum)  
> **Felsefe:** Daha az karar, daha derin odak, sıfır suçluluk hissi.  
> **Gizlilik & Veri:** Tam veri bağımsızlığı, kişisel alan dokunulmazlığı, izole Firestore ve yerel tarayıcı desteği.

---

## İçindekiler

1. [Temel Sistem Felsefesi ve Tasarım İlkeleri](#1-temel-sistem-felsefesi-ve-tasarım-ilkeleri)
2. [Bölüm Bölüm Sistem Rehberi](#2-bölüm-bölüm-sistem-rehberi)
   - [2.1. Bugün (Ana Sayfa - `/`)](#21-bugün-ana-sayfa---)
   - [2.2. Alanlar & Alt Konu/Sınav Kampları (`/areas`)](#22-alanlar--alt-konusınav-kampları-areas)
   - [2.3. Haftalık Plan & Esnek Akış (`/week`)](#23-haftalık-plan--esnek-akış-week)
   - [2.4. Kaynaklar & Sanal Araştırma Merkezi (`/resources`)](#24-kaynaklar--sanal-araştırma-merkezi-resources)
   - [2.5. Odak Kokpiti & Dikkat Koruma (`/focus`)](#25-odak-kokpiti--dikkat-koruma-focus)
   - [2.6. İlerleme, Radar Analizi & Ritüeller (`/progress`)](#26-ilerleme-radar-analizi--ritüeller-progress)
   - [2.7. Takvim & Zaman Blokları (`/calendar`)](#27-takvim--zaman-blokları-calendar)
   - [2.8. Portföy, Lablar ve Sertifikalar (`/evidence`, `/labs`, `/certifications`)](#28-portföy-lablar-ve-sertifikalar-evidence-labs-certifications)
   - [2.9. Planorth AI Koç & Kalıcı Kural Hafızası (`/coach`)](#29-planorth-ai-koç--kalıcı-kural-hafızası-coach)
3. [Adım Adım Gerçek Hayat İş Akışları (Workflows)](#3-adım-adım-gerçek-hayat-iş-akışları-workflows)
   - [Senaryo 1: Tipik Bir Günün Akışı (Gündelik Üretkenlik)](#senaryo-1-tipik-bir-günün-akışı)
   - [Senaryo 2: Vize, Sınav veya Kamp Hazırlığı (Topic Sprint)](#senaryo-2-vize-sınav-veya-kamp-hazırlığı)
   - [Senaryo 3: Kitap Okuma & Araştırma (Google PDF + Sayfa Aralıkları + NotebookLM)](#senaryo-3-kitap-okuma--araştırma)
   - [Senaryo 4: Yoğun veya Aksayan Günlerde Kriz Yönetimi (Shrink + Postpone + Dağıtım)](#senaryo-4-yoğun-veya-aksayan-günlerde-kriz-yönetimi)
4. [Sıkça Sorulan Sorular (SSS)](#4-sıkça-sorulan-sorular-sss)
5. [Cihaz Ergonomisi & Görünüm](#5-cihaz-ergonomisi--görünüm)

---

## 1. Temel Sistem Felsefesi ve Tasarım İlkeleri

Planorth, klasik yapılacaklar listelerinin (to-do list) yol açtığı **ertelemecilik, karar yorgunluğu ve kronik yetersizlik/suçluluk hissini** kökten çözmek amacıyla inşa edilmiş kanıta dayalı bir kişisel koçluk ve derin çalışma platformudur.

Sistem 4 temel ilke üzerinde yükselir:

1. **Tek Anlamlı Öncelik Kuralı (Single Big Action):**
   Aynı anda 10 farklı görevle uğraşmak zihni felç eder. Planorth her an yalnızca üzerinde çalışman gereken **tek bir görevi** büyük bir odak kartı olarak sunar.
2. **Borçsuz ve Suçluluksuz Akış (No-Debt, No-Guilt):**
   Beklenmedik durumlar, yorgunluk veya hayatın getirdiği aksaklıklar doğaldır. Planorth'ta yetişmeyen işler "kırmızı negatif puan" veya biriken vicdani borçlara dönüşmez; tek tıkla yarı yarıya küçültülür (`Shrink`), başka güne kaydırılır (`Postpone`) veya haftalık havuza (`Pool`) iade edilir.
3. **Kişisel Alan Dokunulmazlığı (Personal Workspace Sovereignty):**
   Sayfa aralıkları, pinli notlar, okuma listeleri kullanıcının kendi zihinsel çalışma alanıdır. Sistem buraya zorla veya habersizce içerik enjekte etmez. Yapay zeka yalnızca kullanıcı talep ettiğinde öneri sunar.
4. **Kanıta Dayalı Gelişim (Evidence-Based Progression):**
   Gelişim süslü yüzdelerden değil; harcanan gerçek odak dakikalarından, okunan kitap sayfalarından, çözülen pratik lablardan ve mühürlenen pazar ritüellerinden ölçülür.

---

## 2. Bölüm Bölüm Sistem Rehberi

### 2.1. Bugün (Ana Sayfa - `/`)
Günün kontrol kulesidir. Masaüstünde tek ekranda scrollsüz çalışacak ergonomide tasarlanmıştır.

* **Büyük "ŞİMDİ" Odak Kartı:**
  - Günün saatine, enerjine ve hedeflerine göre sıradaki en önemli görevi gösterir.
  - "Odak Seansını Başlat" butonu ile tek tıkla Odak Kokpiti'ne geçer.
  - Görevi yarıya bölme (`Küçült`) ve `Ertele` kısayolları doğrudan kart üzerindedir.
* **Sabah Pusulası Ritüeli (2 Dakika):**
  - Her sabah güne başlarken günün niyetini belirler ve tek ana önceliği seçersin.
* **Günü Kapat Ritüeli (2 Dakika):**
  - Akşam çalışmayı noktalarken tamamlananları kutlar, yetişmeyenleri suçluluk duymadan sonraya veya havuza aktarırsın.
* **Aktif Kamp / Sınav Şeridi:**
  - Devam eden bir Alt Konu Kampı veya vize sprinti varsa, ekranın en üstünde geri sayım sayacı, kalan gün sayısı ve tamamlanan modül yüzdesi canlı olarak akar.
* **Günlük Mikro Alışkanlıklar:**
  - Su tüketimi, 15 sayfa kitap okuma, teknik terim tekrarı gibi mikro alışkanlık zincirlerini tek tıkla işaretleyebilirsin.
* **Hızlı Kısayollar:**
  - *Serbest Odak:* Görevsiz serbest çalışma seansı başlatır.
  - *Kitap Okuma:* Kitap odak modunu açar.
  - *Sınav Kampı Başlat:* Doğrudan Topic Sprint modalını açar.
  - *Kaynak Ara:* Çoklu kaynak arama motoruna yönlendirir.

---

### 2.2. Alanlar & Alt Konu/Sınav Kampları (`/areas`)
Uzun vadeli hedeflerin ve yoğun sınav/proje kamplarının yönetildiği alandır.

* **Kişisel Hedef Alanları:**
  - Siber Güvenlik, Yazılım Geliştirme, Yabancı Dil, Tıp, Matematik, KPSS vb. alanların ayrı ayrı kartları bulunur.
  - Her alanın kendi hedefi, seviyesi, odak süresi ve özel görevleri vardır.
* **Alt Konu & Sınav Kampı (Topic Sprint):**
  - Vize/final haftası, sertifika sınavı veya iş hayatında acil öğrenilmesi gereken bir konu için tarihli kamp oluşturulur.
  - Bitiş tarihi seçilir (örneğin: 14 gün sonra).
* **PDF & Ders Notu Yükleme:**
  - Elinizdeki ders slaytı, konu özeti veya PDF belgesini yüklersiniz.
  - Yapay zeka belgeyi inceler, mantıksal çalışma modüllerine böler, takviminize sınav etkinliği ekler ve Bugün ekranınıza entegre eder.
* **Modül İlerlemesi:**
  - Her modül tamamlandığında bir sonraki modülün görevleri otomatik olarak haftalık plana beslenir.

---

### 2.3. Haftalık Plan & Esnek Akış (`/week`)
Haftanın 7 gününü ve haftalık görev havuzunu kuşbakışı yönettiğiniz merkezdir.

* **7 Günlük Görsel Akış:**
  - Pazartesi'den Pazar'a kadar her günün görevleri ve toplam tahmini çalışma süresi görüntülenir.
* **Suçluluksuz Görev Yönetimi:**
  - **Küçült (Shrink):** 60 dakikalık bir görevi tek tıkla 30 dakikalık mikro adıma çevirir.
  - **Ertele (Postpone):** Görevi yarına veya başka bir güne kaydırır.
  - **Havuza At (Pool):** Görevi belirli bir güne bağlamadan haftalık esnek havuza alır.
* **Takvime Akıllı Otomatik Dağıtım (Smart Distribution):**
  - Havuzda bekleyen görevleri takvimdeki gerçek boşluklara otomatik yerleştirir.
  - **Seçenekler:**
    - *Yalnızca Hafta Sonu:* Görevleri sadece Cumartesi ve Pazar boşluklarına dağıtır.
    - *Yalnızca Hafta İçi:* Hafta sonuna dokunmaz, Pazartesi-Cuma arasına yerleştirir.
    - *Özel Günler:* Kullanıcının seçtiği günlere (örneğin Salı ve Perşembe) yerleştirir.
* **Kapasite Aşımı Koruması:**
  - Bir güne kapasitenin üzerinde görev yığılmasını engeller; kullanıcıyı uyararak dengeler.

---

### 2.4. Kaynaklar & Sanal Araştırma Merkezi (`/resources`)
Çalışma materyallerini, kitapları, PDF'leri ve yapay zeka araştırma araçlarını birleştiren 4 sekmeli merkezdir.

* **1. Kitaplık & Okuma Sekmesi:**
  - Kişisel kitaplarınızı ekleyin (Başlık, yazar, toplam sayfa, kategori).
  - Durum takibi: *Okunuyor*, *İstek Listesi*, *Tamamlandı*.
  - **Kitap İçi Arama Çubuğu:** Her kitabın yanında yer alan hızlı arama butonuyla o kitaba ait açık kaynakları veya Google PDF materyallerini tek tıkla sorgulayın.
* **2. Web & Google PDF Arama Sekmesi:**
  - **Canlı Web Araması:** Güvenilir teknik kaynakları, dokümantasyonları ve akademik makaleleri sorgular.
  - **Google Onaylı PDF Arama:** Tamamen sistem içinde çalışan açık PDF kitap arama motoru. Harici sekme açmadan güvenilir sonuçları, sayfa özetlerini ve doğrudan PDF bağlantılarını listeler.
  - **Tek Tıkla Kütüphaneye Ekle:** Bulunan bir PDF veya kitabı doğrudan kişisel kitaplığınıza kaydedebilirsiniz.
* **3. Pinli Belgeler & Sayfa Aralıkları Sekmesi:**
  - **Tamamen Kişisel Çalışma Alanı:** Burası kullanıcının kendi zihinsel çalışma masasıdır. Sistem buraya zorla veya izinsiz öneri eklemez.
  - **Sayfa Aralığı Tanımlama:** Bir kitabın veya belgenin belirli sayfalarını (örneğin: *Sayfa 45 - 62: Bellek Yönetimi*) pinleyin.
  - **Görsel/Ekran Görüntüsü Pinleme:** Ders notu fotoğraflarını veya grafiklerini ekleyin.
  - **Toplu Temizleme & Kaldırma:** İncelemeniz bittiğinde sayfa aralıklarını tek tek silebilir veya topluca temizleyebilirsiniz.
* **4. NotebookLM & AI Özetleyici Sekmesi:**
  - **Yapay Zeka Kaynak Özeti:** Eklediğiniz kaynaklardan ve arama sonuçlarından tek tıkla yapılandırılmış özet çıkartın.
  - **NotebookLM Kaynak Paketi Kopyalama:** Seçtiğiniz tüm kaynakları, özetleri ve notları Google NotebookLM'e tek seferde yapıştırmaya hazır Markdown/metin paketi formatında panoya kopyalayın.
  - **NotebookLM Çalışma Alanı Kısayolu:** Google NotebookLM'in resmi çalışma alanını yeni sekmede açarak derin analiz ve sesli genel bakış (Audio Overview) oluşturun.

---

### 2.5. Odak Kokpiti & Dikkat Koruma (`/focus`)
Zihinsel akışa (flow state) girmenizi sağlayan dikkat dağıtıcılardan arındırılmış tam ekran deneyimidir.

* **Zen Modu:**
  - Sayacı başlattığınızda tüm menüler, bildirimler ve dikkat dağıtıcı öğeler kaybolur.
  - İlerleme halkası, kalan süre ve mevcut alt adım net olarak görünür.
* **Ortam Ses Mikseri (Ambient Sound Mixer):**
  - 6 bağımsız ses katmanı: *Yağmur*, *Fırtına*, *Kafe*, *Şömine*, *Okyanus Dalgası*, *Beyaz Gürültü*.
  - Her birinin ses seviyesini ayrı ayrı ayarlayarak kendi ideal odak atmosferinizi oluşturabilirsiniz.
* **Yan Kaynak Dock'u (Integrated Reading Panel):**
  - Tarayıcı sekmeleri arasında kaybolup dikkatinizi dağıtmayın. Görevinizle ilgili PDF sayfa aralıklarını, web bağlantılarını veya ders notlarını sağ yan panelde açık tutarak aynı ekranda çalışın.
* **Sekme ve Odak Kilidi:**
  - Seans sırasında dikkatin başka sitelere kaymasını önleyen zihinsel mola uyarısı.

---

### 2.6. İlerleme, Radar Analizi & Ritüeller (`/progress`)
Gerçek veriye dayalı gelişim karneniz ve haftalık strateji merkezinizdir.

* **5 Eksenli Radar Analizi:**
  - *Tutarlılık (Consistency):* Günlük oturum sürekliliği.
  - *Derin Odak (Deep Focus):* Kesintisiz odak dakikaları.
  - *Pratik Çıktı (Practical Output):* Çözülen lablar ve üretilen kanıtlar.
  - *Çeşitlilik (Diversity):* Farklı alan ve becerilerin dengeli gelişimi.
  - *Plan Disiplini (Plan Adherence):* Hedeflenen görevlerin tamamlanma oranı.
* **Haftalık Pazar Kapatma Ritüeli:**
  - Her pazar günü 10 dakikada haftanın retrospektifi yapılır:
    1. Bu hafta hangi hedeflere ulaşıldı?
    2. Nerede tıkanıklık veya erteleme yaşandı?
    3. Alınan ana ders ne oldu?
    4. Gelecek haftanın tek büyük önceliği nedir?
* **Büyüyen Yol Arkadaşı (Companion):**
  - Tamamlanan görevler ve odak seanslarıyla tecrübe puanı (XP) kazanan, seviye atlayan ve sizi motive eden sanal refakatçiniz.

---

### 2.7. Takvim & Zaman Blokları (`/calendar`)
Gerçek hayatın sınırlarını sisteme öğreten koruma mekanizmasıdır.

* **Sabit Zaman Blokları:**
  - Üniversite dersleri, hastane nöbetleri, iş saatleri veya spor gibi sabit aktiviteleri takvime girin.
* **Kapasite ve Çakışma Koruması:**
  - Sistem sabit blokların olduğu saatlere görev atamaz. Günlük net serbest çalışma saatinizi hesaplayarak aşırı yüklenmenizi engeller.

---

### 2.8. Portföy, Lablar ve Sertifikalar (`/evidence`, `/labs`, `/certifications`)
Kariyerinizi ve teknik yetkinliğinizi somutlaştıran kanıt merkezidir.

* **Kanıt Havuzu (`/evidence`):**
  - Yazdığınız GitHub reposu, yayınladığınız teknik makale, tasarladığınız şema veya proje linklerini kanıt olarak kaydedin.
* **Pratik Lab Günlüğü (`/labs`):**
  - Karşılaştığınız zorlu problemleri, aldığınız hata kodlarını, denenen adımları ve ulaştığınız bağımsız çözümleri kaydedin.
  - Bağımsız çözüm süresi ve zorluk derecesini takip edin.
* **Sertifika Yol Haritası (`/certifications`):**
  - Hedeflenen sertifikaların sınav tarihleri, resmi kaynakları ve konu kapsamlarını adım adım takip edin.

---

### 2.9. Planorth AI Koç & Kalıcı Kural Hafızası (`/coach`)
Sizi tanıyan, kurallarınızı unutmayan stratejik rehberinizdir.

* **Kalıcı Kural Hafızası:**
  - Koç'a çalışma stilinizle ilgili verdiğiniz yönergeler kalıcı olarak hafızaya yazılır.
  - *Örnek Kurallar:*
    - "Pazartesi sabahları teorik değil pratik kodlama görevi ver."
    - "Gece 22:00'den sonraya zor soru çözümü koyma, yalnızca kitap okuma ver."
    - "Hafta içi seanslarımı 45 dakika ile sınırla, derin işi hafta sonuna koy."
* **Kayan Koç Butonu (Floating Widget):**
  - Hangi sayfada olursanız olun sağ alttaki butonla koça anında danışabilir, planınızı güncelletebilirsiniz.

---

## 3. Adım Adım Gerçek Hayat İş Akışları (Workflows)

### Senaryo 1: Tipik Bir Günün Akışı
1. **08:30 — Sabah Pusulası:** Bugün sayfasına gir, 2 dakikalık Sabah Pusulası'nı aç. Günün niyetini belirle ve tek ana önceliğini seç.
2. **09:00 — ŞİMDİ Kartı & Odak:** Ekranda beliren büyük odak kartına tıkla. Odak Kokpiti açılır.
3. **Odak Seansı:** Ortam ses mikserinden "Yağmur + Kafe" kombinasyonunu aç, yan dock'a ilgili notunu sabitle, sayacı başlat.
4. **17:30 — Günü Kapat:** Akşam çalışma bitince Bugün ekranından "Günü Kapat" butonuna tıkla. Tamamlananları kutla, kalanları borç hissetmeden sonraki güne veya haftalık havuza devret.

### Senaryo 2: Vize, Sınav veya Kamp Hazırlığı
1. **Alanlar Sekmesine Git:** `/areas` sayfasına gir, "Alt Konu / Sınav Kampı Başlat" butonuna tıkla.
2. **Hedef Belirle:** Kamp konusunu yaz (örn: "İşletim Sistemleri Vizesi"), sınav/bitiş tarihini seç (örn: 12 gün sonra).
3. **Ders Notu / PDF Yükle:** Slayt veya özet PDF'ini yükle. Sistem belgeyi incelesin ve 4-5 çalışma modülüne bölsün.
4. **Takvim & Şerit:** Takvimine otomatik sınav etkinliği eklenir; Bugün ekranının en üstünde geri sayım şeridi aktif olur.

### Senaryo 3: Kitap Okuma & Araştırma
1. **Kaynaklar Merkezine Git:** `/resources` sayfasına gir.
2. **Kitap Ekle veya Ara:** Kitaplık sekmesinden kitabını ekle veya arama çubuğuyla sistem içi Google PDF motorundan ilgili açık kaynağı bul.
3. **Sayfa Aralığı Pinle:** Okuyacağın bölümü belirle (örn: "Bölüm 3, Sayfa 45-60"). Sayfa aralığını pinle.
4. **NotebookLM Paketi:** Bölüm bittiğinde "NotebookLM Paketi" butonuna basarak tüm kaynak notlarını kopyala ve NotebookLM çalışma alanına aktar.

### Senaryo 4: Yoğun veya Aksayan Günlerde Kriz Yönetimi
1. **Haftalık Plana Git:** Planının aksadığı bir günde `/week` sayfasına geç.
2. **Görevi Küçült (`Shrink`):** Gözünde büyüyen 90 dakikalık görevi tek tıkla 45 dakikaya indir.
3. **Havuza Aktar (`Pool`):** Bugün yapamayacağın görevleri havuza bırak.
4. **Akıllı Dağıt:** "Takvime Otomatik Dağıt" butonuna bas, "Yalnızca Hafta Sonu" filtresini seç. Sistem havuzdaki işleri Cumartesi-Pazar boşluklarına dengeli şekilde yerleştirsin.

---

## 4. Sıkça Sorulan Sorular (SSS)

### S1: Sayfa aralıkları kişisel alan mıdır? Sistem otomatik görev atar mı?
**Cevap:** Evet, sayfa aralıkları ve pinli belgeler bölümü tamamen **kullanıcının kişisel çalışma alanıdır**. Sistem buraya zorla veya habersizce içerik/kitap eklemez. Yapay zeka yalnızca kullanıcı açıkça talep ettiğinde öneri sunar. İstediğiniz an tüm aralıkları silebilir veya güncelleyebilirsiniz.

### S2: Kitap ve Google PDF araması nasıl çalışır? Harici sitelere yönlendirir mi?
**Cevap:** Sistem doğrudan güvenilir Google Books ve açık akademik/kamusal PDF kaynakları üzerinden arama yapar. Arama sonuçları doğrudan Planorth arayüzünde kartlar halinde listelenir; kullanıcıyı rastgele sitelere veya pop-up'lara yönlendirmez. Bulunan kaynak tek tıkla kişisel kitaplığa veya pinli listeye aktarılabilir.

### S3: NotebookLM kullanmak yasal mıdır? Planorth nasıl entegre olur?
**Cevap:** Evet, Google NotebookLM; Google'ın geliştirdiği yasal, güvenli ve resmi bir yapay zeka araştırma asistanıdır. Kendi ders notlarınızı, özetlerinizi veya kamuya açık kaynakları NotebookLM'e yükleyerek soru sormak, sesli tartışma (Audio Overview) oluşturmak tamamen yasaldır. Planorth, seçtiğiniz kaynakları NotebookLM'in en iyi anlayacağı Markdown formatında tek tıkla panonuza kopyalar.

### S4: Görevler yetişmezse ceza puanı veya borç birikir mi?
**Cevap:** Hayır! Planorth felsefesinin kalbi **suçluluksuz ve borçsuz akıştır**. Yetişmeyen işler negatif puan veya biriken vicdani borç yaratmaz. Görevi tek tıkla yarı yarıya küçültebilir, erteleyebilir veya haftalık havuza iade edebilirsiniz.

### S5: Verilerim nerede saklanıyor, gizlilik nasıl sağlanıyor?
**Cevap:** Yerel modda tüm verileriniz yalnızca tarayıcınızın `localStorage` alanında saklanır. Firebase ile giriş yaptığınızda ise verileriniz Google Cloud Firestore üzerinde yalnızca sizin kullanıcı kimliğinize (`users/{uid}`) özel ve şifrelenmiş alanda tutulur. İstediğiniz an tüm verilerinizi JSON formatında indirebilir veya kalıcı olarak silebilirsiniz.

---

## 5. Cihaz Ergonomisi & Görünüm

* **Mobil (Telefon):** Alt navigasyon çubuğu ile tek elle hızlı erişim, dokunmatik uyumlu butonlar ve kartlar.
* **Tablet (iPad / Dokunmatik Ekran):** Optimize edilmiş çift sütunlu düzen, yan yana kaynak inceleme.
* **Masaüstü (Desktop / Workstation):** Geniş ekranlarda scrollsüz 100vh Odak Kokpiti, 7 günlük tam hafta akışı ve çok panelli araştırma merkezi.
