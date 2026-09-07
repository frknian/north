export type DomainQuestion = {
  id: string;
  prompt: string;
  options: { value: string; label: string }[];
  correct: string;
  subTopic?: string;
  explanation?: string;
  recommendedReview?: string;
};

export type DomainDefinition = {
  id: string;
  name: string;
  aliases: string[];
  kind: "math" | "cyber" | "reading" | "chess" | "projects" | "custom";
  icon: string;
  metric: string;
  defaultProofType?: string;
  resources: string[];
  starterTasks: {
    title: string;
    goal: string;
    minutes: number;
    taskType: "deep_work" | "practice" | "problem_solving" | "lab" | "review" | "reading" | "creative" | "administrative" | "light";
  }[];
  questions: DomainQuestion[];
};

const options = (a: string, b: string, c: string) => [{ value: "a", label: a }, { value: "b", label: b }, { value: "c", label: c }];

export const domainCatalog: DomainDefinition[] = [
  {
    id: "mathematics",
    name: "Matematik",
    aliases: ["matematik", "calculus", "lineer cebir", "geometri", "math", "analiz"],
    kind: "math",
    icon: "∑",
    metric: "Çözülen problem",
    defaultProofType: "Problem çözüm notu veya formül çıkarımı",
    resources: ["Khan Academy — https://www.khanacademy.org/math", "MIT OpenCourseWare — https://ocw.mit.edu/"],
    starterTasks: [
      { title: "Konu ve ön koşul haritası çıkar", goal: "Çalışacağın konuyu ve eksik ön koşulları tek sayfada yaz.", minutes: 45, taskType: "deep_work" },
      { title: "Temel problem seti çöz", goal: "En az 10 problem çöz ve yanlışlarını sınıflandır.", minutes: 50, taskType: "problem_solving" },
    ],
    questions: [
      { id: "function", prompt: "f(x)=2x+3 için f(4) kaçtır?", options: options("11", "8", "14"), correct: "a", subTopic: "Fonksiyonlar", explanation: "f(4) için x yerine 4 yazılır: 2(4)+3 = 8+3 = 11.", recommendedReview: "Fonksiyonlarda değer bulma ve grafik okuma tekrarı yap." },
      { id: "equation", prompt: "3x−6=12 denkleminin çözümü nedir?", options: options("x=6", "x=4", "x=2"), correct: "a", subTopic: "Birinci Dereceden Denklemler", explanation: "3x = 18 => x = 6.", recommendedReview: "Temel cebir ve denklem çözme adımlarını gözden geçir." },
      { id: "derivative", prompt: "Türevin temel kullanım alanlarından biri nedir?", options: options("Değişim hızını ve eğimi incelemek", "Sadece sayıları ezberlemek", "Metin düzenlemek"), correct: "a", subTopic: "Türev Kavramı", explanation: "Türev bir fonksiyonun anlık değişim hızını ve teğetinin eğimini verir.", recommendedReview: "Türevin geometrik ve fiziksel yorumu üzerine çalış." },
    ],
  },
  {
    id: "software",
    name: "Yazılım Geliştirme",
    aliases: ["yazılım", "uygulama geliştirme", "programlama", "kodlama", "web geliştirme", "frontend", "backend", "software engineering", "full stack", "developer"],
    kind: "projects",
    icon: "◇",
    metric: "Tamamlanan çıktı",
    defaultProofType: "GitHub depo bağlantısı veya canlı demo",
    resources: ["MDN Web Docs — https://developer.mozilla.org/", "The Odin Project — https://www.theodinproject.com/"],
    starterTasks: [
      { title: "Geliştirme ortamını doğrula", goal: "Çalışan küçük bir proje oluştur ve çalıştırma adımlarını kaydet.", minutes: 45, taskType: "practice" },
      { title: "İlk küçük özelliği geliştir", goal: "Tek bir kullanıcı ihtiyacını karşılayan özelliği bitir ve kanıtını kaydet.", minutes: 60, taskType: "creative" },
    ],
    questions: [
      { id: "http", prompt: "HTTP 404 yanıtı neyi ifade eder?", options: options("Kaynak sunucuda bulunamadı", "İstek başarıyla tamamlandı", "Kullanıcı doğrulandı"), correct: "a", subTopic: "HTTP Durum Kodları", explanation: "404 Not Found, istenen kaynağın sunucuda var olmadığını belirtir.", recommendedReview: "HTTP durum kodları (2xx, 3xx, 4xx, 5xx) tablosunu incele." },
      { id: "git", prompt: "Git'te değişiklikleri yeni kayda almak için hangi komut kullanılır?", options: options("git commit", "git clone", "git pull"), correct: "a", subTopic: "Sürüm Kontrolü (Git)", explanation: "git commit hazırlanan (staged) değişiklikleri yerel repoya yeni bir sürüm olarak kaydeder.", recommendedReview: "Git temel iş akışı (add, commit, push, branch) pratiği yap." },
      { id: "debug", prompt: "Bir hatayı ayıklarken güvenilir ilk adım hangisidir?", options: options("Hata mesajı ve tekrar üretim adımlarını incelemek", "Tüm kodu silmek", "Rastgele paket kurmak"), correct: "a", subTopic: "Hata Ayıklama (Debugging)", explanation: "Hatanın nerede ve hangi girdilerle ortaya çıktığını izlemek en güvenilir yaklaşımdır.", recommendedReview: "Konsol logları, breakpoint kullanımı ve stack trace okuma tekniklerini tekrar et." },
    ],
  },
  {
    id: "cyber",
    name: "Siber Güvenlik",
    aliases: [
      "siber güvenlik",
      "siber",
      "cyber security",
      "cybersecurity",
      "ethical hacking",
      "penetration testing",
      "pentest",
      "soc",
      "ağ güvenliği",
      "bilgi güvenliği"
    ],
    kind: "cyber",
    icon: "🛡",
    metric: "Çözülen lab ve analiz",
    defaultProofType: "Lab çözüm raporu (writeup) veya pcap ağ trafiği analizi",
    resources: [
      "OWASP Web Security Testing Guide — https://owasp.org/www-project-web-security-testing-guide/",
      "PortSwigger Web Security Academy — https://portswigger.net/web-security",
      "TryHackMe — https://tryhackme.com/"
    ],
    starterTasks: [
      { title: "Temel ağ ve Linux ortamını doğrula", goal: "Temel komutları ve araçları terminalde çalıştır.", minutes: 40, taskType: "lab" },
      { title: "İlk temel güvenlik labını tamamla", goal: "PortSwigger veya yerel bir labda temel zafiyeti sömürüp raporla.", minutes: 60, taskType: "practice" }
    ],
    questions: [
      { id: "net", prompt: "TCP üçlü el sıkışmanın (three-way handshake) doğru sırası nedir?", options: options("SYN, SYN-ACK, ACK", "ACK, SYN, FIN", "SYN, FIN, ACK"), correct: "a", subTopic: "Ağ Protokolleri (TCP/IP)", explanation: "TCP bağlantısı SYN ile başlar, sunucu SYN-ACK döner, istemci ACK göndererek bağlantıyı kurar.", recommendedReview: "TCP bayrakları ve el sıkışma mekanizmasını Wireshark ile incele." },
      { id: "auth", prompt: "Brute-force (kaba kuvvet) saldırılarını engellemek için en temel savunma nedir?", options: options("Hesap kilitleme, rate limiting ve CAPTCHA", "Şifreleri düz metin saklamak", "Tüm portları açık bırakmak"), correct: "a", subTopic: "Kimlik Doğrulama Güvenliği", explanation: "Belirli deneme sonrasında gecikme veya hesap kilitleme kaba kuvvet saldırılarını durdurur.", recommendedReview: "Rate limiting ve çok faktörlü kimlik doğrulama (MFA) ilkelerini çalış." },
      { id: "sanitize", prompt: "SQL Injection zafiyetini önlemenin en kesin ve güvenilir yolu hangisidir?", options: options("Parametreli sorgular (Prepared Statements) kullanmak", "Girdiyi yalnızca JavaScript ile kontrol etmek", "Hata mesajlarını kullanıcıya göstermek"), correct: "a", subTopic: "Web Zafiyetleri (SQLi)", explanation: "Prepared statements veriyi kod olarak yorumlanmaktan ayırarak sorguyu korur.", recommendedReview: "OWASP SQL Injection önleme kılavuzunu incele." }
    ]
  },
  {
    id: "mobile-dev",
    name: "Mobil Uygulama Geliştirme",
    aliases: ["mobil uygulama geliştirme", "mobil geliştirme", "mobile app developer", "mobile developer", "flutter", "react native", "ios geliştirme", "android geliştirme", "swift", "kotlin", "mobile app"],
    kind: "projects",
    icon: "📱",
    metric: "Çalışan mobil özellik",
    defaultProofType: "GitHub depo bağlantısı, APK veya ekran kaydı",
    resources: [
      "Android Developers — https://developer.android.com/",
      "Apple Developer Documentation — https://developer.apple.com/documentation/",
      "Flutter Documentation — https://docs.flutter.dev/",
    ],
    starterTasks: [
      { title: "Mobil ortamı ve proje iskeletini kur", goal: "Emülatör/cihaz üzerinde 'Merhaba Dünya' çalıştır ve mimariyi belirle.", minutes: 45, taskType: "practice" },
      { title: "İlk etkileşimli ekranı kodla", goal: "Kullanıcı girdisi alan ve durumu güncelleyen tek bir ekranı tamamla.", minutes: 60, taskType: "creative" },
    ],
    questions: [
      { id: "mobile-state", prompt: "Mobil uygulamalarda durum yönetiminin (state management) temel amacı nedir?", options: options("Kullanıcı arayüzü ile veri durumunu senkron ve öngörülebilir tutmak", "Sadece internet hızını artırmak", "Uygulama ikonunu değiştirmek"), correct: "a", subTopic: "Mobil Durum Yönetimi", explanation: "State management, ekranın veriler değiştikçe doğru şekilde güncellenmesini sağlar.", recommendedReview: "Bileşen yaşam döngüsü ve reaktif durum yönetimi ilkelerini çalış." },
      { id: "mobile-lifecycle", prompt: "Bir mobil uygulamanın arka plana (background) geçişinde ne yapılmalıdır?", options: options("Ağır işlemleri duraklatıp kaynakları ve durumu güvene almak", "Tüm kullanıcı verilerini silmek", "Ekranı kilitlemek"), correct: "a", subTopic: "Mobil Yaşam Döngüsü (Lifecycle)", explanation: "Arka plana geçen uygulama pil ve bellek tasarrufu için ağır işlemleri askıya almalıdır.", recommendedReview: "Mobil lifecycle durumlarını (foreground, background, paused) incele." },
      { id: "mobile-responsive", prompt: "Farklı ekran boyutlarında uyumlu mobil arayüz için hangisi doğrudur?", options: options("Esnek grid/flex yapısı ve dinamik ölçü birimleri kullanmak", "Sabit piksel genişlikleri yazmak", "Yalnızca tek bir telefon boyutunu hedeflemek"), correct: "a", subTopic: "Responsive Mobil Arayüz", explanation: "Esnek düzenler telefon ve tabletlerde tutarlı bir görünüm sağlar.", recommendedReview: "Constraint Layout, Flexbox veya AutoLayout temellerini tekrar et." },
    ],
  },
  {
    id: "data-analysis",
    name: "Veri Analizi",
    aliases: ["veri analizi", "veri analitiği", "data analysis", "data analyst", "veri analisti", "business intelligence", "bi", "pandas", "sql analizi", "eda"],
    kind: "projects",
    icon: "📊",
    metric: "Veri analizi notebook'u",
    defaultProofType: "Jupyter Notebook veya interaktif dashboard",
    resources: [
      "Kaggle Learn Data Analysis — https://www.kaggle.com/learn",
      "Pandas Documentation — https://pandas.pydata.org/docs/",
      "Our World in Data — https://ourworldindata.org/",
    ],
    starterTasks: [
      { title: "Veri kümesini yükle ve özet çıkar", goal: "Eksik değerleri, sütun tiplerini ve ilk istatistiksel dağılımı incele.", minutes: 45, taskType: "deep_work" },
      { title: "Temel keşifsel görselleştirme yap", goal: "En az iki değişken arasındaki ilişkiyi gösteren grafik hazırla.", minutes: 55, taskType: "problem_solving" },
    ],
    questions: [
      { id: "data-sql", prompt: "SQL'de WHERE ile HAVING arasındaki temel fark nedir?", options: options("WHERE gruplamadan önce, HAVING ise GROUP BY sonrası toplu filtreleme yapar", "İkisi tamamen aynı işi yapar", "HAVING sadece tablodaki sütun adını değiştirir"), correct: "a", subTopic: "SQL Filtreleme ve Gruplama", explanation: "WHERE satır bazında filtreler, HAVING toplulaştırılmış (aggregate) verileri filtreler.", recommendedReview: "SQL GROUP BY, HAVING ve toplulaştırma fonksiyonlarını (COUNT, SUM, AVG) tekrar et." },
      { id: "data-outlier", prompt: "Veri setindeki aykırı değerleri (outlier) incelerken ilk adım hangisidir?", options: options("Dağılımı görselleştirip veri toplama hatası mı gerçek sapma mı olduğunu anlamak", "Tüm aykırı değerleri hemen silmek", "Ortalamaya eşitlemek"), correct: "a", subTopic: "Veri Temizleme & Aykırı Değerler", explanation: "Aykırı değerler bilgi taşıyabilir veya sistem hatası olabilir; doğrudan silinmemelidir.", recommendedReview: "Kutu grafiği (Boxplot) ve IQR yöntemiyle aykırı değer analizini incele." },
      { id: "data-correlation", prompt: "İki değişken arasında yüksek korelasyon olması ne anlama gelir?", options: options("Birlikte değişim eğilimi gösterdiklerini, ancak doğrudan nedensellik kanıtlamadığını", "Biri diğerinin kesin sebebi olduğunu", "İkisinin de sıfıra eşit olduğunu"), correct: "a", subTopic: "Korelasyon vs Nedensellik", explanation: "Korelasyon sadece ilişkidir; nedensellik için kontrol grubu ve deney gerekir.", recommendedReview: "Pearson korelasyon katsayısı ve nedensellik yanılgıları üzerine çalış." },
    ],
  },
  {
    id: "ai-llm",
    name: "Yapay Zeka ve Büyük Dil Modelleri (AI/LLM)",
    aliases: ["ai", "llm", "yapay zeka", "machine learning", "makine öğrenmesi", "deep learning", "derin öğrenme", "nlp", "büyük dil modelleri", "rag", "prompt engineering", "transformers", "ai developer"],
    kind: "projects",
    icon: "✦",
    metric: "Tamamlanan LLM/AI deneyi",
    defaultProofType: "GitHub repo, RAG pipeline veya eval benchmark raporu",
    resources: [
      "Hugging Face Course — https://huggingface.co/learn",
      "DeepLearning.AI Short Courses — https://www.deeplearning.ai/",
      "Google AI for Developers — https://ai.google.dev/",
    ],
    starterTasks: [
      { title: "Prompt şablonu ve değerlendirme kriteri belirle", goal: "Girdi-çıktı formatını ve başarı kriterini tek dosyada tanımla.", minutes: 45, taskType: "deep_work" },
      { title: "İlk API veya embeddings deneyini çalıştır", goal: "Küçük bir veri parçasıyla yanıt kalitesini ve gecikmeyi ölç.", minutes: 60, taskType: "practice" },
    ],
    questions: [
      { id: "ai-temperature", prompt: "Bir LLM çağrısında temperature değerini sıfıra yakın tutmak ne sağlar?", options: options("Daha tutarlı, odaklı ve tekrarlanabilir yanıtlar", "Modelin hızını iki katına çıkarmak", "İnternet aramasını zorunlu kılmak"), correct: "a", subTopic: "Model Parametreleri (Temperature)", explanation: "Düşük temperature olasılık dağılımının tepesindeki belirgin tokenları seçtirir.", recommendedReview: "Temperature, top_p ve top_k parametrelerinin çıktıya etkilerini test et." },
      { id: "ai-rag", prompt: "RAG (Retrieval-Augmented Generation) mimarisinin birincil katkısı nedir?", options: options("Modele güncel veya özel belgeleri bağlam olarak sunup halüsinasyonu azaltmak", "Model parametrelerini sıfırdan eğitmek", "Yalnızca görüntü üretmek"), correct: "a", subTopic: "RAG Mimarisi", explanation: "RAG, vektör aramayla ilgili belgeleri prompt'a enjekte ederek doğruluğu artırır.", recommendedReview: "Vektör veri tabanları, embedding modelleri ve chunking stratejilerini incele." },
      { id: "ai-eval", prompt: "Bir LLM uygulamasının başarısını değerlendirirken en güvenilir yaklaşım hangisidir?", options: options("Çeşitli test senaryolarını içeren otomatik eval benchmark seti kullanmak", "Tek bir çıktıyı beğenip üretime almak", "Sadece model boyutuna bakmak"), correct: "a", subTopic: "LLM Değerlendirme (Evaluation)", explanation: "Sistematik eval setleri model güncellemelerinde gerilemeleri önler.", recommendedReview: "LLM test ve benchmark yöntemleri (ground truth karşılaştırması) çalış." },
    ],
  },
  {
    id: "history",
    name: "Tarih",
    aliases: ["tarih", "tarih bilimi", "history", "cumhuriyet tarihi", "osmanlı tarihi", "yakın çağ", "orta çağ", "türk tarihi", "dünya tarihi", "tarihçi"],
    kind: "reading",
    icon: "🏛",
    metric: "İncelenen birincil kaynak",
    defaultProofType: "Kaynakça ve birincil kaynak analizi",
    resources: [
      "Türk Tarih Kurumu — https://ttk.gov.tr/",
      "Devlet Arşivleri Başkanlığı — https://www.devletarsivleri.gov.tr/",
      "JSTOR Open Content — https://about.jstor.org/oa-and-free/",
    ],
    starterTasks: [
      { title: "Dönem ve kaynakça haritası çıkar", goal: "İnceleyeceğin dönemin temel birincil ve ikincil kaynaklarını listele.", minutes: 45, taskType: "reading" },
      { title: "Birincil metin analizi tamamla", goal: "Seçtiğin tarihsel belgeden bağlam, yazar perspektifi ve üç çıkarım not et.", minutes: 55, taskType: "deep_work" },
    ],
    questions: [
      { id: "hist-source", prompt: "Tarih araştırmasında birincil kaynak neyi ifade eder?", options: options("Olayın yaşandığı dönemde ortaya çıkmış doğrudan tanıklık veya belgeyi", "Olaydan yüzyıllar sonra yazılmış ders kitabını", "Tarihi kurgu romanını"), correct: "a", subTopic: "Tarihsel Kaynak Türleri", explanation: "Birincil kaynaklar (arşiv belgeleri, mektuplar, antlaşmalar) doğrudan dönemin ürünüdür.", recommendedReview: "Birincil ve ikincil kaynak ayrımı ile tenkit (iç/dış eleştiri) adımlarını çalış." },
      { id: "hist-anachronism", prompt: "Tarih yazımında 'anakronizm' kavramı neyi anlatır?", options: options("Geçmiş olayları günümüzün değer ve kavramlarıyla yanlış yorumlamayı", "Olayları kronolojik sıraya dizmeyi", "Arşivleri dijitalleştirmeyi"), correct: "a", subTopic: "Tarih Metodolojisi & Anakronizm", explanation: "Anakronizm, bir döneme ait olmayan olguları o döneme atfetme hatasıdır.", recommendedReview: "Tarihsel bağlam kurma ve dönemin zihniyetini anlama ilkelerini tekrar et." },
      { id: "hist-criticism", prompt: "Bir tarihsel belgenin güvenilirliğini test ederken 'iç tenkit' neyi inceler?", options: options("Yazarın taraflılığını, ifadenin tutarlılığını ve bilginin doğruluğunu", "Belgenin kağıt ve mürekkep cinsini", "Yalnızca belgenin fiyatını"), correct: "a", subTopic: "Tarihsel Eleştiri (Tenkit)", explanation: "Dış tenkit belgenin orijinalliğini, iç tenkit ise içerik ve güvenilirliğini irdeler.", recommendedReview: "Tarih metodolojisinde kaynak eleştirisi basamaklarını gözden geçir." },
    ],
  },
  {
    id: "medicine",
    name: "Tıp ve Sağlık Bilimleri",
    aliases: ["tıp", "tıp fakültesi", "medicine", "medikal", "klinik", "anatomi", "fizyoloji", "dahiliye", "tıbbi biyoloji", "sağlık bilimleri"],
    kind: "custom",
    icon: "⚕",
    metric: "Tamamlanan klinik konu özeti",
    defaultProofType: "Anonim çalışma notu ve vaka özeti (Eğitim amaçlı)",
    resources: [
      "PubMed Central (PMC) — https://www.ncbi.nlm.nih.gov/pmc/",
      "NCBI Bookshelf — https://www.ncbi.nlm.nih.gov/books/",
      "Dünya Sağlık Örgütü (WHO) — https://www.who.int/",
    ],
    starterTasks: [
      { title: "Fizyoloji/patoloji mekanizma haritası hazırla", goal: "Hastalık veya biyolojik mekanizmanın adımlarını tek şemada özetle.", minutes: 45, taskType: "deep_work" },
      { title: "Anonim klinik konu özeti çıkar", goal: "Klinik kılavuz veya literatür ışığında tanı/tedavi prensiplerini not et.", minutes: 55, taskType: "reading" },
    ],
    questions: [
      { id: "med-ebm", prompt: "Kanıta dayalı tıpta (EBM) en güçlü kanıt düzeyi genellikle hangisidir?", options: options("Sistematik derlemeler ve meta-analizler", "Uzman görüşü veya bireysel anlatılar", "Laboratuvar dedikodusu"), correct: "a", subTopic: "Kanıta Dayalı Tıp Piramidi", explanation: "Geniş randomize kontrollü çalışmaları derleyen meta-analizler en yüksek kanıt düzeyidir.", recommendedReview: "Kanıt düzeyi piramidini ve klinik çalışma tasarımlarını incele." },
      { id: "med-pharmacology", prompt: "Farmakokinetik ile farmakodinami arasındaki temel fark nedir?", options: options("Kinetik vücudun ilaca yaptığını, dinamik ise ilacın vücuda etkisini inceler", "İkisi tamamen aynı kavramdır", "Farmakodinamik yalnızca ilaç fiyatını belirler"), correct: "a", subTopic: "Temel Farmakoloji", explanation: "Farmakokinetik emilim, dağılım, metabolizma ve atılımı; dinamik ise reseptör etkisini açıklar.", recommendedReview: "ADME süreçleri ve reseptör agonizma/antagonizma prensiplerini çalış." },
      { id: "med-safety", prompt: "Tıbbi eğitim çalışmalarında hasta mahremiyeti ve verisi nasıl korunmalıdır?", options: options("Tüm kişisel kimlik bilgilerini tamamen anonimleştirerek", "Hastanın adını sosyal medyada paylaşarak", "Fotoğrafları izinsiz depolayarak"), correct: "a", subTopic: "Tıbbi Etik & Mahremiyet", explanation: "Tıp eğitiminde vaka incelemeleri mutlaka de-identifiye (anonim) edilmelidir.", recommendedReview: "Tıbbi etik ilkeleri ve hasta verisi koruma prensiplerini gözden geçir." },
    ],
  },
  {
    id: "quality-engineering",
    name: "Kalite Mühendisliği",
    aliases: ["kalite mühendisliği", "kalite mühendisi", "quality engineer", "quality engineering", "qa engineer", "six sigma", "altı sigma", "dmaic", "spc", "iso 9001", "yalın üretim", "lean"],
    kind: "custom",
    icon: "⚙",
    metric: "Çözülen kök neden analizi",
    defaultProofType: "FMEA tablosu veya SPC kontrol raporu",
    resources: [
      "ASQ (American Society for Quality) — https://asq.org/",
      "NIST Manufacturing Engineering — https://www.nist.gov/",
      "TSE (Türk Standardları Enstitüsü) — https://www.tse.org.tr/",
    ],
    starterTasks: [
      { title: "Süreç akışı ve hata noktalarını belirle", goal: "Süreci adımlara böl ve olası riskli geçişleri haritalandır.", minutes: 45, taskType: "deep_work" },
      { title: "Balık Kılçığı veya 5 Neden analizi yap", goal: "Belirli bir sapmanın kök nedenine in ve önleyici aksiyon belirle.", minutes: 50, taskType: "problem_solving" },
    ],
    questions: [
      { id: "qe-dmaic", prompt: "Altı Sigma'da DMAIC metodolojisinin açılımı ve sırası nedir?", options: options("Tanımla, Ölç, Analiz Et, İyileştir, Kontrol Et", "Dene, Model Kur, Analiz Et, İptal Et, Çöz", "Durdur, Merak Et, Anla, İlerle, Çık"), correct: "a", subTopic: "DMAIC Metodolojisi", explanation: "Define, Measure, Analyze, Improve, Control adımları sürekli iyileştirmenin omurgasıdır.", recommendedReview: "DMAIC aşamalarında kullanılan temel kalite araçlarını (Gantt, Pareto, FMEA) tekrar et." },
      { id: "qe-spc", prompt: "İstatistiksel Proses Kontrolde (SPC) kontrol sınırlarının amacı nedir?", options: options("Süreçteki doğal değişkenlik ile özel nedenli değişkenliği ayırt etmek", "Ürünün perakende satış fiyatını sabitlemek", "Çalışan sayısını belirlemek"), correct: "a", subTopic: "SPC (İstatistiksel Proses Kontrol)", explanation: "Kontrol sınırları sürecin istatistiksel kontrol altında olup olmadığını gösterir.", recommendedReview: "Kontrol kartı kuralları (Western Electric kuralları) ve Cp/Cpk indislerini çalış." },
      { id: "qe-pokayoke", prompt: "Yalın üretimde 'Poka-Yoke' yaklaşımı neyi hedefler?", options: options("Hata yapmayı fiziksel veya sistemsel olarak imkansız kılan mekanizmalar kurmayı", "Hata yapanı cezalandırmayı", "Üretimi tamamen durdurmayı"), correct: "a", subTopic: "Poka-Yoke (Hata Önleme)", explanation: "Poka-Yoke, hatanın daha oluşmadan engellenmesini sağlayan tasarımdır.", recommendedReview: "Hata önleme ve Kaizen ilkeleri üzerine vaka analizi yap." },
    ],
  },
  {
    id: "general-engineering",
    name: "Genel Mühendislik",
    aliases: ["genel mühendislik", "mühendislik", "engineering", "makine mühendisliği", "mekatronik", "malzeme mühendisliği", "teknik hesap", "cad", "solidworks", "mechanical engineer"],
    kind: "custom",
    icon: "📐",
    metric: "Tamamlanan teknik hesap ve rapor",
    defaultProofType: "Mühendislik hesap raporu veya CAD/çizim",
    resources: [
      "EngineeringToolBox — https://www.engineeringtoolbox.com/",
      "MIT OpenCourseWare Engineering — https://ocw.mit.edu/",
      "Khan Academy Physics — https://www.khanacademy.org/science/physics",
    ],
    starterTasks: [
      { title: "Tasarım kabul kriterleri ve kısıtları listele", goal: "Mekanik, termal veya malzeme gereksinimlerini tek belgede topla.", minutes: 45, taskType: "deep_work" },
      { title: "Kuvvet / gerilme hesabı tamamla", goal: "Bir parça veya eleman için serbest cisim diyagramı çizip hesap yap.", minutes: 60, taskType: "problem_solving" },
    ],
    questions: [
      { id: "eng-fos", prompt: "Mühendislik hesaplarında 'Güvenlik Katsayısı' (Factor of Safety) neyi ifade eder?", options: options("Yapının taşıyabileceği kapasitenin beklenen maksimum yüke oranını", "Tasarımcının çalıştığı gün sayısını", "Proje bütçesinin katsayısını"), correct: "a", subTopic: "Güvenlik Katsayısı (FoS)", explanation: "FoS > 1, yapının öngörülemeyen yükler ve malzeme kusurlarına karşı pay bırakmasıdır.", recommendedReview: "Gerilme-şekil değiştirme diyagramı ve akma/çekme dayanımı kavramlarını tekrar et." },
      { id: "eng-units", prompt: "Mühendislik formüllerinde birim homojenliği (boyut analizi) neden şarttır?", options: options("Eşitliğin her iki yanındaki fiziksel büyüklüklerin aynı boyutta olduğunu doğrulamak için", "Yalnızca sınavda puan kazanmak için", "Yazılım dilini değiştirmek için"), correct: "a", subTopic: "Boyut Analizi ve Birim Sistemleri", explanation: "Birim kontrolü kavramsal hataları erkenden yakalayan temel mühendislik filtresidir.", recommendedReview: "SI birim sistemi türetilmiş büyüklükler ve boyut analizi pratiği yap." },
      { id: "eng-deformation", prompt: "Elastik deformasyon ile plastik deformasyon arasındaki temel fark nedir?", options: options("Elastik şekil değiştirme yük kalkınca geri döner, plastik kalıcıdır", "Plastik hemen kırılır, elastik asla kırılmaz", "İkisi arasında hiçbir fark yoktur"), correct: "a", subTopic: "Malzeme Davranışı", explanation: "Hooke yasası elastik bölgede geçerlidir; plastik deformasyonda kalıcı şekil kalır.", recommendedReview: "Malzeme mekaniğinde orantı sınırı, akma noktası ve tokluk kavramlarını çalış." },
    ],
  },
  {
    id: "statistics",
    name: "İstatistik",
    aliases: ["istatistik", "statistics", "olasılık ve istatistik", "biyoistatistik", "istatistiksel analiz", "hipotez testi", "regresyon", "statist"],
    kind: "math",
    icon: "📈",
    metric: "Çözülen istatistiksel problem",
    defaultProofType: "R/Python hipotez testi veya veri analiz raporu",
    resources: [
      "OpenIntro Statistics — https://www.openintro.org/",
      "StatQuest with Josh Starmer — https://statquest.org/",
      "Khan Academy Statistics — https://www.khanacademy.org/math/statistics-probability",
    ],
    starterTasks: [
      { title: "Veri dağılımı ve merkezi eğilim analizi yap", goal: "Ortalama, medyan, standart sapma ve çarpıklığı hesapla.", minutes: 45, taskType: "problem_solving" },
      { title: "Hipotez testi çözümü ve yorumu yap", goal: "Sıfır hipotezi kur, p-değerini bul ve sonucu açıkla.", minutes: 50, taskType: "deep_work" },
    ],
    questions: [
      { id: "stat-pvalue", prompt: "Bir hipotez testinde p-değerinin (p-value) bilimsel tanımı nedir?", options: options("Sıfır hipotezi doğruyken en az gözlenen kadar aşırı sonuç elde etme olasılığı", "Sıfır hipotezinin doğru olma kesin olasılığı", "Alternatif hipotezin yanlış olma ihtimali"), correct: "a", subTopic: "Hipotez Testleri ve p-Değeri", explanation: "p-değeri verinin sıfır hipoteziyle ne denli uyumlu olduğunu ölçer.", recommendedReview: "Sıfır hipotezi (H0), alternatif hipotez (H1) ve anlamlılık düzeyi (alpha) ilişkisini incele." },
      { id: "stat-clt", prompt: "Merkezi Limit Teoremi'nin (CLT) temel sonucu nedir?", options: options("Örneklem boyutu büyüdükçe örneklem ortalamasının dağılımı normale yaklaşır", "Tüm popülasyonlar her zaman kesin normal dağılır", "Standart sapma her zaman sıfır olur"), correct: "a", subTopic: "Merkezi Limit Teoremi", explanation: "CLT, popülasyon çarpık olsa bile yeterli n ile ortalamanın normal dağılmasını açıklar.", recommendedReview: "Örneklem dağılımları ve standart hata (Standard Error) hesaplarını tekrar et." },
      { id: "stat-errors", prompt: "İstatistiksel karar vermede 'Tip I Hata' neyi anlatır?", options: options("Gerçekte doğru olan sıfır hipotezini yanlışlıkla reddetmeyi (yalancı pozitif)", "Yanlış olan sıfır hipotezini reddedememeyi", "Hesap makinesinde hata yapmayı"), correct: "a", subTopic: "Tip I ve Tip II Hatalar", explanation: "Tip I hata alpha olasılığı ile temsil edilen yalancı alarmdır.", recommendedReview: "Test gücü (Power, 1-beta), Tip I ve Tip II hata dengesini çalış." },
    ],
  },
  {
    id: "robotics",
    name: "Robotik Kodlama",
    aliases: ["robotik", "arduino", "raspberry pi", "embedded", "gömülü sistem", "mikrodenetleyici", "elektronik"],
    kind: "projects",
    icon: "⚙",
    metric: "Çalışan prototip",
    defaultProofType: "Çalışan donanım prototipi veya devre şeması",
    resources: ["Arduino Documentation — https://docs.arduino.cc/", "Raspberry Pi Documentation — https://www.raspberrypi.com/documentation/"],
    starterTasks: [
      { title: "Donanım ve bağlantı şemasını çıkar", goal: "Bileşenleri, güç gereksinimini ve bağlantıları tek şemada göster.", minutes: 45, taskType: "deep_work" },
      { title: "Sensör veya aktüatör prototipi çalıştır", goal: "Tek bir giriş/çıkış davranışını kodla ve test sonucunu kaydet.", minutes: 60, taskType: "practice" },
    ],
    questions: [
      { id: "microcontroller", prompt: "Mikrodenetleyicinin temel görevi nedir?", options: options("Girişleri okuyup programlanan çıktıları yönetmek", "Sadece internet sitesini barındırmak", "Dosya yazdırmak"), correct: "a", subTopic: "Gömülü Sistem Temelleri", explanation: "Mikrodenetleyici sensörleri okur ve motor/LED gibi bileşenleri kontrol eder.", recommendedReview: "Mikrodenetleyici I/O pinleri ve döngü yapısı üzerine çalış." },
      { id: "voltage", prompt: "Bir devrede ortak GND bağlantısının amacı nedir?", options: options("Ortak referans potansiyel seviyesi sağlamak", "İşlemci hızını artırmak", "Kodu şifrelemek"), correct: "a", subTopic: "Temel Devre Analizi", explanation: "GND, sinyallerin aynı voltaj referansına göre ölçülmesi için şarttır.", recommendedReview: "Temel elektrik kanunları (Ohm, Kirchhoff) ve topraklama mantığını incele." },
      { id: "loop", prompt: "Sensör verisini düzenli okumak için programda hangi yapı sık kullanılır?", options: options("Döngü", "Yalnızca yorum satırı", "Dosya adı"), correct: "a", subTopic: "Gömülü Programlama", explanation: "loop() fonksiyonu sensörleri periyodik olarak sorgulamayı sağlar.", recommendedReview: "Gecikme (delay) yerine zamanlayıcı (millis) kullanmayı öğren." },
    ],
  },
  {
    id: "chess",
    name: "Satranç",
    aliases: ["satranç", "satranc", "chess", "satranç taktikleri"],
    kind: "chess",
    icon: "♞",
    metric: "Çözülen taktik",
    defaultProofType: "Lichess/Chess.com oyun analizi veya PGN dökümü",
    resources: ["Lichess Studies — https://lichess.org/study", "Chess.com Lessons — https://www.chess.com/lessons"],
    starterTasks: [
      { title: "Günlük taktik seti çöz", goal: "20 taktik çöz; tekrar eden hata türlerini not et.", minutes: 30, taskType: "problem_solving" },
      { title: "Bir oyunu analiz et", goal: "Bir oyunda üç kritik anı ve daha iyi alternatifi kaydet.", minutes: 45, taskType: "review" },
    ],
    questions: [
      { id: "fork", prompt: "Satrançta çatal taktiği neyi anlatır?", options: options("Bir taşla iki veya daha fazla taşı tehdit etmeyi", "Oyunu beraberlikle bitirmeyi", "Piyon terfisini engellemeyi"), correct: "a", subTopic: "Temel Taktikler (Çatal)", explanation: "Çatal aynı anda birden fazla hedef oluşturarak savunmayı imkansız kılar.", recommendedReview: "At ve vezir çatalları üzerine 20 tematik bulmaca çöz." },
      { id: "castle", prompt: "Rok yapabilmek için ne gerekir?", options: options("Şahın ve ilgili kalenin daha önce hareket etmemiş olması", "Vezirin tahtada olmaması", "20 hamle yapılması"), correct: "a", subTopic: "Oyun Kuralları & Şah Güvenliği", explanation: "Şah veya kale hareket etmişse o kanada rok yapılamaz.", recommendedReview: "Rok kuralları ve şah tehdit altındayken rok engellerini tekrar et." },
      { id: "development", prompt: "Açılışta sağlıklı genel yaklaşım hangisidir?", options: options("Merkezi destekleyip hafif taşları geliştirmek", "Aynı taşı sürekli oynatmak", "Şahı erken merkeze taşımak"), correct: "a", subTopic: "Açılış Prensipleri", explanation: "Hafif taşları merkeze açıp rok ile şahı güvenceye almak temel ilkedir.", recommendedReview: "Klasik açılış ilkeleri üzerine dersleri incele." },
    ],
  },
  {
    id: "finance",
    name: "Finans ve Borsa",
    aliases: ["borsa", "yatırım", "finans", "hisse", "trading", "trader", "kripto", "portföy", "finansal analiz"],
    kind: "custom",
    icon: "↗",
    metric: "Analiz edilen şirket",
    defaultProofType: "Finansal tablo analizi veya risk raporu",
    resources: ["Borsa İstanbul Akademi — https://www.borsaistanbul.com/", "SPK Yatırımcı Bilgilendirme — https://spk.gov.tr/"],
    starterTasks: [
      { title: "Risk ve getiri notu hazırla", goal: "Risk, getiri, zaman ufku ve kayıp toleransını tek sayfada ayır.", minutes: 40, taskType: "reading" },
      { title: "Bir şirketin temel tablosunu incele", goal: "Gelir tablosu, bilanço ve nakit akışından üç gözlem yaz.", minutes: 50, taskType: "problem_solving" },
    ],
    questions: [
      { id: "diversification", prompt: "Portföy çeşitlendirmesinin temel amacı nedir?", options: options("Tek varlığa bağlı spesifik riski azaltmak", "Kesin kâr sağlamak", "İşlem sayısını sınırsız artırmak"), correct: "a", subTopic: "Portföy Teorisi & Risk Yönetimi", explanation: "Çeşitlendirme farklı varlıkların dalgalanmalarını dengeleyerek toplam riski düşürür.", recommendedReview: "Sistematik ve sistemsel olmayan risk kavramlarını çalış." },
      { id: "balance", prompt: "Bilanço temel olarak neyi gösterir?", options: options("Varlıklar, borçlar ve özkaynakları", "Yalnızca günlük hisse fiyatını", "Sadece çalışan listesini"), correct: "a", subTopic: "Mali Tablo Analizi", explanation: "Bilanço belirli bir tarihte şirketin varlıklarını ve bunların kaynaklarını gösterir.", recommendedReview: "Temel bilanço denkliği (Varlıklar = Kaynaklar) ve rasyoları tekrar et." },
      { id: "risk", prompt: "Geçmiş getirinin gelecekteki getiri için anlamı nedir?", options: options("Garanti değildir; piyasa koşulları değişebilir", "Kesin tahmindir", "Riski tamamen ortadan kaldırır"), correct: "a", subTopic: "Piyasa Psikolojisi & Risk", explanation: "Geçmiş performans geleceğin teminatı olamaz; her yatırım risk içerir.", recommendedReview: "Finansal okuryazarlık ve risk toleransı ilkelerini gözden geçir." },
    ],
  },
  {
    id: "civil-engineering",
    name: "İnşaat Mühendisliği",
    aliases: ["inşaat mühendisliği", "inşaat", "betonarme", "şantiye", "statik", "zemin mekaniği", "metraj"],
    kind: "custom",
    icon: "▰",
    metric: "Tamamlanan teknik çalışma",
    defaultProofType: "Metraj, statik hesap veya çizim çıktısı",
    resources: ["Türkiye Bina Deprem Yönetmeliği — https://www.afad.gov.tr/", "MIT OpenCourseWare Civil Engineering — https://ocw.mit.edu/"],
    starterTasks: [
      { title: "Konu ve yönetmelik haritası çıkar", goal: "Çalışacağın ders/uygulama için kavramları, yönetmeliği ve çıktıyı belirle.", minutes: 45, taskType: "deep_work" },
      { title: "Örnek hesap veya çizim çöz", goal: "Bir örneği adımları ve birim kontrolleriyle tamamla.", minutes: 60, taskType: "problem_solving" },
    ],
    questions: [
      { id: "load", prompt: "Yapısal yük analizinde sabit yük neyi ifade eder?", options: options("Yapının kendi ağırlığı ve kalıcı elemanları", "Yalnızca rüzgâr etkisini", "Sadece insan hareketini"), correct: "a", subTopic: "Yapısal Yük Analizi", explanation: "Sabit yükler (öz ağırlık, döşeme, duvar) yapının ömrü boyunca değişmeyen ağırlıklardır.", recommendedReview: "TS 498 ve TBDY yük kombinasyonlarını incele." },
      { id: "concrete", prompt: "Betonarmede çelik donatının temel işlevlerinden biri nedir?", options: options("Betonun zayıf olduğu çekme gerilmelerini karşılamak", "Betonu parlatmak", "Su ihtiyacını artırmak"), correct: "a", subTopic: "Betonarme Davranışı", explanation: "Beton basınçta çok güçlü, çekmede ise zayıftır; donatı çekmeyi devralır.", recommendedReview: "Betonarme eğilme hesabı ve çatlak kontrolü adımlarını tekrar et." },
      { id: "safety", prompt: "Şantiyede risk değerlendirmesinin amacı nedir?", options: options("Tehlikeleri önceden belirleyip kazaları önlemek", "İş akışını rastgele değiştirmek", "Yalnızca rapor yazmak"), correct: "a", subTopic: "Şantiye Güvenliği (İSG)", explanation: "İş sağlığı ve güvenliği analizleri ramak kala durumları ve riskleri minimize eder.", recommendedReview: "Şantiye güvenlik yönetmelikleri ve koruyucu donanım standartlarını oku." },
    ],
  },
  {
    id: "economics",
    name: "İktisat",
    aliases: ["iktisat", "ekonomi", "mikro iktisat", "makro iktisat"],
    kind: "math",
    icon: "¤",
    metric: "Çözülen ekonomi problemi",
    defaultProofType: "Ekonomik model grafiği veya vaka analizi",
    resources: ["CORE Econ — https://www.core-econ.org/", "MIT OpenCourseWare Economics — https://ocw.mit.edu/"],
    starterTasks: [
      { title: "Temel kavram haritası hazırla", goal: "Arz, talep, teşvik ve fırsat maliyetini kendi örneklerinle açıkla.", minutes: 45, taskType: "reading" },
      { title: "Grafikli problem çöz", goal: "Bir arz-talep veya maliyet problemi çöz ve grafiğini çiz.", minutes: 50, taskType: "problem_solving" },
    ],
    questions: [
      { id: "opportunity", prompt: "Fırsat maliyeti neyi ifade eder?", options: options("Vazgeçilen en iyi alternatifin değerini", "Sadece ödenen nakit parayı", "Vergi oranını"), correct: "a", subTopic: "Fırsat Maliyeti", explanation: "Fırsat maliyeti bir kararı alırken feragat edilen en değerli diğer seçenektir.", recommendedReview: "Üretim olanakları eğrisi ve kaynak tahsisi konularını tekrar et." },
      { id: "demand", prompt: "Diğer koşullar sabitken (ceteris paribus) fiyat artarsa talep miktarı genellikle ne olur?", options: options("Azalır", "Artar", "Kesin değişmez"), correct: "a", subTopic: "Talep Kanunu", explanation: "Fiyat ile talep miktarı arasında ters yönlü ilişki bulunur.", recommendedReview: "Talep eğrisi kaymaları ile miktar değişimleri arasındaki farkı incele." },
      { id: "inflation", prompt: "Enflasyonun temel ekonomik etkisi nedir?", options: options("Paranın satın alma gücünü zamanla aşındırması", "Tüm ürünleri bedava yapması", "Faizleri sıfırlaması"), correct: "a", subTopic: "Makroekonomi & Enflasyon", explanation: "Fiyatlar genel düzeyinin sürekli artışı satın alma gücünü düşürür.", recommendedReview: "TÜFE, ÜFE ve para arzı enflasyon ilişkisini çalış." },
    ],
  },
  {
    id: "language",
    name: "Yabancı Dil",
    aliases: ["ingilizce", "yabancı dil", "english", "almanca", "fransızca", "dil öğrenme", "spanish"],
    kind: "reading",
    icon: "A",
    metric: "Aktif kelime ve üretim",
    defaultProofType: "Kısa deneme metni veya sesli kayıt transkripti",
    resources: ["British Council LearnEnglish — https://learnenglish.britishcouncil.org/", "Cambridge Dictionary — https://dictionary.cambridge.org/"],
    starterTasks: [
      { title: "Aktif kelime seti oluştur", goal: "Hedef alanından 20 kelimeyi örnek cümleyle kaydet.", minutes: 30, taskType: "practice" },
      { title: "Kısa üretim yap", goal: "Seviyene uygun kısa bir metin yaz veya sesli anlatım kaydet.", minutes: 35, taskType: "creative" },
    ],
    questions: [
      { id: "context", prompt: "Yeni kelime öğrenirken en kalıcı yaklaşım hangisidir?", options: options("Kelimeyi bağlam ve örnek cümle içinde kullanmak", "Yalnızca sözlükten tek kelime ezberlemek", "Listeyi tek sefer okumak"), correct: "a", subTopic: "Bağlamsal Kelime Edinimi", explanation: "Kelimeyi cümle içinde kullanmak anlamsal hafızayı güçlendirir.", recommendedReview: "Flashcard uygulaması ile örnek cümleli tekrar ritmi kur." },
      { id: "feedback", prompt: "Konuşma becerisini geliştirmek için ne gerekir?", options: options("Düzenli aktif üretim ve geri bildirim", "Sadece pasif dinleme", "Yalnızca gramer kuralı ezberleme"), correct: "a", subTopic: "Aktif Dil Üretimi", explanation: "Konuşma kas hafızası ve anında kelime geri çağırma pratiği gerektirir.", recommendedReview: "Günde 5 dakika sesli kayıt alıp telaffuz analizi yap." },
      { id: "spaced", prompt: "Aralıklı tekrarın (spaced repetition) amacı nedir?", options: options("Unutma eğrisine karşı hatırlamayı optimize etmek", "Her şeyi tek günde bitirmek", "Notları silmek"), correct: "a", subTopic: "Aralıklı Tekrar Yöntemi", explanation: "Zamanla açılan aralıklarla tekrar bilgiyi kalıcı hafızaya taşır.", recommendedReview: "Ebbinghaus unutma eğrisi ve aralıklı tekrar ilkelerini oku." },
    ],
  },
];

export function findDomain(value: string): DomainDefinition | undefined {
  const normalized = value.toLocaleLowerCase("tr-TR").trim();
  if (!normalized) return undefined;
  const exact = domainCatalog.find((domain) =>
    [domain.id, domain.name, ...domain.aliases].some((alias) => alias.toLocaleLowerCase("tr-TR").trim() === normalized)
  );
  if (exact) return exact;

  let bestMatch: { domain: DomainDefinition; matchLength: number } | undefined;
  for (const domain of domainCatalog) {
    for (const alias of [domain.name, ...domain.aliases]) {
      const a = alias.toLocaleLowerCase("tr-TR").trim();
      if (a.length >= 3 && (normalized.includes(a) || a.includes(normalized))) {
        const matchLen = Math.min(a.length, normalized.length);
        if (!bestMatch || matchLen > bestMatch.matchLength) {
          bestMatch = { domain, matchLength: matchLen };
        }
      }
    }
  }
  return bestMatch?.domain;
}

export interface AdaptiveQuestionFeedback {
  questionId: string;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  subTopic: string;
  explanation: string;
  recommendedReview: string;
}

export function evaluateAdaptiveAssessment(
  answers: Record<string, string>,
  questions: DomainQuestion[]
): {
  score: number;
  total: number;
  isStartingSignal: true;
  subTopicDeficiencies: string[];
  feedbacks: AdaptiveQuestionFeedback[];
  reviewTasks: { title: string; goal: string; minutes: number }[];
} {
  const feedbacks: AdaptiveQuestionFeedback[] = [];
  const deficiencies: string[] = [];

  for (const q of questions) {
    const user = answers[q.id] ?? "";
    const isCorrect = user === q.correct;
    const subTopic = q.subTopic ?? "Temel Kavramlar";
    const explanation = q.explanation ?? "Doğru yanıt temel ilkelere dayanır.";
    const recommendedReview = q.recommendedReview ?? `${subTopic} konusunu tekrar et.`;

    feedbacks.push({
      questionId: q.id,
      prompt: q.prompt,
      userAnswer: user,
      correctAnswer: q.correct,
      isCorrect,
      subTopic,
      explanation,
      recommendedReview,
    });

    if (!isCorrect && !deficiencies.includes(subTopic)) {
      deficiencies.push(subTopic);
    }
  }

  const score = feedbacks.filter((f) => f.isCorrect).length;
  const reviewTasks = deficiencies.map((topic) => ({
    title: `${topic} konu tekrarı`,
    goal: `${topic} ile ilgili eksik noktaları gözden geçir ve 1 pratik soru çöz.`,
    minutes: 35,
  }));

  return {
    score,
    total: questions.length,
    isStartingSignal: true,
    subTopicDeficiencies: deficiencies,
    feedbacks,
    reviewTasks,
  };
}

export interface UnknownDomainInput {
  areaName: string;
  goal: string;
  subDomain?: string;
  desiredOutput?: string;
  targetWeeks?: number;
  availableResources?: string;
}

export function adaptUnknownDomain(input: UnknownDomainInput): DomainDefinition {
  const sub = input.subDomain?.trim() || "Genel Uygulama";
  const output = input.desiredOutput?.trim() || "Tamamlanan teknik çalışma";
  const resourceList = input.availableResources
    ? input.availableResources.split("\n").map((s) => s.trim()).filter(Boolean)
    : ["Resmî dokümantasyon ve kılavuzlar", "Güvenilir açık kaynaklar"];

  return {
    id: `custom-${input.areaName.toLocaleLowerCase("tr-TR").replace(/\s+/g, "-")}`,
    name: input.areaName.trim(),
    aliases: [input.areaName.trim().toLocaleLowerCase("tr-TR")],
    kind: "custom",
    icon: "◎",
    metric: output,
    defaultProofType: `${sub} çalışma raporu veya kanıtı`,
    resources: resourceList,
    starterTasks: [
      {
        title: `${input.areaName} için ön koşul ve hedef haritası çıkar`,
        goal: `${sub} kapsamında ulaşılacak hedefi ve gerekli adımları netleştir.`,
        minutes: 45,
        taskType: "deep_work",
      },
      {
        title: `İlk somut çıktıyı üret: ${output}`,
        goal: `${input.goal || input.areaName} doğrultusunda ilk ölçülebilir parçayı tamamla.`,
        minutes: 55,
        taskType: "practice",
      },
    ],
    questions: [
      {
        id: "custom-concept",
        prompt: `${input.areaName} alanında ${sub} konusuna başlarken ilk güvenilir adım nedir?`,
        options: options("Kavramın tanımı, uygulama bağlamı ve temel kaynaklarını netleştirmek", "Rastgele adımlar denemek", "Ölçüm yapmadan başlamak"),
        correct: "a",
        subTopic: "Hedef Netliği",
        explanation: "Net bir kavramsal temel ve güvenilir kaynak seçimi çalışma verimini artırır.",
        recommendedReview: "Çalışma hedefini ve birincil kaynaklarını tek sayfada listele.",
      },
      {
        id: "custom-evidence",
        prompt: `${input.areaName} çalışmasında ilerlemeni en sağlam biçimde ne kanıtlar?`,
        options: options(`${output} niteliğinde tekrarlanabilir ve doğrulanabilir somut bir çıktı`, "Sadece çalıştığını söylemek", "Başkasının notunu kopyalamak"),
        correct: "a",
        subTopic: "Kanıt Temelli Çıktı",
        explanation: "North sisteminde gerçek gelişim doğrulanabilir kanıtlarla ölçülür.",
        recommendedReview: "Tamamladığın ilk çalışmanın adımlarını ve sonucunu kanıt olarak kaydet.",
      },
      {
        id: "custom-review",
        prompt: `Zorlandığın bir konuda tıkanıklığı aşmak için en etkili yol hangisidir?`,
        options: options("Görevi daha küçük alt adımlara bölüp eksik bilgiyi araştırmak", "Görevi tamamen terk etmek", "Sürekli aynı noktayı zorlamak"),
        correct: "a",
        subTopic: "Problem Çözme Yaklaşımı",
        explanation: "Küçük alt adımlara bölmek (chunking) bilişsel yükü azaltır.",
        recommendedReview: "Büyük görevleri 25-35 dakikalık odak parçalarına bölmeyi dene.",
      },
    ],
  };
}

export function genericDomainQuestions(area: string): DomainQuestion[] {
  return [
    {
      id: "concept",
      prompt: `${area} alanında temel bir kavramı doğru kullanmak için önce neyi netleştirirsin?`,
      options: options("Kavramın tanımı, bağlamı ve örneğini", "Yalnızca bir sonuç ezberlemeyi", "Rastgele araç seçmeyi"),
      correct: "a",
      subTopic: "Kavramsal Temel",
      explanation: "Kavramın tanımı ve bağlamı anlaşılmadan uygulama sağlam kurulamaz.",
      recommendedReview: `${area} temel kavram haritasını incele.`,
    },
    {
      id: "practice",
      prompt: `${area} alanında gelişimini en güvenilir biçimde ne gösterir?`,
      options: options("Tekrarlanabilir bir uygulama veya somut çıktı", "Sadece ilgilendiğini söylemek", "Başkasının sonucunu kopyalamak"),
      correct: "a",
      subTopic: "Uygulama ve Kanıt",
      explanation: "Gelişim somut ve tekrarlanabilir çıktılarla doğrulanır.",
      recommendedReview: `Küçük bir pratik yapıp kanıtını kaydet.`,
    },
    {
      id: "verification",
      prompt: `${area} çalışmasında bir sonucun güvenilirliğini nasıl güçlendirirsin?`,
      options: options("Kaynağı ve kontrol adımlarını kaydetmek", "Sonucu kontrol etmeden paylaşmak", "Ölçümü atlamak"),
      correct: "a",
      subTopic: "Doğrulama ve Kontrol",
      explanation: "Kontrol adımları ve kaynak doğrulaması teknik güvenilirliğin şartıdır.",
      recommendedReview: "Çalışmanın doğrulama basamaklarını yaz.",
    },
  ];
}
