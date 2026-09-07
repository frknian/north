import type { Area, NorthTask } from "./north";
import { domainCatalog } from "./domain-catalog";

export interface TaskStep {
  id: string;
  title: string;
  detail: string;
  command?: string;
}

export interface TaskResourceLink {
  title: string;
  url: string;
  badge: "Lab" | "Döküman" | "Rehber" | "Cheatsheet" | "Video" | "Platform";
  description: string;
}

export interface TaskCommandTip {
  title: string;
  command: string;
  explanation: string;
}

export interface TaskGuidance {
  summary: string;
  steps: TaskStep[];
  resources: TaskResourceLink[];
  commands: TaskCommandTip[];
  aiPrompt: string;
}

export function getTaskGuidance(task: NorthTask, area?: Area): TaskGuidance {
  const t = (task.title + " " + task.goal).toLowerCase();
  const areaName = (area?.name || "").toLowerCase();
  const areaGoal = (area?.goal || "").toLowerCase();
  const kind = area?.kind;
  const domainId = area?.domainId || "";

  // 1. SATRANÇ (ÖSYM / Sınav sızıntısını kesin önlemek için öncelikli kontrol)
  if (
    kind === "chess" ||
    domainId === "chess" ||
    areaName.includes("satranç") ||
    areaName.includes("chess") ||
    /lichess|chess\.com|elo\b|şat\b|fide|açılış teorisi|oyun sonu|mat motifi|blunder/i.test(t)
  ) {
    return {
      summary: "Bu seansta taktik bulmaca çözecek, derin hamle adaylarını hesaplayacak, oyun sonu veya açılış tekniğini geliştirecek ve hatalarını motorla analiz edeceksin.",
      steps: [
        {
          id: "step-1",
          title: "1. Tahtayı ve Antrenman Ortamını Hazırla",
          detail: "Lichess Puzzles veya Chess.com analiz tahtasını açın. Dikkat dağıtıcıları kapatıp tahtadaki materyal dengesini ve şah güvenliğini tara.",
        },
        {
          id: "step-2",
          title: "2. ŞAT Taraması Yap (Şah Çekiş, Alış, Tehdit)",
          detail: "Her hamlede acele etmeden önce tüm şah çekişleri, taş alışları ve rakibin karşı tehditlerini sırasıyla hesapla.",
        },
        {
          id: "step-3",
          title: "3. Aday Hamleleri Hesapla & Zihninde Doğrula",
          detail: "Hamleyi tahtada oynamadan önce varyantın sonuna kadar zihninde görselleştir. 'Rakibimin en can sıkıcı yanıtı ne?' sorusunu sor.",
        },
        {
          id: "step-4",
          title: "4. Taktik Motifleri ve Blunder'ları Analiz Et",
          detail: "Kaçırılan veya yanlış çözülen bulmacalarda motifi belirle: çatal, açmaz, şiş, saptırma, arka yatay zafiyeti veya feda.",
        },
        {
          id: "step-5",
          title: "5. Öğretici Hamleyi ve PGN/FEN Notunu Kaydet",
          detail: "Seans sonunda çözülen taktik sayısını veya günün en kritik pozisyonunu çalışma günlüğüne ekleyerek bitir.",
        },
      ],
      resources: [
        {
          title: "Lichess — Taktik Antrenörü",
          url: "https://lichess.org/training",
          badge: "Platform",
          description: "Tamamen ücretsiz, sınırsız ve tematik taktik bulmaca çözme platformu.",
        },
        {
          title: "Lichess — Çalışmalar ve Analiz",
          url: "https://lichess.org/study",
          badge: "Rehber",
          description: "Büyükustaların oyunları, açılış teorileri ve oyun sonu dersleri koleksiyonu.",
        },
        {
          title: "Chess.com — Dersler ve Teori",
          url: "https://www.chess.com/lessons",
          badge: "Platform",
          description: "Her seviyeye uygun etkileşimli usta dersleri ve konumsal analizler.",
        },
        {
          title: "365Chess — Büyükusta PGN Veritabanı",
          url: "https://www.365chess.com/",
          badge: "Döküman",
          description: "Milyonlarca usta maçı, açılış ağacı ve varyant istatistikleri.",
        },
      ],
      commands: [
        {
          title: "Stockfish Motor Değerlendirmesi",
          command: "Stockfish Depth 20+ Analysis",
          explanation: "Tahtadaki en iyi hamle varyantını (best line) ve santipiyon (centipawn) puanını verir.",
        },
        {
          title: "FEN / PGN Kopyalama",
          command: "Export PGN / FEN string",
          explanation: "Konumu analiz tahtasına veya satranç günlüğüne aktarmak için standart notasyonu üretir.",
        },
      ],
      aiPrompt: "Satranç antrenman oturumundayım ('" + task.title + " - " + task.goal + "'). Bu seansta hesaplama derinliğimi artırmak, blunder yapmamak ve doğru planı kurmak için hangi zihinsel kontrol listesini önerirsin?",
    };
  }

  // 2. SİBER GÜVENLİK - TEMEL AĞ & LİNUX
  if (
    (kind === "cyber" || areaName.includes("siber") || areaName.includes("cyber") || areaName.includes("güvenlik")) &&
    (t.includes("linux") || t.includes("ağ ve linux") || t.includes("terminal") || t.includes("ip") || t.includes("port"))
  ) {
    return {
      summary: "Bu seansta Linux terminalinde temel ağ ve sistem durumunu adım adım doğrulayacaksın.",
      steps: [
        {
          id: "step-1",
          title: "1. Terminal veya Sanal Makineyi Başlat",
          detail: "Linux dağıtımınızı (Ubuntu, Kali, WSL veya yerel bash terminali) açın. Sistemin aktif ve yanıt verir durumda olduğunu kontrol edin.",
          command: "uname -a",
        },
        {
          id: "step-2",
          title: "2. Yerel Ağ ve IP Yapılandırmasını İncele",
          detail: "Ağ arayüzlerini (eth0, wlan0, lo vb.) ve aldığınız yerel IP adresini tespit edin.",
          command: "ip a",
        },
        {
          id: "step-3",
          title: "3. İnternet ve DNS Bağlantısını Test Et",
          detail: "Dış ağa paket gönderip alabildiğinizi ve DNS çözümlemesinin çalıştığını doğrulayın.",
          command: "ping -c 3 8.8.8.8",
        },
        {
          id: "step-4",
          title: "4. Açık Portları ve Dinlenen Soketleri Kontrol Et",
          detail: "Sistemde arka planda dinlemede olan TCP/UDP portlarını ve çalışan servisleri listeleyin.",
          command: "ss -tulpn",
        },
        {
          id: "step-5",
          title: "5. Temel Güvenlik Araçlarının Varlığını Sorgula",
          detail: "Ağ keşfi ve analiz için ileride kullanacağınız temel araçların kurulu olup olmadığını kontrol edin.",
          command: "which nmap curl tcpdump python3",
        },
        {
          id: "step-6",
          title: "6. Çıktıları Not Al & Somut Çıktıyı Kaydet",
          detail: "Terminalde aldığınız çıktıları kopyalayıp not defterinize veya seans sonu çıktısına yapıştırarak doğrulamayı tamamlayın.",
        },
      ],
      resources: [
        {
          title: "TryHackMe — Linux Fundamentals",
          url: "https://tryhackme.com/module/linux-fundamentals",
          badge: "Lab",
          description: "Tarayıcıda pratik yapabileceğin interaktif başlangıç seviyesi Linux odaları.",
        },
        {
          title: "Linux Journey — Temel Komutlar",
          url: "https://linuxjourney.com/",
          badge: "Rehber",
          description: "Adım adım dosya sistemi, izinler ve ağ komutları öğrenme rehberi.",
        },
        {
          title: "PortSwigger Web Security Academy",
          url: "https://portswigger.net/web-security",
          badge: "Platform",
          description: "Ücretsiz web güvenliği ve zafiyet laboratuvarları.",
        },
        {
          title: "OWASP Web Security Testing Guide",
          url: "https://owasp.org/www-project-web-security-testing-guide/",
          badge: "Döküman",
          description: "Güvenlik testleri ve zafiyet doğrulama resmi metodolojisi.",
        },
      ],
      commands: [
        {
          title: "IP ve Arayüz Bilgisi",
          command: "ip a",
          explanation: "Tüm aktif ağ kartlarını ve yerel IP adreslerini listeler.",
        },
        {
          title: "Ağ Gecikmesi & Paket Testi",
          command: "ping -c 3 8.8.8.8",
          explanation: "3 adet ICMP paketi yollayarak internet bağlantısını test eder.",
        },
        {
          title: "Açık Portlar & Soketler",
          command: "ss -tulpn",
          explanation: "Sistemde dinlenen TCP/UDP portlarını ve ilişkili süreçleri gösterir.",
        },
        {
          title: "Yüklü Araç Kontrolü",
          command: "which nmap curl python3",
          explanation: "Sistemde nmap, curl veya python3 kuruluysa yollarını yazar.",
        },
      ],
      aiPrompt: "Siber güvenlikte 'Temel ağ ve Linux ortamını doğrula' görevindeyim. Sıfırdan başlayan biri olarak terminalde hangi komutları çalıştırmalıyım, çıktıları nasıl yorumlamalıyım ve takıldığımda ne yapmalıyım? Lütfen adım adım ve çok sade biçimde açıkla.",
    };
  }

  // 3. SİBER GÜVENLİK - LAB & PENTEST & ZAFİYET ANALİZİ
  if (
    kind === "cyber" ||
    domainId === "cyber" ||
    areaName.includes("siber") ||
    areaName.includes("cyber") ||
    areaName.includes("pentest") ||
    areaName.includes("soc") ||
    t.includes("zafiyet") ||
    t.includes("portswigger") ||
    t.includes("nmap") ||
    t.includes("tryhackme")
  ) {
    return {
      summary: "Bu seansta zafiyet labını açıp hedef mekanizmayı analiz edecek ve çözüm adımlarını belgeleyeceksin.",
      steps: [
        {
          id: "step-1",
          title: "1. Hedef Labı Başlat ve Açıklamasını Oku",
          detail: "PortSwigger Academy veya TryHackMe üzerinde lab ortamını başlatın. Labın hedef kriterini belirleyin.",
        },
        {
          id: "step-2",
          title: "2. Girdileri ve İstekleri Keşfet",
          detail: "Tarayıcı Geliştirici Araçları (F12) veya Burp Suite Proxy ile giden istekleri ve parametreleri inceleyin.",
        },
        {
          id: "step-3",
          title: "3. Temel Payload'ı Dene ve Yanıtı Gözlemle",
          detail: "Zafiyet türüne göre (SQLi, XSS vb.) güvenli test girdisini verip sunucu yanıtındaki farkı izleyin.",
        },
        {
          id: "step-4",
          title: "4. Zafiyeti Çöz ve Ekran Görüntüsü Al",
          detail: "Başarılı çözüm bildirimini ve kullanılan payload'ı kanıt olarak saklayın.",
        },
        {
          id: "step-5",
          title: "5. Kısa Çözüm Notu (Writeup) Yaz",
          detail: "Ne denedin? Neden çalıştı? Nasıl engellenirdi? 3 maddede not alarak seansı bitir.",
        },
      ],
      resources: [
        {
          title: "PortSwigger Web Security Academy",
          url: "https://portswigger.net/web-security",
          badge: "Lab",
          description: "SQLi, XSS, CSRF gibi web zafiyetlerini ücretsiz çözebileceğiniz canlı lablar.",
        },
        {
          title: "TryHackMe — Başlangıç Yolu",
          url: "https://tryhackme.com/",
          badge: "Platform",
          description: "Adım adım yönlendirmeli siber güvenlik laboratuvarları.",
        },
        {
          title: "PayloadsAllTheThings",
          url: "https://github.com/swisskyrepo/PayloadsAllTheThings",
          badge: "Cheatsheet",
          description: "Tüm web zafiyetleri için pratik payload ve test şablonları.",
        },
      ],
      commands: [
        {
          title: "Basit Port Taraması",
          command: "nmap -sV -p 80,443,8080 <HEDEF_IP>",
          explanation: "Hedef makinede web portlarını ve servis versiyonlarını tarar.",
        },
        {
          title: "HTTP İstek Testi",
          command: "curl -I https://<HEDEF_URL>",
          explanation: "Web sunucusunun başlık (header) bilgilerini terminale getirir.",
        },
      ],
      aiPrompt: "Siber güvenlik laboratuvarı çözüyorum ('" + task.title + "'). Zafiyeti bulmak ve çözmek için hangi adımları izlemeliyim? Bana ipucu vererek rehberlik et.",
    };
  }

  // 4. MOBİL UYGULAMA GELİŞTİRME
  if (
    domainId === "mobile-dev" ||
    areaName.includes("mobil") ||
    areaName.includes("flutter") ||
    areaName.includes("react native") ||
    areaName.includes("ios") ||
    areaName.includes("android") ||
    areaName.includes("swift") ||
    areaName.includes("kotlin")
  ) {
    return {
      summary: "Bu seansta mobil emülatörü veya fiziksel cihazı bağlayacak, hedeflenen mobil arayüz bileşenini ve durum akışını kodlayacaksın.",
      steps: [
        {
          id: "step-1",
          title: "1. Emülatör veya Test Cihazını Başlat",
          detail: "Android Studio Emülatörü veya iOS Simulator'ı açın. Cihazın adb/xcode ile bağlandığını doğrulayın.",
          command: "flutter devices / adb devices",
        },
        {
          id: "step-2",
          title: "2. Ekran veya Widget İskeletini Oluştur",
          detail: "Ekrandaki görsel hiyerarşiyi (AppBar, Body, Navigation) ve yerleşim düzenini (Column, Row, Stack) kurun.",
        },
        {
          id: "step-3",
          title: "3. Reaktif Durum Yönetimini (State) Bağla",
          detail: "Kullanıcı girdisini, form durumunu veya API yanıtını ekrana bağlayan state mantığını yazın.",
        },
        {
          id: "step-4",
          title: "4. Farklı Ekran Boyutlarında Test Et",
          detail: "Klavye açıldığında taşma (overflow) hatası olup olmadığını ve responsive düzeni kontrol edin.",
        },
        {
          id: "step-5",
          title: "5. Ekran Kaydı veya APK Çıktısı Al",
          detail: "Çalışan ekranın kısa bir videosunu veya ekran görüntüsünü alıp Git commit ile oturumu tamamlayın.",
          command: 'git commit -m "feat: mobile screen output"',
        },
      ],
      resources: [
        {
          title: "Flutter Documentation",
          url: "https://docs.flutter.dev/",
          badge: "Döküman",
          description: "Flutter widget kataloğu, state management ve mimari rehberleri.",
        },
        {
          title: "Android Developers",
          url: "https://developer.android.com/",
          badge: "Rehber",
          description: "Android Studio, Kotlin ve Jetpack Compose resmi dokümantasyonu.",
        },
        {
          title: "Apple Developer Documentation",
          url: "https://developer.apple.com/documentation/",
          badge: "Döküman",
          description: "Swift, SwiftUI ve iOS uygulama tasarımı kılavuzları.",
        },
      ],
      commands: [
        {
          title: "Bağlı Cihazları Listele",
          command: "flutter devices",
          explanation: "Aktif emülatör ve telefonları listeler.",
        },
        {
          title: "Mobil Canlı Önizleme",
          command: "flutter run / npm run android",
          explanation: "Uygulamayı cihaza derleyip sıcak yeniden başlatma (hot reload) ile çalıştırır.",
        },
      ],
      aiPrompt: "Mobil uygulama geliştirme oturumundayım ('" + task.title + "'). Bu ekranı ve state yapısını en temiz mimariyle nasıl kodlayabilirim? Örnek kod ve ipucu verir misin?",
    };
  }

  // 5. YAZILIM / WEB GELİŞTİRME
  if (
    domainId === "software" ||
    (kind === "projects" && !areaName.includes("mobil") && !areaName.includes("robotik")) ||
    areaName.includes("yazılım") ||
    areaName.includes("software") ||
    areaName.includes("web") ||
    areaName.includes("frontend") ||
    areaName.includes("backend") ||
    areaName.includes("full stack") ||
    t.includes("kodlama") ||
    t.includes("proje")
  ) {
    return {
      summary: "Bu seansta geliştirme ortamını açacak, tek bir somut fonksiyon veya arayüz parçasını kodlayıp test edeceksin.",
      steps: [
        {
          id: "step-1",
          title: "1. Çalışma Alanını ve Editörü Aç",
          detail: "VS Code veya IDE'nizi açın, projenin en güncel durumunda olduğunuzu doğrulayın.",
          command: "git status",
        },
        {
          id: "step-2",
          title: "2. Görevi Küçük Parçalara Böl",
          detail: "Yazacağınız özelliği 2-3 küçük fonksiyona veya bileşene ayırın; önce iskeleti oluşturun.",
        },
        {
          id: "step-3",
          title: "3. Kodu Yaz ve Geliştirme Sunucusunu Çalıştır",
          detail: "Değişiklikleri yaparken canlı önizleme ile ekranı veya terminal loglarını kontrol edin.",
          command: "npm run dev",
        },
        {
          id: "step-4",
          title: "4. Hata ve Edge-Case Durumlarını Sına",
          detail: "Beklenmeyen girdilerde veya boş durumlarda sistemin nasıl davrandığını test edin.",
        },
        {
          id: "step-5",
          title: "5. Temiz Bir Git Commit ile Kaydet",
          detail: "Çalışan kodu açıklayıcı bir mesajla commitleyin ve oturumu tamamlayın.",
          command: 'git add . && git commit -m "feat: tamamlanan çıktı"',
        },
      ],
      resources: [
        {
          title: "MDN Web Docs",
          url: "https://developer.mozilla.org/",
          badge: "Döküman",
          description: "JavaScript, HTML, CSS ve Web API'leri için resmi ve eksiksiz kaynak.",
        },
        {
          title: "The Odin Project",
          url: "https://www.theodinproject.com/",
          badge: "Rehber",
          description: "Uygulamalı web geliştirme müfredatı ve proje adımları.",
        },
        {
          title: "GitHub Docs — Git Temelleri",
          url: "https://docs.github.com/",
          badge: "Döküman",
          description: "Branch, commit ve PR süreçleri rehberi.",
        },
      ],
      commands: [
        {
          title: "Durumu Kontrol Et",
          command: "git status",
          explanation: "Değiştirilen ve hazırlanan dosyaları listeler.",
        },
        {
          title: "Geliştirme Sunucusunu Başlat",
          command: "npm run dev",
          explanation: "Projeyi yerel tarayıcıda canlı olarak çalıştırır.",
        },
      ],
      aiPrompt: "Bu yazılım görevinde ('" + task.title + "') kodlamaya nereden başlamalıyım? Adım adım örnek kod veya mimari önerisi verir misin?",
    };
  }

  // 6. YAPAY ZEKA VE BÜYÜK DİL MODELLERİ (AI/LLM)
  if (
    domainId === "ai-llm" ||
    areaName.includes("yapay zeka") ||
    areaName.includes("ai") ||
    areaName.includes("llm") ||
    areaName.includes("makine öğrenmesi") ||
    areaName.includes("machine learning") ||
    areaName.includes("derin öğrenme") ||
    areaName.includes("rag")
  ) {
    return {
      summary: "Bu seansta model ortamını açacak, prompt/RAG veri hattını kurgulayacak ve model çıktısını sistematik kriterlerle test edeceksin.",
      steps: [
        {
          id: "step-1",
          title: "1. Ortam Değişkenlerini ve API Anahtarlarını Doğrula",
          detail: "Çalışma ortamında API anahtarlarının ve gerekli SDK paketlerinin (OpenAI, HuggingFace vb.) kurulu olduğunu kontrol edin.",
        },
        {
          id: "step-2",
          title: "2. Prompt Şablonunu ve Girdi-Çıktı Şemasını Belirle",
          detail: "Modelin alacağı sistem talimatını ve beklenen yapılandırılmış (JSON) çıktı şemasını netleştirin.",
        },
        {
          id: "step-3",
          title: "3. Embeddings / RAG Arama Hattını Test Et",
          detail: "Bağlam belgelerini vektörleştirip arama doğruluğunu ve alaka düzeyini (relevance) küçük bir test kümesiyle sınayın.",
        },
        {
          id: "step-4",
          title: "4. Halüsinasyon ve Hata Durumlarını Denetle",
          detail: "Uç senaryolarda (edge cases, boş veri) modelin nasıl davrandığını ve temperature etkisini gözlemleyin.",
        },
        {
          id: "step-5",
          title: "5. Eval Sonucunu ve Benchmark Metriklerini Kaydet",
          detail: "Gecikme (latency), maliyet ve doğruluk skorunu not alarak seansı tamamlayın.",
        },
      ],
      resources: [
        {
          title: "Hugging Face Course",
          url: "https://huggingface.co/learn",
          badge: "Platform",
          description: "Transformers, NLP ve açık kaynak dil modelleri uygulamalı eğitimleri.",
        },
        {
          title: "DeepLearning.AI Courses",
          url: "https://www.deeplearning.ai/",
          badge: "Rehber",
          description: "RAG, Prompt Mühendisliği ve LLM uygulama geliştirme kısa dersleri.",
        },
        {
          title: "Google AI for Developers",
          url: "https://ai.google.dev/",
          badge: "Döküman",
          description: "Gemini API, embeddings ve yapılandırılmış çıktı kılavuzları.",
        },
      ],
      commands: [
        {
          title: "Gerekli Paket Kurulumu",
          command: "pip install openai langchain transformers",
          explanation: "Temel yapay zeka geliştirme paketlerini kurar.",
        },
      ],
      aiPrompt: "Yapay zeka ve LLM oturumundayım ('" + task.title + "'). RAG mimarisi, prompt tasarımı ve eval değerlendirmesi için bana en iyi pratikleri gösterir misin?",
    };
  }

  // 7. VERİ ANALİZİ / İŞ ZEKASI
  if (
    domainId === "data-analysis" ||
    areaName.includes("veri analizi") ||
    areaName.includes("data analysis") ||
    areaName.includes("veri analitiği") ||
    areaName.includes("iş zekası") ||
    areaName.includes("bi") ||
    t.includes("pandas") ||
    t.includes("sql sorgu")
  ) {
    return {
      summary: "Bu seansta veri setini yükleyecek, temel istatistikleri çıkaracak ve ilk görselleştirmeyi/sorguyu üreteceksin.",
      steps: [
        {
          id: "step-1",
          title: "1. Jupyter Notebook veya SQL İstemcisini Aç",
          detail: "Çalışma ortamını hazırlayın ve veri setinin başarıyla yüklendiğini doğrulayın.",
        },
        {
          id: "step-2",
          title: "2. Verinin Şemasını ve İlk Satırlarını İncele",
          detail: "Sütun adlarını, veri tiplerini ve eksik değer (null) oranlarını kontrol edin.",
          command: "df.info(); df.head(5)",
        },
        {
          id: "step-3",
          title: "3. Hedef İstatistiği veya Gruplamayı Hesapla",
          detail: "Ortalama, medyan, groupby veya JOIN ile aradığınız sorunun cevabını hesaplayın.",
        },
        {
          id: "step-4",
          title: "4. Grafik veya Tablo Olarak Görselleştir",
          detail: "Çıkarımı destekleyen bir çubuk/çizgi grafik oluşturun veya temiz bir tablo çıktısı alın.",
        },
        {
          id: "step-5",
          title: "5. Kısa İş Çıkarımı Notu Yaz",
          detail: "Bu veri ne anlatıyor? 2 cümlelik iş özetini not alarak seansı tamamla.",
        },
      ],
      resources: [
        {
          title: "Kaggle — Pratik Veri Setleri ve Not Defterleri",
          url: "https://www.kaggle.com/",
          badge: "Platform",
          description: "Binlerce gerçek veri seti ve topluluk analiz kodları.",
        },
        {
          title: "Pandas Resmi Dokümantasyonu",
          url: "https://pandas.pydata.org/docs/",
          badge: "Döküman",
          description: "Veri temizleme, filtreleme ve aggregation rehberi.",
        },
        {
          title: "Mode SQL Tutorial",
          url: "https://mode.com/sql-tutorial/",
          badge: "Rehber",
          description: "Temelden ileri düzeye analitik SQL sorguları rehberi.",
        },
      ],
      commands: [
        {
          title: "Özet İstatistikler",
          command: "df.describe()",
          explanation: "Sayısal sütunların ortalama, standart sapma ve çeyrekliklerini özetler.",
        },
        {
          title: "Eksik Değer Kontrolü",
          command: "df.isnull().sum()",
          explanation: "Her sütundaki boş/kayıp veri sayısını listeler.",
        },
      ],
      aiPrompt: "Veri analitiği görevimde ('" + task.title + "') hangi SQL veya Python Pandas adımlarını izlemeliyim? Örnek kod ve mantık açıklar mısın?",
    };
  }

  // 8. ROBOTİK KODLAMA VE GÖMÜLÜ SİSTEMLER
  if (
    domainId === "robotics" ||
    areaName.includes("robotik") ||
    areaName.includes("arduino") ||
    areaName.includes("raspberry") ||
    areaName.includes("gömülü") ||
    areaName.includes("embedded") ||
    areaName.includes("mikrodenetleyici")
  ) {
    return {
      summary: "Bu seansta devre şemasını ve pin bağlantılarını kuracak, mikrodenetleyici kodunu derleyip fiziksel çıktıyı test edeceksin.",
      steps: [
        {
          id: "step-1",
          title: "1. Devre Bağlantılarını ve Güç Hattını Doğrula",
          detail: "VCC, GND ve sensör pinlerinin kısa devre oluşturmadan doğru bağlandığını şemadan kontrol edin.",
        },
        {
          id: "step-2",
          title: "2. Gerekli Kütüphaneleri Dahil Et ve Pini Başlat",
          detail: "Kullanılan sensör kütüphanelerini ekleyin ve setup() fonksiyonunda pin modlarını tanımlayın.",
        },
        {
          id: "step-3",
          title: "3. Kodu Derle ve Cihaza Yükle",
          detail: "Doğru COM portunu ve kart modelini seçerek kodu mikrodenetleyiciye flash edin.",
        },
        {
          id: "step-4",
          title: "4. Seri Port Monitöründen Çıktıyı İzle",
          detail: "Sensörden gelen ham analog/dijital verileri Serial Plotter veya Serial Monitor üzerinden izleyin.",
        },
        {
          id: "step-5",
          title: "5. Fiziksel Çıktıyı ve Kanıtı Kaydet",
          detail: "Motor, röle veya LED davranışını doğrulayıp devre şeması veya video kanıtı alarak seansı tamamlayın.",
        },
      ],
      resources: [
        {
          title: "Arduino Documentation",
          url: "https://docs.arduino.cc/",
          badge: "Döküman",
          description: "Resmi Arduino referansı, pin yapıları ve donanım kılavuzları.",
        },
        {
          title: "Raspberry Pi Documentation",
          url: "https://www.raspberrypi.com/documentation/",
          badge: "Rehber",
          description: "GPIO pinleri, Linux yapılandırması ve gömülü Python rehberi.",
        },
      ],
      commands: [
        {
          title: "Seri İletişim Başlatma",
          command: "Serial.begin(9600);",
          explanation: "9600 baud hızında seri iletişim hattını açar.",
        },
      ],
      aiPrompt: "Gömülü sistemler ve robotik görevindeyim ('" + task.title + "'). Bu devreyi ve kod mantığını nasıl kurmalıyım? Donanım güvenliği ve zamanlama önerileri verir misin?",
    };
  }

  // 9. KALİTE MÜHENDİSLİĞİ
  if (
    domainId === "quality-engineering" ||
    areaName.includes("kalite") ||
    areaName.includes("quality") ||
    areaName.includes("six sigma") ||
    areaName.includes("altı sigma") ||
    areaName.includes("dmaic") ||
    areaName.includes("spc") ||
    areaName.includes("fmea")
  ) {
    return {
      summary: "Bu seansta süreç sapmasını tanımlayacak, kök neden analizi yapacak ve önleyici kalite aksiyonunu belgeleyeceksin.",
      steps: [
        {
          id: "step-1",
          title: "1. Problemi ve Kritik Kalite Ölçütünü (CTQ) Tanımla",
          detail: "Müşteri veya üretim şartnamesindeki tolerans sınırlarını (USL, LSL) ve hata türünü netleştirin.",
        },
        {
          id: "step-2",
          title: "2. Veri Dağılımını ve Kontrol Sınırlarını İncele",
          detail: "Süreçten alınan ölçümleri kontrol kartına (X-bar, R chart) döküp özel nedenli sapmaları belirleyin.",
        },
        {
          id: "step-3",
          title: "3. Balık Kılçığı veya 5 Neden ile Kök Nedene İn",
          detail: "İnsan, makine, malzeme, yöntem faktörlerini tarayarak hatayı üreten ana sebebi bulun.",
        },
        {
          id: "step-4",
          title: "4. Düzeltici Aksiyon ve Poka-Yoke Tasarımı Yap",
          detail: "Hatanın tekrar oluşmasını fiziksel veya sistemsel olarak engelleyen tasarım önerisini yazın.",
        },
        {
          id: "step-5",
          title: "5. FMEA veya Kalite Kontrol Planına Kaydet",
          detail: "Aksiyonu RÖS (Risk Öncelik Sayısı) veya kontrol formu formatında kaydederek seansı tamamla.",
        },
      ],
      resources: [
        {
          title: "ASQ (American Society for Quality)",
          url: "https://asq.org/",
          badge: "Rehber",
          description: "DMAIC metodolojisi, FMEA ve kalite araçları küresel standartları.",
        },
        {
          title: "NIST Manufacturing Engineering",
          url: "https://www.nist.gov/",
          badge: "Döküman",
          description: "Metroloji, ölçüm belirsizliği ve istatistiksel proses kontrol rehberleri.",
        },
      ],
      commands: [
        {
          title: "Proses Yeterlilik İndisi (Cpk)",
          command: "Cpk = min((USL - mean)/(3*sigma), (mean - LSL)/(3*sigma))",
          explanation: "Sürecin tolerans sınırları içinde merkezlenmiş üretim yeteneğini ölçer.",
        },
      ],
      aiPrompt: "Kalite mühendisliği çalışmasındayım ('" + task.title + "'). Bu sapmayı analiz etmek için Balık Kılçığı ve DMAIC adımlarını nasıl işletmeliyim?",
    };
  }

  // 10. TIP VE SAĞLIK BİLİMLERİ
  if (
    domainId === "medicine" ||
    areaName.includes("tıp") ||
    areaName.includes("sağlık") ||
    areaName.includes("klinik") ||
    areaName.includes("anatomi") ||
    areaName.includes("fizyoloji") ||
    areaName.includes("farmakoloji")
  ) {
    return {
      summary: "Bu seansta patofizyolojik mekanizmayı inceleyecek, kanıta dayalı klinik kılavuzları tarayacak ve anonim vaka çıkarımı yapacaksın.",
      steps: [
        {
          id: "step-1",
          title: "1. Mekanizma veya Klinik Tabloyu Belirle",
          detail: "İncelenecek hastalığın fizyopatolojik adımlarını ve semptom-bulgu ilişkisini açın.",
        },
        {
          id: "step-2",
          title: "2. Güncel Kılavuz ve Literatürü Tara",
          detail: "PubMed veya uzman dernek kılavuzlarından (WHO, Sağlık Bakanlığı) birinci basamak tanı ve tedavi ilkelerini okuyun.",
        },
        {
          id: "step-3",
          title: "3. Ayırıcı Tanı ve Akıl Yürütme Şeması Çıkar",
          detail: "Benzer semptom gösteren durumları eleyen klinik ipuçlarını tek akış şemasında toplayın.",
        },
        {
          id: "step-4",
          title: "4. Anonim Vaka Senaryosu Üzerinde Sına",
          detail: "Kişisel verilerden arındırılmış eğitim vakası üzerinde tanı ve tedavi adımlarını test edin.",
        },
        {
          id: "step-5",
          title: "5. Klinik İncelik Notunu Kaydet",
          detail: "Öğrendiğin kritik ilaç etkileşimini veya tanı kriterini çalışma notuna kaydederek oturumu bitir.",
        },
      ],
      resources: [
        {
          title: "PubMed Central (PMC)",
          url: "https://www.ncbi.nlm.nih.gov/pmc/",
          badge: "Döküman",
          description: "Biyomedikal ve yaşam bilimleri hakemli açık erişim makale veritabanı.",
        },
        {
          title: "NCBI Bookshelf",
          url: "https://www.ncbi.nlm.nih.gov/books/",
          badge: "Rehber",
          description: "Tıbbi biyoloji, fizyoloji ve klinik tıp referans kitaplığı.",
        },
      ],
      commands: [],
      aiPrompt: "Tıp ve sağlık bilimleri oturumundayım ('" + task.title + "'). Bu konunun fizyopatolojisini ve kanıta dayalı ayırıcı tanı adımlarını sade bir dille açıklar mısın?",
    };
  }

  // 11. TARİH VE SOSYAL BİLİMLER
  if (
    domainId === "history" ||
    areaName.includes("tarih") ||
    areaName.includes("history") ||
    areaName.includes("arşiv") ||
    areaName.includes("cumhuriyet") ||
    areaName.includes("osmanlı")
  ) {
    return {
      summary: "Bu seansta dönemin birincil ve ikincil belgelerini inceleyecek, kaynak eleştirisi (tenkit) yapacak ve bağlamsal çıkarım üreteceksin.",
      steps: [
        {
          id: "step-1",
          title: "1. Tarihsel Dönemi ve Birincil Kaynakları Aç",
          detail: "İncelenen olayın gerçekleştiği döneme ait arşiv belgeleri, mektuplar veya anlaşma metinlerini hazırlayın.",
        },
        {
          id: "step-2",
          title: "2. Tarihsel Bağlamı ve Dönem Zihniyetini Kur",
          detail: "Olayı bugünün değer yargılarıyla değil, dönemin ekonomik, siyasi ve kültürel şartlarıyla değerlendirin.",
        },
        {
          id: "step-3",
          title: "3. Dış ve İç Tenkit Uygula",
          detail: "Yazarın kimliği, yazılış amacı, ifadenin taraflılığı ve bilginin diğer kaynaklarla tutarlılığını sorgulayın.",
        },
        {
          id: "step-4",
          title: "4. Neden-Sonuç İlişkilerini Haritalandır",
          detail: "Olayın zeminini hazırlayan faktörleri ve uzun vadeli sonuçlarını 3 maddede özetleyin.",
        },
        {
          id: "step-5",
          title: "5. Kaynakçalı Analiz Özetini Kaydet",
          detail: "Dipnotları ve birincil kaynak referanslarını içeren çalışma notunu portföyüne ekle.",
        },
      ],
      resources: [
        {
          title: "Türk Tarih Kurumu Kütüphanesi",
          url: "https://ttk.gov.tr/",
          badge: "Döküman",
          description: "Resmi tarih araştırmaları, süreli yayınlar ve kaynak belgeler.",
        },
        {
          title: "Devlet Arşivleri Başkanlığı",
          url: "https://www.devletarsivleri.gov.tr/",
          badge: "Platform",
          description: "Osmanlı ve Cumhuriyet dönemi dijitalleştirilmiş arşiv koleksiyonları.",
        },
      ],
      commands: [],
      aiPrompt: "Tarih araştırması oturumundayım ('" + task.title + "'). Bu dönemi anakronizme düşmeden, birincil kaynaklar ve tarihsel bağlam ışığında nasıl analiz etmeliyim?",
    };
  }

  // 12. YABANCI DİL
  if (
    domainId === "language" ||
    areaName.includes("ingilizce") ||
    areaName.includes("dil") ||
    areaName.includes("english") ||
    areaName.includes("almanca") ||
    areaName.includes("ielts") ||
    areaName.includes("toefl")
  ) {
    return {
      summary: "Bu seansta hedef dilde bağlamsal kelime öğrenecek, aktif sesli telaffuz yapacak ve kısa bir üretim çıktısı kaydedeceksin.",
      steps: [
        {
          id: "step-1",
          title: "1. Bağlam Metnini veya Dinleme Parçasını Aç",
          detail: "Hedef dilde bir makale, podcast veya video bölümünü açın; ilk dinlemeyi/okumayı not almadan yapın.",
        },
        {
          id: "step-2",
          title: "2. 10 Yeni Kalıp veya Kelimeyi Bağlamıyla Çıkar",
          detail: "Kelimeleri tek başına değil, içinde geçtiği tam cümle ve eşdizimlilikleriyle (collocations) birlikte yazın.",
        },
        {
          id: "step-3",
          title: "3. Gölgeleme (Shadowing) ve Sesli Telaffuz Yap",
          detail: "Konuşmacının ritmini, tonlamasını ve vurgularını taklit ederek yüksek sesle 5 dakika tekrar edin.",
        },
        {
          id: "step-4",
          title: "4. Kendi Cümlelerinle Kısa Bir Üretim Yap",
          detail: "Öğrendiğin yeni kalıpları kullanarak 1 paragraflık yazı yaz veya 1 dakikalık sesli kayıt al.",
        },
        {
          id: "step-5",
          title: "5. Aralıklı Tekrar Kartlarına (Flashcard) Ekle",
          detail: "Yeni cümleleri Anki veya çalışma listesine kaydederek seansı tamamla.",
        },
      ],
      resources: [
        {
          title: "British Council LearnEnglish",
          url: "https://learnenglish.britishcouncil.org/",
          badge: "Platform",
          description: "A1-C1 seviyelerinde dinleme, okuma ve gramer pratikleri.",
        },
        {
          title: "Cambridge Dictionary",
          url: "https://dictionary.cambridge.org/",
          badge: "Döküman",
          description: "İngilizce-Türkçe ve tek dilli sözlük, telaffuz sesleri ve örnek cümleler.",
        },
      ],
      commands: [],
      aiPrompt: "Yabancı dil öğrenme oturumundayım ('" + task.title + "'). Yazdığım veya telaffuz ettiğim cümleleri gramer, doğallık ve kelime zenginliği yönünden kontrol edip düzeltir misin?",
    };
  }

  // 13. OKUMA VE EDEBİYAT / FELSEFE
  if (
    kind === "reading" ||
    domainId === "reading" ||
    areaName.includes("okuma") ||
    areaName.includes("kitap") ||
    areaName.includes("roman") ||
    areaName.includes("felsefe") ||
    areaName.includes("edebiyat")
  ) {
    return {
      summary: "Bu seansta dikkati dağıtmadan hedeflenen sayfa bloğunu okuyacak, anahtar pasajları not alacak ve bölüm özetini çıkaracaksın.",
      steps: [
        {
          id: "step-1",
          title: "1. Sessiz ve Odaklı Bir Okuma Alanı Kur",
          detail: "Bildirimleri kapatın, kaleminizi ve okuma defterinizi yanınıza alın. Hedef sayfa sayısını belirleyin (Örn: 20-30 sayfa).",
        },
        {
          id: "step-2",
          title: "2. Kesintisiz Okuma Bloğunu Başlat",
          detail: "İlk 20 dakika boyunca duraklamadan, metnin ana fikrini ve yazarın savını takip ederek okuyun.",
        },
        {
          id: "step-3",
          title: "3. Çarpıcı Argüman ve Alıntıları İşaretle",
          detail: "Kitabın kenarına kendi kısa notlarınızı düşün veya beğendiğiniz alıntıları defterinize aktarın.",
        },
        {
          id: "step-4",
          title: "4. Kendi Cümlelerinle 3 Maddelik Özet Çıkar",
          detail: "Yazar bu bölümde neyi kanıtlamaya çalıştı? Karşıt görüş ne olabilirdi? 3 maddede yazın.",
        },
        {
          id: "step-5",
          title: "5. Okunan Sayfa Sayısını ve Düşünce Notunu Kaydet",
          detail: "Toplam ilerlemeyi ve seans sonu fikrini çalışma kütüğüne işleyerek seansı tamamla.",
        },
      ],
      resources: [
        {
          title: "Open Library",
          url: "https://openlibrary.org/",
          badge: "Platform",
          description: "Milyonlarca açık erişimli kitap, basım bilgisi ve okuma kütüğü.",
        },
        {
          title: "Stanford Encyclopedia of Philosophy",
          url: "https://plato.stanford.edu/",
          badge: "Döküman",
          description: "Felsefi kavramlar, düşünürler ve argümanlar üzerine akademik açık kaynak.",
        },
      ],
      commands: [],
      aiPrompt: "Okuduğum bu eser ('" + task.title + " - " + task.goal + "') üzerine derinlemesine düşünmek istiyorum. Metindeki ana tezi ve olası eleştirileri tartışmamız için bana 3 kışkırtıcı soru sorar mısın?",
    };
  }

  // 14. FİNANS VE BORSA
  if (
    domainId === "finance" ||
    areaName.includes("finans") ||
    areaName.includes("borsa") ||
    areaName.includes("yatırım") ||
    areaName.includes("hisse") ||
    areaName.includes("trading")
  ) {
    return {
      summary: "Bu seansta mali tabloları inceleyecek, temel rasyoları hesaplayacak ve risk-getiri dengesini yazılı kurallarla çerçeveleyeceksin.",
      steps: [
        {
          id: "step-1",
          title: "1. Bilanço ve Gelir Tablosunu Aç",
          detail: "Şirketin Kamuyu Aydınlatma Platformu (KAP) veya finans portalındaki en güncel çeyrek finansal tablolarını indirin.",
        },
        {
          id: "step-2",
          title: "2. Temel Değerleme Rasyolarını İncele",
          detail: "F/K, PD/DD, FAVÖK marjı, Net Borç / FAVÖK ve özkaynak kârlılığını sektör ortalamalarıyla karşılaştırın.",
        },
        {
          id: "step-3",
          title: "3. Nakit Akış Tablosundaki Gerçek Parayı Sına",
          detail: "İşletme faaliyetlerinden net nakit akışının dönem kârını destekleyip desteklemediğini kontrol edin.",
        },
        {
          id: "step-4",
          title: "4. Risk ve Portföy Ağırlığını Belirle",
          detail: "Tek bir şirkette aşırı risk almamak için portföy payını ve zarar kes (stop-loss) seviyesini belirleyin.",
        },
        {
          id: "step-5",
          title: "5. Analiz Gerekçesini Yatırım Günlüğüne Kaydet",
          detail: "Neden bu kararı aldığını, temel varsayımlarını yazarak arşivle.",
        },
      ],
      resources: [
        {
          title: "Borsa İstanbul Akademi",
          url: "https://www.borsaistanbul.com/",
          badge: "Rehber",
          description: "Temel ve teknik analiz eğitimleri, piyasa işleyişi rehberleri.",
        },
        {
          title: "SPK Yatırımcı Bilgilendirme",
          url: "https://spk.gov.tr/",
          badge: "Döküman",
          description: "Sermaye piyasası mevzuatı, yatırımcı hakları ve risk bildirimleri.",
        },
      ],
      commands: [],
      aiPrompt: "Finansal analiz oturumundayım ('" + task.title + "'). Bu şirketin bilançosunu ve rasyolarını değerlendirirken hangi risk faktörlerine özellikle dikkat etmeliyim?",
    };
  }

  // 15. MATEMATİK VE İSTATİSTİK
  if (
    kind === "math" ||
    domainId === "mathematics" ||
    domainId === "statistics" ||
    domainId === "economics" ||
    areaName.includes("matematik") ||
    areaName.includes("math") ||
    areaName.includes("istatistik") ||
    areaName.includes("calculus") ||
    areaName.includes("cebir")
  ) {
    return {
      summary: "Bu seansta teorem veya kavramın mantığını kavrayacak, formülü türetecek ve süreksiz en az 5-10 nitelikli problem çözeceksin.",
      steps: [
        {
          id: "step-1",
          title: "1. Teoremin Mantığını ve İspatını Oku",
          detail: "Formülü ezberlemek yerine arkasındaki geometrik veya cebirsel mantığı tek sayfada çıkarın.",
        },
        {
          id: "step-2",
          title: "2. Çözümlü 2 Örnek Problemi İncele",
          detail: "İlk adımları izleyin; hangi değişkenin neden kullanıldığını mantık zinciriyle doğrulayın.",
        },
        {
          id: "step-3",
          title: "3. Yardımsız 5 Problem Çöz",
          detail: "Kağıt ve kalemle, çözüme bakmadan problemleri çözün; takıldığınız adımı kırmızı kalemle işaretleyin.",
        },
        {
          id: "step-4",
          title: "4. Hata ve İşlem Analizi Yap",
          detail: "Hata kavramsal mıydı, işlem/aritmetik dikkatsizliği miydi? Sebebini yanına not edin.",
        },
        {
          id: "step-5",
          title: "5. Formül Defterine Püf Noktayı Ekle",
          detail: "Günün kuralını veya modelini formül özetine kaydederek oturumu bitir.",
        },
      ],
      resources: [
        {
          title: "Khan Academy — Matematik",
          url: "https://www.khanacademy.org/math",
          badge: "Platform",
          description: "Cebir, trigonometri, kalkülüs ve doğrusal cebir adım adım dersleri.",
        },
        {
          title: "MIT OpenCourseWare — Mathematics",
          url: "https://ocw.mit.edu/",
          badge: "Döküman",
          description: "Üniversite düzeyinde matematik ders notları ve problem setleri.",
        },
      ],
      commands: [],
      aiPrompt: "Matematik / istatistik oturumundayım ('" + task.title + "'). Bu problemi çözerken hangi kavramsal adımları izlemeliyim? Formülü ezberletmeden mantığını açıklar mısın?",
    };
  }

  // 16. AKADEMİK SINAV HAZIRLIĞI (YKS, KPSS, BANKACILIK SINAVLARI)
  // DİKKAT: Yalnızca gerçek sınav alanlarında tetiklenir; satranç, yazılım veya okuma ASLA buraya düşemez.
  const isActualExamDomain =
    domainId === "yks-tyt" ||
    domainId === "kpss" ||
    domainId === "banking" ||
    /yks|tyt|ayt|kpss|ales|dgs|banka|müfettiş/i.test(areaName) ||
    (/sınav/i.test(areaName) && !/satranç|kodlama|yazılım|okuma/i.test(areaName));

  if (isActualExamDomain) {
    return {
      summary: "Bu seansta konuyu özetleyecek, süre tutarak soru çözecek ve yanlışlarının nedenini analiz edeceksin.",
      steps: [
        {
          id: "step-1",
          title: "1. Masayı ve Kaynak Kitabı/Denemeyi Hazırla",
          detail: "Dikkati dağıtan telefon ve sekmeleri kapatın. Hedef soru sayısını belirleyin (Örn: 20 soru).",
        },
        {
          id: "step-2",
          title: "2. Süre Baskısı ile Çözüme Başla",
          detail: "Soru başına 1 - 1.5 dakika hedefi koyun. Takıldığınız soruyu işaretleyip geçin, takılı kalmayın.",
        },
        {
          id: "step-3",
          title: "3. Cevap Anahtarını Kontrol Et",
          detail: "Doğru, yanlış ve boş sayılarını not alın. Yanlışları kırmızı kalemle daire içine alın.",
        },
        {
          id: "step-4",
          title: "4. Yanlış Analizi Yap (Kavram mı, Dikkat mi, Süre mi?)",
          detail: "Yanlış yaptığın sorunun çözüm videosunu veya kitabını açıp asıl sebebi tek satırda yaz.",
        },
        {
          id: "step-5",
          title: "5. Yanlış Konusunu Tekrar Havuzuna Ekle",
          detail: "Seans sonunda net sonucunu veya öğrendiğin kuralı yansıma alanına kaydederek bitir.",
        },
      ],
      resources: [
        {
          title: "ÖSYM Geçmiş Çıkmış Sorular",
          url: "https://www.osym.gov.tr/",
          badge: "Döküman",
          description: "Önceki yıllarda sorulmuş gerçek sınav soruları ve cevap anahtarları.",
        },
        {
          title: "MEB OGM Materyal",
          url: "https://ogmmateryal.eba.gov.tr/",
          badge: "Rehber",
          description: "Kazanım testleri, konu özetleri ve etkileşimli soru bankası.",
        },
      ],
      commands: [],
      aiPrompt: "Sınav çalışma seansındayım ('" + task.title + "'). Bu konuyu en hızlı ve kalıcı biçimde nasıl tekrar edebilirim, takıldığım soru tiplerinde hangi püf noktalara dikkat etmeliyim?",
    };
  }

  // 17. GENEL / DİĞER ALANLAR (AKILLI VARSAYILAN)
  const matchedDomain = domainCatalog.find((d) => d.id === area?.domainId || d.kind === area?.kind);
  const catalogResources: TaskResourceLink[] = (matchedDomain?.resources || []).map((r) => {
    const parts = r.split("—");
    const title = parts[0]?.trim() || "Referans Kaynak";
    const url = (parts[1] || "").trim() || "https://google.com";
    return {
      title,
      url,
      badge: "Rehber",
      description: "Bu alandaki resmi öğrenme ve referans dökümanı.",
    };
  });

  return {
    summary: "Bu seansta planlanan adımları sırayla uygulayacak, takıldığın noktalarda kaynakları kullanacak ve somut çıktını üreteceksin.",
    steps: [
      {
        id: "step-1",
        title: "1. Çalışma Alanını ve Materyalleri Aç",
        detail: "Gerekli notları, tarayıcı pencerelerini ve araçları açarak dikkat dağıtıcıları kaldırın.",
      },
      {
        id: "step-2",
        title: "2. Ana Hedefe Odaklanarak Başla",
        detail: "Görevin temel amacını gerçekleştirmek için ilk eylemi yapın (" + task.goal + ").",
      },
      {
        id: "step-3",
        title: "3. Ara Değerlendirme ve Kontrol",
        detail: "Elde ettiğin sonucun hedefle örtüştüğünden emin ol; eksik veya anlaşılmayan yeri netleştir.",
      },
      {
        id: "step-4",
        title: "4. Somut Çıktını Kaydet",
        detail: "Oturum bitiminde elde ettiğin bulguyu, kodu veya notu kaydederek seansı tamamla.",
      },
    ],
    resources: catalogResources.length > 0 ? catalogResources : [
      {
        title: "Resmî Dokümantasyon ve Rehberler",
        url: "https://google.com",
        badge: "Rehber",
        description: "Konuyla ilgili resmi döküman ve topluluk çözümleri.",
      },
    ],
    commands: [],
    aiPrompt: "Bu odak oturumunda ('" + task.title + " - " + task.goal + "') ne yapacağımı ve nasıl ilerleyeceğimi adım adım açıklar mısın? Pratik ve net adımlar ver.",
  };
}
