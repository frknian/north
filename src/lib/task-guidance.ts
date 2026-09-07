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

  // 1. SİBER GÜVENLİK - TEMEL AĞ & LİNUX
  if (
    t.includes("linux") ||
    t.includes("ağ ve linux") ||
    t.includes("terminal") ||
    (areaName.includes("siber") && (t.includes("ağ") || t.includes("ortam")))
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

  // 2. SİBER GÜVENLİK - LAB & PENTEST
  if (
    areaName.includes("siber") ||
    t.includes("lab") ||
    t.includes("zafiyet") ||
    t.includes("portswigger") ||
    t.includes("nmap")
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

  // 3. YAZILIM / WEB / MOBİL GELİŞTİRME
  if (
    areaName.includes("yazılım") ||
    areaName.includes("mobil") ||
    areaName.includes("software") ||
    t.includes("kod") ||
    t.includes("ekran") ||
    t.includes("proje") ||
    t.includes("özellik")
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

  // 4. VERİ ANALİZİ / YAPAY ZEKA
  if (
    areaName.includes("veri") ||
    areaName.includes("ai") ||
    areaName.includes("yapay") ||
    t.includes("sql") ||
    t.includes("pandas")
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

  // 5. SINAV HAZIRLIĞI (YKS, KPSS, BANKACILIK)
  if (
    areaName.includes("sınav") ||
    areaName.includes("yks") ||
    areaName.includes("tyt") ||
    areaName.includes("kpss") ||
    areaName.includes("banka") ||
    t.includes("soru") ||
    t.includes("deneme") ||
    t.includes("tekrar")
  ) {
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

  // 6. SATRANÇ
  if (areaName.includes("satranç") || areaName.includes("chess") || t.includes("elo") || t.includes("taktik")) {
    return {
      summary: "Bu seansta taktik bulmaca çözecek, hamle adaylarını hesaplayacak ve hataları analiz edeceksin.",
      steps: [
        {
          id: "step-1",
          title: "1. Lichess veya Chess.com Puzzles Ekranını Aç",
          detail: "Günün taktik bulmaca setine başlayın; acele etmeden tahtayı bütünüyle tarayın.",
        },
        {
          id: "step-2",
          title: "2. Şah Çekiş, Alış ve Tehditleri (ŞAT) Tara",
          detail: "Her hamlede önce tüm şah çekişleri, ardından taş alışları ve en son tehdit hamlelerini hesaplayın.",
        },
        {
          id: "step-3",
          title: "3. En Az 15-20 Taktik Bulmaca Çöz",
          detail: "Doğru hamleyi tahtada oynamadan önce zihninde sonuna kadar doğrula.",
        },
        {
          id: "step-4",
          title: "4. Yanlış Yaptığın Bulmacaları Analiz Et",
          detail: "Göremediğin motif neydi? (Çatal, açmaz, şiş, saptırma). Motifi not defterine yaz.",
        },
      ],
      resources: [
        {
          title: "Lichess — Taktik Antrenörü",
          url: "https://lichess.org/training",
          badge: "Platform",
          description: "Tamamen ücretsiz ve sınırsız taktik bulmaca çözme platformu.",
        },
        {
          title: "Lichess — Çalışmalar ve Analiz",
          url: "https://lichess.org/study",
          badge: "Rehber",
          description: "Büyükustaların oyunları, açılış teorileri ve oyun sonu dersleri.",
        },
      ],
      commands: [],
      aiPrompt: "Satranç antrenmanındayım ('" + task.title + "'). Taktik hesaplama derinliğimi artırmak için bu seansta hangi zihinsel kontrol listesini uygulamalıyım?",
    };
  }

  // 7. GENEL / DİĞER ALANLAR (AKILLI VARSAYILAN)
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
        title: "Google & Teknik Dökümantasyon",
        url: "https://google.com",
        badge: "Rehber",
        description: "Konuyla ilgili resmi döküman ve topluluk çözümleri.",
      },
    ],
    commands: [],
    aiPrompt: "Bu odak oturumunda ('" + task.title + " - " + task.goal + "') ne yapacağımı ve nasıl ilerleyeceğimi adım adım açıklar mısın? Pratik ve net adımlar ver.",
  };
}
