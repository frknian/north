import { supportedLanguages } from "./language-learning";

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
  questionPool?: {
    beginner: DomainQuestion[];
    intermediate: DomainQuestion[];
    advanced: DomainQuestion[];
  };
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
    questionPool: {
      beginner: [
        { id: "function", prompt: "f(x)=2x+3 için f(4) kaçtır?", options: options("11", "8", "14"), correct: "a", subTopic: "Fonksiyonlar", explanation: "f(4) için x yerine 4 yazılır: 2(4)+3 = 8+3 = 11.", recommendedReview: "Fonksiyonlarda değer bulma ve grafik okuma tekrarı yap." },
        { id: "equation", prompt: "3x−6=12 denkleminin çözümü nedir?", options: options("x=6", "x=4", "x=2"), correct: "a", subTopic: "Birinci Dereceden Denklemler", explanation: "3x = 18 => x = 6.", recommendedReview: "Temel cebir ve denklem çözme adımlarını gözden geçir." },
        { id: "derivative", prompt: "Türevin temel kullanım alanlarından biri nedir?", options: options("Değişim hızını ve eğimi incelemek", "Sadece sayıları ezberlemek", "Metin düzenlemek"), correct: "a", subTopic: "Türev Kavramı", explanation: "Türev bir fonksiyonun anlık değişim hızını ve teğetinin eğimini verir.", recommendedReview: "Türevin geometrik ve fiziksel yorumu üzerine çalış." },
        { id: "math-pct", prompt: "Bir sayının %25'i 20 ise bu sayının tamamı kaçtır?", options: options("80", "100", "60"), correct: "a", subTopic: "Oran ve Yüzde Problemleri", explanation: "x * 0.25 = 20 => x = 80.", recommendedReview: "Yüzde ve oran hesaplamalarını tekrar et." }
      ],
      intermediate: [
        { id: "math-chain-rule", prompt: "f(x) = (3x + 1)² fonksiyonunun türevi f'(x) nedir?", options: options("6(3x + 1)", "3(3x + 1)", "2(3x + 1)"), correct: "a", subTopic: "Zincir Kuralı", explanation: "Zincir kuralı: 2*(3x+1)*3 = 6(3x+1).", recommendedReview: "Bileşke fonksiyon türevi çalış." },
        { id: "math-det", prompt: "2x2 boyutundaki bir A matrisinin tersinin (A⁻¹) var olması için hangi koşul gereklidir?", options: options("det(A) ≠ 0 olmalıdır", "det(A) = 0 olmalıdır", "Tüm elemanlar pozitif olmalıdır"), correct: "a", subTopic: "Lineer Cebir & Matris Tersi", explanation: "Determinant sıfırdan farklı olduğunda matris tekil değildir ve tersi vardır.", recommendedReview: "Determinant ve matris tersi hesaplarını tekrar et." },
        { id: "math-integral", prompt: "∫ 2x dx belirsiz integralinin sonucu nedir?", options: options("x² + C", "2x² + C", "x + C"), correct: "a", subTopic: "Temel İntegral", explanation: "∫ 2x dx = 2 * (x²/2) + C = x² + C.", recommendedReview: "Temel integral alma kurallarını gözden geçir." },
        { id: "math-limit", prompt: "lim (x→0) sin(x)/x limitinin değeri nedir?", options: options("1", "0", "Tanımsız"), correct: "a", subTopic: "Limit & Süreklilik", explanation: "Bu temel trigonometrik limit analizin köşe taşlarındandır ve değeri 1'dir.", recommendedReview: "Trigonometrik limitler ve L'Hopital kuralını çalış." }
      ],
      advanced: [
        { id: "math-grad", prompt: "Çok değişkenli f(x, y) fonksiyonunun gradyan vektörü ∇f neyi gösterir?", options: options("Fonksiyonun en hızlı arttığı yönü ve bu artışın büyüklüğünü", "Yalnızca fonksiyonun sıfır olduğu noktaları", "Grafiğin hacmini"), correct: "a", subTopic: "Çok Değişkenli Analiz (Gradyan)", explanation: "Gradyan vektörü en dik tırmanış yönünü verir.", recommendedReview: "Kısmi türevler ve yönlü türev kavramını pekiştir." },
        { id: "math-eigen", prompt: "Av = λv eşitliğinde λ ve v neyi temsil eder?", options: options("λ özdeğer (eigenvalue), v ise özvektör (eigenvector)", "λ matris boyutu, v determinant", "λ türev, v integral"), correct: "a", subTopic: "Özdeğerler ve Özvektörler", explanation: "Lineer dönüşüm altında yönü değişmeyip sadece ölçeklenen vektör özvektördür.", recommendedReview: "Karakteristik polinom ve köşegenleştirme çalış." },
        { id: "math-pde", prompt: "Isı iletim denklemi (Heat Equation) matematiksel olarak hangi tür diferansiyel denklemdir?", options: options("Parabolik kısmi diferansiyel denklem", "Hiperbolik diferansiyel denklem", "Eliptik integral"), correct: "a", subTopic: "Kısmi Diferansiyel Denklemler", explanation: "Isı denklemi zamana bağlı yayılım gösteren klasik parabolik PDE örneğidir.", recommendedReview: "Dalga, ısı ve Laplace denklemlerinin sınıflandırılmasını incele." },
        { id: "math-taylor", prompt: "Bir fonksiyonun x=a civarındaki Taylor serisine açılabilmesi için temel ön koşul nedir?", options: options("O noktada sonsuz kez türevlenebilir olması", "Sadece polinom olması", "x=0 noktasından geçmesi"), correct: "a", subTopic: "Taylor Serileri ve Yakınsaklık", explanation: "Taylor açılımı için fonksiyonun o komşulukta C^∞ sınıfında olması gerekir.", recommendedReview: "Taylor serisi ve yakınsaklık yarıçapı analizlerini incele." }
      ]
    }
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
    questionPool: {
      beginner: [
        { id: "http", prompt: "HTTP 404 yanıtı neyi ifade eder?", options: options("Kaynak sunucuda bulunamadı", "İstek başarıyla tamamlandı", "Kullanıcı doğrulandı"), correct: "a", subTopic: "HTTP Durum Kodları", explanation: "404 Not Found, istenen kaynağın sunucuda var olmadığını belirtir.", recommendedReview: "HTTP durum kodları (2xx, 3xx, 4xx, 5xx) tablosunu incele." },
        { id: "git", prompt: "Git'te değişiklikleri yeni kayda almak için hangi komut kullanılır?", options: options("git commit", "git clone", "git pull"), correct: "a", subTopic: "Sürüm Kontrolü (Git)", explanation: "git commit hazırlanan (staged) değişiklikleri yerel repoya yeni bir sürüm olarak kaydeder.", recommendedReview: "Git temel iş akışı (add, commit, push, branch) pratiği yap." },
        { id: "debug", prompt: "Bir hatayı ayıklarken güvenilir ilk adım hangisidir?", options: options("Hata mesajı ve tekrar üretim adımlarını incelemek", "Tüm kodu silmek", "Rastgele paket kurmak"), correct: "a", subTopic: "Hata Ayıklama (Debugging)", explanation: "Hatanın nerede ve hangi girdilerle ortaya çıktığını izlemek en güvenilir yaklaşımdır.", recommendedReview: "Konsol logları, breakpoint kullanımı ve stack trace okuma tekniklerini tekrar et." },
        { id: "soft-types", prompt: "Programlamada değişken türleri (data types) ne için kullanılır?", options: options("Verinin bellekte kaplayacağı alanı ve üzerinde yapılabilecek işlemleri tanımlamak", "Bilgisayarın ekran parlaklığını ayarlamak", "Yalnızca ekrana yazı basmak"), correct: "a", subTopic: "Veri Tipleri & Bellek", explanation: "Veri tipleri derleyici ve çalışma zamanına belleğin nasıl yorumlanacağını bildirir.", recommendedReview: "Temel veri tipleri ve tip güvenliği (type safety) ilkelerini çalış." }
      ],
      intermediate: [
        { id: "soft-rest-idempotent", prompt: "RESTful mimaride hangi HTTP metotları doğası gereği idempotent (aynı çağrıda sonucu değiştirmeyen) olmalıdır?", options: options("GET, PUT, DELETE", "Yalnızca POST", "Hiçbiri"), correct: "a", subTopic: "REST Mimarisi & Idempotency", explanation: "GET, PUT ve DELETE birden çok kez çalıştırıldığında aynı etkiyi bırakır; POST ise her defasında yeni kaynak üretir.", recommendedReview: "HTTP semantikleri ve REST standartlarını incele." },
        { id: "soft-db-index", prompt: "İlişkisel veritabanında B-Tree indekslemenin temel avantajı ve ödünleşimi (trade-off) nedir?", options: options("Arama sorgularını hızlandırır; yazma (INSERT/UPDATE) maliyetini artırır", "Yazmayı hızlandırır, okumayı yavaşlatır", "Veritabanı boyutunu küçültür"), correct: "a", subTopic: "Veritabanı İndeksleme", explanation: "İndeksler aramayı logaritmik zamana indirirken ek yazma yükü ve disk alanı harcar.", recommendedReview: "İndeksleme stratejileri ve EXPLAIN sorgu planlarını çalış." },
        { id: "soft-async", prompt: "JavaScript / Node.js gibi ortamlarda Event Loop mekanizmasının görevi nedir?", options: options("G/Ç (I/O) işlemlerini bloke etmeden asenkron geri çağrıları (callbacks) koordine etmek", "İşlemci çekirdeklerini çoğaltmak", "Belleği tamamen temizlemek"), correct: "a", subTopic: "Asenkron Programlama & Event Loop", explanation: "Event Loop, I/O işlemlerini işletim sistemine delege ederek ana iş parçacığının tıkanmasını önler.", recommendedReview: "Microtask ve macrotask kuyruklarının çalışma sırasını incele." },
        { id: "soft-dry", prompt: "Yazılım geliştirmede DRY (Don't Repeat Yourself) prensibinin temel amacı nedir?", options: options("Kod tekrarını önleyip mantığı tek ve güvenilir bir merkezde toplamak", "Kod satır sayısını yapay olarak artırmak", "Yalnızca tek bir dosyada kod yazmak"), correct: "a", subTopic: "Temiz Kod & DRY Prensibi", explanation: "DRY, değişiklik maliyetini düşürür ve bir düzeltmenin tek noktadan yayılmasını sağlar.", recommendedReview: "Modüler tasarım ve yeniden kullanılabilir fonksiyon mimarilerini çalış." }
      ],
      advanced: [
        { id: "soft-cap", prompt: "Dağıtık sistemlerde CAP teoremine göre bir ağ bölünmesi (Network Partition) anında hangi seçim yapılmalıdır?", options: options("Tutarlılık (Consistency) ile Erişilebilirlik (Availability) arasında ödünleşim yapılmalıdır", "Her ikisi de %100 aynı anda korunabilir", "Veritabanı kapatılmalıdır"), correct: "a", subTopic: "Dağıtık Sistemler (CAP Teoremi)", explanation: "Ağ kopmasında sistem ya bekleyip tutarlı kalır (CP) ya da eski veriyle yanıt verip erişilebilir kalır (AP).", recommendedReview: "CAP teoremi, PACELC ve eventual consistency modellerini çalış." },
        { id: "soft-saga", prompt: "Mikroservis mimarisinde birden çok servis arasındaki dağıtık işlemleri (distributed transactions) yönetmek için hangi desen tercih edilir?", options: options("Saga Deseni (Orchestration veya Choreography)", "Tek bir global veritabanı kilidi", "Singleton Deseni"), correct: "a", subTopic: "Mikroservis Mimarisi (Saga Pattern)", explanation: "Saga deseni, iki aşamalı kilitleme yerine telafi edici (compensating) işlemler zinciri kurar.", recommendedReview: "Saga mimarisi ve iki fazlı taahhüt (2PC) farklarını incele." },
        { id: "soft-concurrency", prompt: "Yüksek eşzamanlı bir sistemde 'Race Condition' zafiyetini önlemek için en uygun yaklaşım nedir?", options: options("Atomik işlemler, Mutex kilitleri veya İyimser Kilitleme (Optimistic Locking)", "İşlemleri rastgele geciktirmek", "Önbelleği kapatmak"), correct: "a", subTopic: "Eşzamanlılık (Concurrency) & Kilitler", explanation: "Paylaşılan kaynağa erişimde atomik primitifler yarış durumunu engeller.", recommendedReview: "Optimistic vs Pessimistic locking ve CAS (Compare-And-Swap) mantığını çalış." },
        { id: "soft-gc", prompt: "Modern dillerde Garbage Collector (Çöp Toplayıcı) çalışırken 'Stop-The-World' duraklaması ne anlama gelir?", options: options("Bellek işaretleme/temizleme için uygulama iş parçacıklarının geçici olarak durdurulması", "Sunucunun elektriğinin kesilmesi", "Hata loglarının silinmesi"), correct: "a", subTopic: "Bellek Yönetimi & GC", explanation: "Nesne referanslarının değişmemesi için GC bazı aşamalarda thread'leri kısa süreliğine duraklatır.", recommendedReview: "Generational garbage collection ve bellek sızıntısı profillemeyi incele." }
      ]
    }
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
    ],
    questionPool: {
      beginner: [
        { id: "net", prompt: "TCP üçlü el sıkışmanın (three-way handshake) doğru sırası nedir?", options: options("SYN, SYN-ACK, ACK", "ACK, SYN, FIN", "SYN, FIN, ACK"), correct: "a", subTopic: "Ağ Protokolleri (TCP/IP)", explanation: "TCP bağlantısı SYN ile başlar, sunucu SYN-ACK döner, istemci ACK göndererek bağlantıyı kurar.", recommendedReview: "TCP bayrakları ve el sıkışma mekanizmasını Wireshark ile incele." },
        { id: "auth", prompt: "Brute-force (kaba kuvvet) saldırılarını engellemek için en temel savunma nedir?", options: options("Hesap kilitleme, rate limiting ve CAPTCHA", "Şifreleri düz metin saklamak", "Tüm portları açık bırakmak"), correct: "a", subTopic: "Kimlik Doğrulama Güvenliği", explanation: "Belirli deneme sonrasında gecikme veya hesap kilitleme kaba kuvvet saldırılarını durdurur.", recommendedReview: "Rate limiting ve çok faktörlü kimlik doğrulama (MFA) ilkelerini çalış." },
        { id: "sanitize", prompt: "SQL Injection zafiyetini önlemenin en kesin ve güvenilir yolu hangisidir?", options: options("Parametreli sorgular (Prepared Statements) kullanmak", "Girdiyi yalnızca JavaScript ile kontrol etmek", "Hata mesajlarını kullanıcıya göstermek"), correct: "a", subTopic: "Web Zafiyetleri (SQLi)", explanation: "Prepared statements veriyi kod olarak yorumlanmaktan ayırarak sorguyu korur.", recommendedReview: "OWASP SQL Injection önleme kılavuzunu incele." },
        { id: "cyber-phish", prompt: "Sosyal mühendislik ve oltalama (phishing) saldırılarında en sık kullanılan aldatma unsuru nedir?", options: options("Aciliyet, korku veya sahte otorite hissi yaratarak kullanıcıyı düşünmeden tıkladırmak", "Aşırı yavaş internet bağlantısı", "Resmi sertifika sunmak"), correct: "a", subTopic: "Sosyal Mühendislik & Oltalama", explanation: "Saldırganlar mantık yerine duygusal aciliyet tetikleyerek güvenlik adımlarını atlatmayı hedefler.", recommendedReview: "Sosyal mühendislik farkındalığı ve e-posta başlık (header) analizini incele." }
      ],
      intermediate: [
        { id: "cyber-csrf", prompt: "Cross-Site Request Forgery (CSRF) saldırılarına karşı en etkili modern tarayıcı savunması nedir?", options: options("SameSite çerez özelliği (Lax/Strict) ve Anti-CSRF tokenları", "Yalnızca HTTPS kullanmak", "Kullanıcı şifresini uzatmak"), correct: "a", subTopic: "Web Güvenliği (CSRF)", explanation: "SameSite çerezin üçüncü parti sitelerden gönderilmesini engeller; token ise isteğin orijinal siteden geldiğini doğrular.", recommendedReview: "OWASP CSRF Önleme Hile Sayfasını incele." },
        { id: "cyber-privesc", prompt: "Linux sistemlerde yetki yükseltme (privilege escalation) ararken 'SUID' biti neden ilk incelenir?", options: options("Dosyanın dosya sahibinin (genellikle root) yetkileriyle çalıştırılmasına izin verdiği için", "Dosyayı gizlediği için", "Ağ trafiğini şifrelediği için"), correct: "a", subTopic: "Linux Yetki Yükseltme", explanation: "Hatalı yapılandırılmış veya zafiyetli SUID binary'leri düşük yetkili kullanıcıyı root yapabilir.", recommendedReview: "GTFOBins ve Linux dosya izinleri analizi yap." },
        { id: "cyber-jwt", prompt: "JSON Web Token (JWT) tabanlı kimlik doğrulamada 'none' algoritması kabulü neye yol açar?", options: options("İmza doğrulaması atlanarak sahte admin tokenı üretilmesine", "Sunucunun çökmesine", "Token süresinin dolmasına"), correct: "a", subTopic: "Kimlik Doğrulama & JWT", explanation: "Algoritma 'none' kabul edilirse imzasız payload doğrulanmış sayılarak yetkisiz erişim sağlanır.", recommendedReview: "JWT imzalama standartları ve alg karışıklığı saldırılarını çalış." },
        { id: "cyber-nmap", prompt: "Nmap ile 'SYN Scan' (-sS) yapmanın temel avantajı nedir?", options: options("TCP el sıkışmasını tamamlamadan (yarı açık) port durumunu tespit edip daha az log bırakması", "Hedef sunucuyu hızlandırması", "Parolaları otomatik bulması"), correct: "a", subTopic: "Ağ Keşfi (Port Taraması)", explanation: "SYN Scan tam TCP bağlantısı kurmadığı için birçok geleneksel uygulama loguna düşmez.", recommendedReview: "Nmap tarama bayrakları ve IDS/IPS atlatma yöntemlerini çalış." }
      ],
      advanced: [
        { id: "cyber-ad-kerberos", prompt: "Active Directory ortamında DCSync saldırısının amacı ve hedeflediği mekanizma nedir?", options: options("MS-DRSR protokolünü taklit ederek Etki Alanı Denetleyicisinden (DC) şifre hash'lerini çekmek", "Kullanıcı bilgisayarını yeniden başlatmak", "DNS kayıtlarını silmek"), correct: "a", subTopic: "Active Directory & DCSync", explanation: "DCSync, çoğaltma protokolü yetkisini kullanarak NTDS veritabanındaki tüm hash'leri uzaktan çeker.", recommendedReview: "Kerberos biletleme (TGT/TGS), Golden Ticket ve DCSync analizlerini çalış." },
        { id: "cyber-ssrf-cloud", prompt: "Bulut ortamında (AWS/GCP/Azure) SSRF zafiyetinin en kritik potansiyel sonucu nedir?", options: options("Metadata servisine (ör. 169.254.169.254) erişerek geçici IAM rol anahtarlarını ele geçirmek", "Sunucunun IP adresini değiştirmek", "Web sayfasının CSS'ini bozmak"), correct: "a", subTopic: "Bulut Güvenliği & SSRF", explanation: "SSRF ile dahili metadata servisi sorgulanıp sunucuya tanımlı IAM kimlik bilgileri çalınabilir.", recommendedReview: "AWS IMDSv2 token zorunluluğu ve SSRF filtrelerini incele." },
        { id: "cyber-memory", prompt: "Modern işletim sistemlerinde ASLR ve DEP/NX korumalarını aşmak için saldırganlar hangi tekniği kullanır?", options: options("ROP (Return-Oriented Programming) zincirleri", "SQL Injection", "Kaba kuvvet şifre denemesi"), correct: "a", subTopic: "İkili Sömürü (Binary Exploitation)", explanation: "DEP yürütmeyi engeller; ROP ise bellekteki mevcut kod parçalarını (gadget) birleştirerek çalışır.", recommendedReview: "Bellek güvenliği, stack canaries ve ROP zinciri oluşturma mantığını çalış." },
        { id: "cyber-crypto", prompt: "AES-GCM gibi kimlik doğrulamalı şifreleme (AEAD) modlarında aynı anahtarla 'Nonce' tekrarı neye sebep olur?", options: options("Kimlik doğrulama anahtarının (GHASH) ifşa olmasına ve şifreli metnin bütünlüğünün bozulmasına", "İşlemin iki kat hızlanmasına", "Şifrelemenin daha güçlü olmasına"), correct: "a", subTopic: "Kriptografi & Nonce Güvenliği", explanation: "GCM modunda nonce tekrarı ölümcüldür; GHASH anahtarı çözülerek sahte mesaj üretilebilir.", recommendedReview: "Blok şifreleme modları (CBC vs GCM) ve kriptografik nonce kurallarını incele." }
      ]
    }
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
    questionPool: {
      beginner: [
        { id: "data-sql", prompt: "SQL'de WHERE ile HAVING arasındaki temel fark nedir?", options: options("WHERE gruplamadan önce, HAVING ise GROUP BY sonrası toplu filtreleme yapar", "İkisi tamamen aynı işi yapar", "HAVING sadece tablodaki sütun adını değiştirir"), correct: "a", subTopic: "SQL Filtreleme ve Gruplama", explanation: "WHERE satır bazında filtreler, HAVING toplulaştırılmış (aggregate) verileri filtreler.", recommendedReview: "SQL GROUP BY, HAVING ve toplulaştırma fonksiyonlarını (COUNT, SUM, AVG) tekrar et." },
        { id: "data-outlier", prompt: "Veri setindeki aykırı değerleri (outlier) incelerken ilk adım hangisidir?", options: options("Dağılımı görselleştirip veri toplama hatası mı gerçek sapma mı olduğunu anlamak", "Tüm aykırı değerleri hemen silmek", "Ortalamaya eşitlemek"), correct: "a", subTopic: "Veri Temizleme & Aykırı Değerler", explanation: "Aykırı değerler bilgi taşıyabilir veya sistem hatası olabilir; doğrudan silinmemelidir.", recommendedReview: "Kutu grafiği (Boxplot) ve IQR yöntemiyle aykırı değer analizini incele." },
        { id: "data-correlation", prompt: "İki değişken arasında yüksek korelasyon olması ne anlama gelir?", options: options("Birlikte değişim eğilimi gösterdiklerini, ancak doğrudan nedensellik kanıtlamadığını", "Biri diğerinin kesin sebebi olduğunu", "İkisinin de sıfıra eşit olduğunu"), correct: "a", subTopic: "Korelasyon vs Nedensellik", explanation: "Korelasyon sadece ilişkidir; nedensellik için kontrol grubu ve deney gerekir.", recommendedReview: "Pearson korelasyon katsayısı ve nedensellik yanılgıları üzerine çalış." },
        { id: "data-chart", prompt: "Sayısal sürekli bir değişkenin dağılımını (distribution) incelemek için en uygun grafik türü hangisidir?", options: options("Histogram veya Yoğunluk (KDE) Grafiği", "Pasta (Pie) Grafiği", "Ağaç Haritası (Treemap)"), correct: "a", subTopic: "Keşifsel Veri Görselleştirme", explanation: "Histogram, sürekli verinin belirli aralıklardaki frekans dağılımını gösterir.", recommendedReview: "Grafik türleri ve görsel veri analizi kurallarını incele." }
      ],
      intermediate: [
        { id: "data-window", prompt: "SQL'de `DENSE_RANK()` ile `RANK()` arasındaki fark nedir?", options: options("DENSE_RANK() eşit değerlerde sıralama numaralarında boşluk bırakmaz; RANK() atlar", "RANK() sadece metin sütunlarında çalışır", "İkisi tamamen aynıdır"), correct: "a", subTopic: "SQL Window Functions", explanation: "RANK 1, 1, 3 şeklinde giderken DENSE_RANK 1, 1, 2 şeklinde ardışık devam eder.", recommendedReview: "SQL analitik ve window fonksiyonları pratiği yap." },
        { id: "data-imputation", prompt: "Veri setinde %15 oranında rastgele eksik değer (MCAR) varsa ilk tercih edilen yaklaşım nedir?", options: options("Değişkenin dağılımına göre medyan/ortalama veya çoklu atama (MICE) uygulamak", "Tüm sütunu silmek", "Eksik değerleri 0 ile doldurmak"), correct: "a", subTopic: "Eksik Veri Yönetimi", explanation: "MCAR durumunda istatistiksel atama veri kaybını engeller.", recommendedReview: "Eksik veri mekanizmaları (MCAR, MAR, MNAR) konusunu çalış." },
        { id: "data-simpson", prompt: "Veri analizinde 'Simpson Paradoksu' ne zaman ortaya çıkar?", options: options("Gruplar ayrı ayrı incelendiğinde görülen eğilim, gruplar birleştirildiğinde tersine döndüğünde", "Veri seti çok büyük olduğunda", "Grafik renkleri yanlış seçildiğinde"), correct: "a", subTopic: "İstatistiki Yanılgılar & Simpson Paradoksu", explanation: "Gizli bir karıştırıcı (confounder) değişken alt grupların ağırlığını değiştirip sonucu ters yüz edebilir.", recommendedReview: "Karıştırıcı değişkenler ve alt grup analizlerini incele." }
      ],
      advanced: [
        { id: "data-causal", prompt: "Gözlemsel veride nedensellik analizi yaparken 'Propensity Score Matching' ne işe yarar?", options: options("Tedavi ve kontrol gruplarının kovaryant dağılımlarını dengeleyerek seçim yanlılığını azaltmak", "Tahmin doğruluğunu %100 yapmak", "Gereksiz sütunları silmek"), correct: "a", subTopic: "Nedensel Çıkarım (Causal Inference)", explanation: "PSM, gözlemsel veriyi sanki randomize kontrollü bir deneymiş gibi eşleştirir.", recommendedReview: "Causal DAGs ve karşı-olgusal (counterfactual) düşünce modellerini çalış." },
        { id: "data-stationarity", prompt: "Zaman serisi analizinde (ARIMA vb.) durağanlık (stationarity) kontrolü için hangi test yaygın kullanılır?", options: options("Augmented Dickey-Fuller (ADF) testi", "Student t-testi", "Chi-Square testi"), correct: "a", subTopic: "Zaman Serileri & Durağanlık", explanation: "ADF testi birim kök varlığını test ederek serinin durağan olup olmadığını belirler.", recommendedReview: "Zaman serilerinde fark alma (differencing) ve otokorelasyon (ACF/PACF) çalış." },
        { id: "data-leakage", prompt: "Makine öğrenimi modelinde 'Target Leakage' (Hedef Sızıntısı) neyi ifade eder?", options: options("Eğitim sırasında gelecekte tahmin anında ulaşılamayacak bilgilerin modele verilmesi", "Veritabanının çalınması", "Test verisinin eksik olması"), correct: "a", subTopic: "Model Güvenilirliği & Sızıntı", explanation: "Hedef sızıntısı testte sahte yüksek başarı verir ancak gerçek hayatta model çöker.", recommendedReview: "Veri bölme (Train/Validation/Test) ve feature engineering disiplinini tekrar et." }
      ]
    }
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
    questionPool: {
      beginner: [
        { id: "ai-temperature", prompt: "Bir LLM çağrısında temperature değerini sıfıra yakın tutmak ne sağlar?", options: options("Daha tutarlı, odaklı ve tekrarlanabilir yanıtlar", "Modelin hızını iki katına çıkarmak", "İnternet aramasını zorunlu kılmak"), correct: "a", subTopic: "Model Parametreleri (Temperature)", explanation: "Düşük temperature olasılık dağılımının tepesindeki belirgin tokenları seçtirir.", recommendedReview: "Temperature, top_p ve top_k parametrelerinin çıktıya etkilerini test et." },
        { id: "ai-rag", prompt: "RAG (Retrieval-Augmented Generation) mimarisinin birincil katkısı nedir?", options: options("Modele güncel veya özel belgeleri bağlam olarak sunup halüsinasyonu azaltmak", "Model parametrelerini sıfırdan eğitmek", "Yalnızca görüntü üretmek"), correct: "a", subTopic: "RAG Mimarisi", explanation: "RAG, vektör aramayla ilgili belgeleri prompt'a enjekte ederek doğruluğu artırır.", recommendedReview: "Vektör veri tabanları, embedding modelleri ve chunking stratejilerini incele." },
        { id: "ai-eval", prompt: "Bir LLM uygulamasının başarısını değerlendirirken en güvenilir yaklaşım hangisidir?", options: options("Çeşitli test senaryolarını içeren otomatik eval benchmark seti kullanmak", "Tek bir çıktıyı beğenip üretime almak", "Sadece model boyutuna bakmak"), correct: "a", subTopic: "LLM Değerlendirme (Evaluation)", explanation: "Sistematik eval setleri model güncellemelerinde gerilemeleri önler.", recommendedReview: "LLM test ve benchmark yöntemleri (ground truth karşılaştırması) çalış." },
        { id: "ai-tokens", prompt: "Büyük dil modellerinde 'Token' kavramı neyi temsil eder?", options: options("Modelin metni işlerken parçaladığı karakter veya alt-kelime (sub-word) birimlerini", "Yalnızca şifreleme anahtarını", "Veritabanındaki tablo sayısını"), correct: "a", subTopic: "Tokenizasyon (Tokenization)", explanation: "Modeller metni doğrudan kelime olarak değil, BPE vb. algoritmalarla token parçalarına ayırarak işler.", recommendedReview: "Byte-Pair Encoding (BPE) ve token hesaplama dinamiklerini incele." }
      ],
      intermediate: [
        { id: "ai-embeddings", prompt: "Vektör aramasında 'Cosine Similarity' metriği neyi ölçer?", options: options("İki vektör arasındaki açının kosinüsünü (vektörlerin yön benzerliğini)", "Vektörlerin uzunluk farkını", "Metindeki kelime sayısını"), correct: "a", subTopic: "Embedding & Vektör Araması", explanation: "Kosinüs benzerliği belge uzunluğundan bağımsız olarak anlamsal yön uyumunu ölçer.", recommendedReview: "Dot product, Cosine ve Euclidean mesafe metriklerini karşılaştır." },
        { id: "ai-lora", prompt: "Büyük bir modeli ince ayarlarken (fine-tuning) LoRA (Low-Rank Adaptation) kullanmanın temel faydası nedir?", options: options("Tüm ağırlıkları güncellemek yerine düşük rank matrisleri eğiterek GPU belleğini ve süreyi dramatik azaltmak", "Modelin parametre sayısını iki katına çıkarmak", "Eğitimi internet olmadan yapmak"), correct: "a", subTopic: "Parametre Verimli İnce Ayar (PEFT/LoRA)", explanation: "LoRA sadece adaptör matrislerini günceller; ana model dondurulur.", recommendedReview: "LoRA, QLoRA ve rank (r), alpha hiperparametrelerini incele." },
        { id: "ai-context", prompt: "Bir LLM'e sağlanan bağlam (context window) çok uzadığında 'Lost in the Middle' etkisi neyi tanımlar?", options: options("Modelin prompt'un ortasındaki bilgileri baş ve sondakilere göre daha zor hatırlaması", "Modelin hafızasının silinmesi", "Token maliyetinin sıfırlanması"), correct: "a", subTopic: "Bağlam Penceresi & Dikkat Dağılımı", explanation: "Dikkat mekanizmaları prompt başı ve sonuna daha yüksek ağırlık verme eğilimindedir.", recommendedReview: "Reranking ve optimal chunk boyutu stratejilerini çalış." }
      ],
      advanced: [
        { id: "ai-flashattn", prompt: "FlashAttention algoritmasının standart Multi-Head Attention'a göre sağladığı temel donanımsal optimizasyon nedir?", options: options("GPU HBM ile SRAM arasındaki I/O transferlerini tiling ile minimize ederek bellek bant genişliği darboğazını çözmek", "Modelin ağırlıklarını sıkıştırmak", "Daha az veriyle eğitilmesini sağlamak"), correct: "a", subTopic: "Attention Mimarisi & Donanım Optimizasyonu", explanation: "FlashAttention bellek erişim karmaşıklığını azaltarak hız ve bellek tasarrufu sağlar.", recommendedReview: "GPU bellek hiyerarşisi (SRAM vs HBM) ve dikkat hesaplaması karmaşıklığını incele." },
        { id: "ai-dpo", prompt: "DPO (Direct Preference Optimization) yönteminin RLHF'e (PPO) kıyasla en belirgin avantajı nedir?", options: options("Ayrı bir ödül modeli (reward model) eğitmeden doğrudan insan tercih verisiyle kapalı form optimizasyon sağlaması", "Yalnızca sınıflandırma yapabilmesi", "Daha büyük sunucu gerektirmesi"), correct: "a", subTopic: "Model Hizalama (Alignment / DPO)", explanation: "DPO, karmaşık pekiştirmeli öğrenme (RL) döngüsünü basitleştirip matematiksel olarak doğrudan çözer.", recommendedReview: "RLHF, PPO, DPO ve KTO karşılaştırmalarını çalış." },
        { id: "ai-kvcache", prompt: "LLM çıkarımında (inference) KV-Cache optimizasyonu ve PagedAttention (vLLM) neden kritiktir?", options: options("Daha önce üretilen tokenların Key/Value tensörlerini bellekte parçalanmasız yöneterek eşzamanlılığı katlamak", "Eğitim süresini kısaltmak", "Model boyutunu küçültmek"), correct: "a", subTopic: "LLM Çıkarım Optimizasyonu (vLLM)", explanation: "PagedAttention işletim sistemlerindeki sanal bellek gibi tensörleri sayfalayarak bellek israfını önler.", recommendedReview: "Autoregressive üretimde KV cache boyutu ve bellek darboğazlarını incele." }
      ]
    }
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
    questionPool: {
      beginner: [
        { id: "med-ebm", prompt: "Kanıta dayalı tıpta (EBM) en güçlü kanıt düzeyi genellikle hangisidir?", options: options("Sistematik derlemeler ve meta-analizler", "Uzman görüşü veya bireysel anlatılar", "Laboratuvar dedikodusu"), correct: "a", subTopic: "Kanıta Dayalı Tıp Piramidi", explanation: "Geniş randomize kontrollü çalışmaları derleyen meta-analizler en yüksek kanıt düzeyidir.", recommendedReview: "Kanıt düzeyi piramidini ve klinik çalışma tasarımlarını incele." },
        { id: "med-pharmacology", prompt: "Farmakokinetik ile farmakodinami arasındaki temel fark nedir?", options: options("Kinetik vücudun ilaca yaptığını, dinamik ise ilacın vücuda etkisini inceler", "İkisi tamamen aynı kavramdır", "Farmakodinamik yalnızca ilaç fiyatını belirler"), correct: "a", subTopic: "Temel Farmakoloji", explanation: "Farmakokinetik emilim, dağılım, metabolizma ve atılımı; dinamik ise reseptör etkisini açıklar.", recommendedReview: "ADME süreçleri ve reseptör agonizma/antagonizma prensiplerini çalış." },
        { id: "med-safety", prompt: "Tıbbi eğitim çalışmalarında hasta mahremiyeti ve verisi nasıl korunmalıdır?", options: options("Tüm kişisel kimlik bilgilerini tamamen anonimleştirerek", "Hastanın adını sosyal medyada paylaşarak", "Fotoğrafları izinsiz depolayarak"), correct: "a", subTopic: "Tıbbi Etik & Mahremiyet", explanation: "Tıp eğitiminde vaka incelemeleri mutlaka de-identifiye (anonim) edilmelidir.", recommendedReview: "Tıbbi etik ilkeleri ve hasta verisi koruma prensiplerini gözden geçir." }
      ],
      intermediate: [
        { id: "med-diag", prompt: "Bir tanı testinin 'Duyarlılığı' (Sensitivity) %95 ise bu ne anlama gelir?", options: options("Gerçekte hasta olan bireylerin %95'inde testin pozitif sonuç verdiğini", "Testi pozitif çıkanların %95'inin hasta olduğunu", "Testin hiçbir zaman hata yapmadığını"), correct: "a", subTopic: "Epidemiyoloji & Tanı Testleri", explanation: "Duyarlılık hasta olanları yakalama gücüdür; Pozitif Prediktif Değer ile karıştırılmamalıdır.", recommendedReview: "Duyarlılık, Özgüllük (Specificity) ve PPV/NPV hesaplamalarını çalış." },
        { id: "med-shock", prompt: "Hipovolemik şok tablosunda beklenen klasik hemodinamik bulgu kombinasyonu nedir?", options: options("Hipotansiyon, taşikardi, soğuk/soluk ekstremiteler ve oligüri", "Hipertansiyon ve bradikardi", "Ateş ve sıcak kırmızı cilt"), correct: "a", subTopic: "Akut Bakım & Şok Fizyopatolojisi", explanation: "Kan/sıvı kaybı dolaşım hacmini düşürür, kompansatuar vazokonstriksiyon ve taşikardi gelişir.", recommendedReview: "Şok tipleri (hipovolemik, kardiyojenik, septik) ayrımını incele." },
        { id: "med-abx", prompt: "Geniş spektrumlu antibiyotik kullanımında Clostridioides difficile enfeksiyonu riskini artıran temel mekanizma nedir?", options: options("Normal bağırsak mikrobiyotasının baskılanması sonucu C. difficile'in aşırı çoğalması", "Antibiyotiğin virüslere etki etmemesi", "Böbrek yetmezliği"), correct: "a", subTopic: "Mikrobiyoloji & Akılcı Antibiyotik Kullanımı", explanation: "Koruyucu floranın yok olması toksin üreten patojenlerin kolonizasyonuna yol açar.", recommendedReview: "Psödomembranöz enterokolit ve antibiyotik ilişkili diyare mekanizmalarını çalış." }
      ],
      advanced: [
        { id: "med-acidbase", prompt: "Metabolik asidozda 'Anyon Açığı' (Anion Gap) hesaplamasının temel klinik amacı nedir?", options: options("Asidozun ölçülmeyen asit anyonlarından mı (MUDPILES) yoksa bikarbonat kaybından mı kaynaklandığını ayırt etmek", "Kan şekerini doğrulamak", "Yalnızca sodyum seviyesini ölçmek"), correct: "a", subTopic: "Asit-Baz Dengesi & Anyon Açığı", explanation: "Artmış anyon açığı laktat, ketoasidoz veya toksin varlığını gösterir.", recommendedReview: "Henderson-Hasselbalch, Anyon Açığı ve Delta-Delta oranı hesaplamalarını çalış." },
        { id: "med-cyp450", prompt: "Warfarin kullanan bir hastaya güçlü bir CYP2C9 inhibitörü başlandığında ne gerçekleşir?", options: options("Warfarin metabolizması yavaşlar, plazma düzeyi ve INR yükselir, kanama riski artar", "Warfarin etkisi tamamen sıfırlanır", "Tromboz riski artar"), correct: "a", subTopic: "İleri Farmakogenetik & CYP450", explanation: "CYP inhibitörleri ilacın yıkımını azaltarak toksisite riskini artırır.", recommendedReview: "Sitokrom P450 indükleyicileri ve inhibitörleri tablosunu çalış." },
        { id: "med-acs", prompt: "ST elevasyonlu miyokard enfarktüsünde (STEMI) primer perkütan koroner girişim (PCI) için kılavuzların önerdiği hedef 'kapı-balon' süresi nedir?", options: options("≤ 90 dakika", "24 saat", "6 saat"), correct: "a", subTopic: "Kardiyoloji & Acil Girişim Kılavuzları", explanation: "STEMI'de zaman miyokard dokusudur; kılavuzlar ilk 90 dakikayı altın standart kabul eder.", recommendedReview: "Akut koroner sendromlar ve ESC/AHA revaskülarizasyon kılavuzlarını tekrar et." }
      ]
    }
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
    aliases: ["satranç", "satranc", "chess", "satranç taktikleri", "satranç açılışları", "elo"],
    kind: "chess",
    icon: "♞",
    metric: "Çözülen taktik",
    defaultProofType: "Lichess/Chess.com oyun analizi veya PGN dökümü",
    resources: [
      "Lichess Training — https://lichess.org/training",
      "Lichess Studies — https://lichess.org/study",
      "Chess.com Lessons — https://www.chess.com/lessons",
      "365Chess GM Database — https://www.365chess.com/",
    ],
    starterTasks: [
      { title: "Günlük taktik seti çöz (ŞAT taraması)", goal: "20 taktik bulmaca çöz; motifleri ve hata yaptığın konumları not et.", minutes: 30, taskType: "problem_solving" },
      { title: "Bir oyunu derinlemesine analiz et", goal: "Bir partide üç kritik anı, blunder'ları ve motor önerilerini PGN olarak kaydet.", minutes: 45, taskType: "review" },
    ],
    questions: [
      { id: "fork", prompt: "Satrançta çatal taktiği neyi anlatır?", options: options("Bir taşla iki veya daha fazla taşı tehdit etmeyi", "Oyunu beraberlikle bitirmeyi", "Piyon terfisini engellemeyi"), correct: "a", subTopic: "Temel Taktikler (Çatal)", explanation: "Çatal aynı anda birden fazla hedef oluşturarak savunmayı imkansız kılar.", recommendedReview: "At ve vezir çatalları üzerine 20 tematik bulmaca çöz." },
      { id: "castle", prompt: "Rok yapabilmek için ne gerekir?", options: options("Şahın ve ilgili kalenin daha önce hareket etmemiş olması", "Vezirin tahtada olmaması", "20 hamle yapılması"), correct: "a", subTopic: "Oyun Kuralları & Şah Güvenliği", explanation: "Şah veya kale hareket etmişse o kanada rok yapılamaz.", recommendedReview: "Rok kuralları ve şah tehdit altındayken rok engellerini tekrar et." },
      { id: "development", prompt: "Açılışta sağlıklı genel yaklaşım hangisidir?", options: options("Merkezi destekleyip hafif taşları geliştirmek", "Aynı taşı sürekli oynatmak", "Şahı erken merkeze taşımak"), correct: "a", subTopic: "Açılış Prensipleri", explanation: "Hafif taşları merkeze açıp rok ile şahı güvenceye almak temel ilkedir.", recommendedReview: "Klasik açılış ilkeleri üzerine dersleri incele." },
    ],
    questionPool: {
      beginner: [
        { id: "fork", prompt: "Satrançta çatal taktiği neyi anlatır?", options: options("Bir taşla iki veya daha fazla taşı tehdit etmeyi", "Oyunu beraberlikle bitirmeyi", "Piyon terfisini engellemeyi"), correct: "a", subTopic: "Temel Taktikler (Çatal)", explanation: "Çatal aynı anda birden fazla hedef oluşturarak savunmayı imkansız kılar.", recommendedReview: "At ve vezir çatalları üzerine 20 tematik bulmaca çöz." },
        { id: "castle", prompt: "Rok yapabilmek için ne gerekir?", options: options("Şahın ve ilgili kalenin daha önce hareket etmemiş olması", "Vezirin tahtada olmaması", "20 hamle yapılması"), correct: "a", subTopic: "Oyun Kuralları & Şah Güvenliği", explanation: "Şah veya kale hareket etmişse o kanada rok yapılamaz.", recommendedReview: "Rok kuralları ve şah tehdit altındayken rok engellerini tekrar et." },
        { id: "development", prompt: "Açılışta sağlıklı genel yaklaşım hangisidir?", options: options("Merkezi destekleyip hafif taşları geliştirmek", "Aynı taşı sürekli oynatmak", "Şahı erken merkeze taşımak"), correct: "a", subTopic: "Açılış Prensipleri", explanation: "Hafif taşları merkeze açıp rok ile şahı güvenceye almak temel ilkedir.", recommendedReview: "Klasik açılış ilkeleri üzerine dersleri incele." }
      ],
      intermediate: [
        { id: "chess-pin", prompt: "Satrançta 'mutlak açmaz' (absolute pin) ile 'göreli açmaz' arasındaki temel fark nedir?", options: options("Mutlak açmazda arkadaki taş şahtır ve öndeki taş yasal olarak oynanamaz", "Göreli açmazda taş kaybedilmez", "İkisi tamamen aynıdır"), correct: "a", subTopic: "Açmaz Taktikleri", explanation: "Mutlak açmazdaki taşın hareketi şahı tehdit altına sokacağından kurallara aykırıdır.", recommendedReview: "Açmaz taktikleri bulmacaları çöz." },
        { id: "chess-outpost", prompt: "Satrançta bir at için 'karakol' (outpost) karesi neyi ifade eder?", options: options("Rakip piyonlar tarafından sürülemeyen ve piyonumuzla korunan ileri merkez kareyi", "Tahtanın en kenarındaki kareyi", "Yalnızca başlangıç karesini"), correct: "a", subTopic: "Konumsal Oyun & Karakol", explanation: "Rakibin saldıramadığı ileri karelerde konuşlanan taşlar muazzam konumsal baskı kurar.", recommendedReview: "Zayıf kareler ve taş yerleşimi teorisini incele." },
        { id: "chess-opposition", prompt: "Şah ve piyon finallerinde 'opozisyon' (opposition) kavramı neden önemlidir?", options: options("Rakip şahın kritik karelere sızmasını engelleyip piyonun terfisini sağlamak için", "Oyunu hemen berabere yapmak için", "Zaman kazanmak için"), correct: "a", subTopic: "Piyon Finalleri & Opozisyon", explanation: "Aralarında tek kare fark olan şahların karşı karşıya gelmesi kritik kare kontrolünü belirler.", recommendedReview: "Temel şah ve piyon finalleri ve opozisyon kuralı çalış." }
      ],
      advanced: [
        { id: "chess-prophylaxis", prompt: "Büyükustaların sıkça uyguladığı 'profilaksi' (prophylaxis) stratejisinin özü nedir?", options: options("Kendi planını uygulamadan önce rakibin karşı şanslarını ve tehditlerini önceden engellemek", "Her hamlede şah çekmek", "Tüm taşları feda etmek"), correct: "a", subTopic: "Profilaksi & Üst Düzey Strateji", explanation: "Profilaksi rakibin olası aktif planını sezerek daha başlamadan boşa çıkarmaktır (Petrosian / Karpov ekolü).", recommendedReview: "Nimzowitsch'in 'Benim Sistemim' kitabındaki profilaksi analizlerini incele." },
        { id: "chess-exchange-sac", prompt: "Tigran Petrosian tarzı konumsal kalite fedasının (exchange sacrifice) tipik amacı nedir?", options: options("Bir kale vererek tahtadaki karanlık/aydınlık kare kontrolünü veya inisiyatifi kalıcı olarak ele geçirmek", "Hemen mat etmek", "Taş sayısını azaltmak"), correct: "a", subTopic: "Konumsal Kalite Fedası", explanation: "Taktik bir geri dönüş olmasa bile rakibin yapısını bozup kendi hafif taşlarını canlandırmak için yapılır.", recommendedReview: "Petrosian ve Kasparov kalite fedası partilerini incele." },
        { id: "chess-lucena", prompt: "Kale finallerinde 'Lucena Konumu' neden bilinmesi şart olan bir kalıptır?", options: options("Köprü kurma (building a bridge) tekniğiyle piyonu güvenle terfi ettirip kazanmak için", "Sürekli şah çekerek beraberlik kurtarmak için", "Piyonu feda etmek için"), correct: "a", subTopic: "Kale Finalleri (Lucena & Philidor)", explanation: "Lucena tekniği kale finallerinde kazanç sağlayan en temel formüldür.", recommendedReview: "Lucena konumu ve Philidor savunması finallerini tahtada uygula." }
      ]
    }
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
    id: "english",
    name: "İngilizce",
    aliases: ["ingilizce", "english", "ing", "ielts", "toefl", "yds", "ingilizce öğrenme"],
    kind: "reading",
    icon: "🇬🇧",
    metric: "Aktif kelime, dinleme ve konuşma",
    defaultProofType: "Sesli konuşma kaydı veya seviye deneme özeti",
    resources: [
      "BBC Learning English — https://www.bbc.co.uk/learningenglish",
      "Cambridge Dictionary — https://dictionary.cambridge.org/",
      "British Council LearnEnglish — https://learnenglish.britishcouncil.org/",
    ],
    starterTasks: [
      { title: "İngilizce aktif kelime ve flashcard seti oluştur", goal: "Seviyene uygun 20 yeni kelimeyi örnek cümleleriyle kaydet.", minutes: 30, taskType: "practice" },
      { title: "Shadowing ve dinleme pratiği yap", goal: "5 dakikalık BBC ses kaydını dinle ve sesli taklit ederek kaydet.", minutes: 35, taskType: "reading" },
    ],
    questions: supportedLanguages.english.questions.beginner,
  },
  {
    id: "german",
    name: "Almanca",
    aliases: ["almanca", "german", "deutsch", "goethe", "testdaf"],
    kind: "reading",
    icon: "🇩🇪",
    metric: "Aktif kelime ve artikel çalışması",
    defaultProofType: "Sesli konuşma kaydı veya cümle kütüğü",
    resources: [
      "Deutsche Welle Deutsch Lernen — https://learngerman.dw.com/",
      "Duden Online Wörterbuch — https://www.duden.de/",
      "Goethe-Institut Übungen — https://www.goethe.de/",
    ],
    starterTasks: [
      { title: "Almanca artikel (der/die/das) ve kelime seti oluştur", goal: "Seviyene uygun 20 ismi artikelleri ve çoğullarıyla kaydet.", minutes: 30, taskType: "practice" },
      { title: "DW Deutsch diyalog dinleme ve sesli tekrar", goal: "Kısa bir Nicos Weg bölümünü izleyip diyalogları sesli oku.", minutes: 35, taskType: "reading" },
    ],
    questions: supportedLanguages.german.questions.beginner,
  },
  {
    id: "french",
    name: "Fransızca",
    aliases: ["fransızca", "french", "français", "delf", "dalf"],
    kind: "reading",
    icon: "🇫🇷",
    metric: "Aktif kelime ve telaffuz pratiği",
    defaultProofType: "Sesli kayıt transkripti veya kısa kompozisyon",
    resources: [
      "TV5Monde Apprendre le français — https://apprendre.tv5monde.com/",
      "Le Robert Dictionnaire — https://www.lerobert.com/",
      "RFI Savoirs (Journal en français facile) — https://francaisfacile.rfi.fr/",
    ],
    starterTasks: [
      { title: "Fransızca fonetik ve temel kelime seti oluştur", goal: "20 temel kelimeyi burundan okunuş kurallarıyla sesli kaydet.", minutes: 30, taskType: "practice" },
      { title: "Journal en français facile dinle ve özetle", goal: "Günün haber bültenini dinleyip 3 ana başlığı not al.", minutes: 35, taskType: "reading" },
    ],
    questions: supportedLanguages.french.questions.beginner,
  },
  {
    id: "japanese",
    name: "Japonca",
    aliases: ["japonca", "japanese", "nihongo", "jlpt", "kanji"],
    kind: "reading",
    icon: "🇯🇵",
    metric: "Kanji, kana ve dinleme oturumu",
    defaultProofType: "Yazılı kanji/cümle kartı veya sesli diyalog kaydı",
    resources: [
      "NHK World Easy Japanese — https://www.nhk.or.jp/lesson/english/",
      "Jisho Japanese Dictionary — https://jisho.org/",
      "Tae Kim's Japanese Grammar Guide — https://guidetojapanese.org/",
    ],
    starterTasks: [
      { title: "Japonca alfabe ve temel kalıp seti oluştur", goal: "Hiragana/Katakana veya seviyene uygun 10 Kanji ve kelimeyi kaydet.", minutes: 30, taskType: "practice" },
      { title: "NHK Easy Japanese diyalog dinleme", goal: "Temel günlük diyaloğu dinle ve sesli tekrar (shadowing) yap.", minutes: 35, taskType: "reading" },
    ],
    questions: supportedLanguages.japanese.questions.beginner,
  },
  {
    id: "arabic",
    name: "Arapça",
    aliases: ["arapça", "arabic", "arabca", "fasih arapça", "sarf", "nahiv"],
    kind: "reading",
    icon: "🇸🇦",
    metric: "Sarf, nahiv ve aktif kelime",
    defaultProofType: "İ'rab analizi veya sesli okuma kaydı",
    resources: [
      "Al-Jazeera Learning Arabic — https://learning.aljazeera.net/",
      "Almaany Arabic-Turkish Dictionary — https://www.almaany.com/",
      "Madinah Arabic Course — https://www.madinaharabic.com/",
    ],
    starterTasks: [
      { title: "Arapça temel kelime ve vezin haritası çıkar", goal: "Seviyene uygun 20 kök kelimeyi ve çekim kalıplarını kaydet.", minutes: 30, taskType: "practice" },
      { title: "Fasih Arapça metin okuma ve sesli kayıt", goal: "Harekeli kısa bir metni sesli oku ve i'rab özelliklerini incele.", minutes: 35, taskType: "reading" },
    ],
    questions: supportedLanguages.arabic.questions.beginner,
  },
  {
    id: "language",
    name: "Yabancı Dil",
    aliases: ["yabancı dil", "dil öğrenme", "spanish", "ispanyolca", "italyanca", "rusça"],
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
  {
    id: "reading",
    name: "Okuma ve Edebiyat",
    aliases: ["okuma", "kitap", "reading", "edebiyat", "roman", "felsefe", "makale okuma"],
    kind: "reading",
    icon: "▤",
    metric: "Okunan sayfa",
    defaultProofType: "Bölüm özeti ve düşünce kütüğü",
    resources: ["Open Library — https://openlibrary.org/", "Stanford Encyclopedia of Philosophy — https://plato.stanford.edu/"],
    starterTasks: [
      { title: "Okuma listesi ve sayfa hedeflerini belirle", goal: "Okunacak kitapları, günlük sayfa hedefini ve not alma yöntemini belirle.", minutes: 30, taskType: "deep_work" },
      { title: "Odaklanmış okuma bloğu ve özet çıkar", goal: "25 sayfa kesintisiz oku; 3 ana fikri ve bir çarpıcı alıntıyı not et.", minutes: 45, taskType: "reading" },
    ],
    questions: [
      { id: "read-argument", prompt: "Felsefi veya kuramsal bir metni okurken ilk odaklanılması gereken nedir?", options: options("Yazarın ana tezi ve bu tezi destekleyen öncülleri", "Yalnızca kitabın sayfa sayısı", "Yazarın doğum tarihi"), correct: "a", subTopic: "Metin Analizi ve Argüman Tespiti", explanation: "Bir metnin omurgası yazarın savunduğu ana tez ve mantıksal öncülleridir.", recommendedReview: "Eleştirel okuma ve argüman haritalama yöntemlerini incele." },
      { id: "read-synthesis", prompt: "Okunan bir metinden en yüksek verimi almak için hangisi önerilir?", options: options("Metni kendi cümlelerinle özetleyip diğer fikirlerle sentezlemek", "Metni hiç not almadan hızlıca geçmek", "Yalnızca altını çizip bırakmak"), correct: "a", subTopic: "Aktif Okuma ve Sentez", explanation: "Kendi cümleleriyle ifade etme (Feynman tekniği) kalıcı kavrayışı sağlar.", recommendedReview: "Bölüm sonlarında 3 maddelik zihinsel özet çıkarma pratiği yap." },
      { id: "read-context", prompt: "Klasik bir edebi eseri incelerken eserin bağlamını anlamak neden şarttır?", options: options("Dönemin sosyokültürel dinamiklerini kavramadan yazarın mesajı tam anlaşılamaz", "Yalnızca kelime sayısını artırmak için", "Gramer kurallarını ezberlemek için"), correct: "a", subTopic: "Tarihsel ve Edebi Bağlam", explanation: "Edebi eserler yazıldıkları dönemin çatışmalarını ve zihniyetini yansıtır.", recommendedReview: "Eserin yazıldığı dönemin tarihsel arka planını araştırmayı alışkanlık edin." },
    ],
  },
  {
    id: "yks-tyt",
    name: "YKS / TYT Hazırlık",
    aliases: ["yks", "tyt", "ayt", "yks hazırlık", "üniversite sınavı", "yks tyt", "ösym yks", "yks öğrencisi"],
    kind: "custom",
    icon: "📝",
    metric: "Çözülen deneme ve soru",
    defaultProofType: "Deneme sınavı karnesi veya soru çözüm notu",
    resources: ["ÖSYM Sınav Portalı — https://www.osym.gov.tr/", "MEB OGM Materyal — https://ogmmateryal.eba.gov.tr/"],
    starterTasks: [
      { title: "TYT teşhis denemesi çöz ve netlerini çıkar", goal: "Süre tutarak ilk denemeyi tamamla, branş netlerini kaydet.", minutes: 165, taskType: "deep_work" },
      { title: "Yanlış defteri oluştur ve ilk analizi yap", goal: "Denemede boş ve yanlış çıkan ilk 5 sorunun çözüm videosunu incele.", minutes: 45, taskType: "problem_solving" },
    ],
    questions: [
      { id: "yks-strategy", prompt: "TYT sınavında zaman yönetiminde 'Turlama Tekniği' neyi ifade eder?", options: options("İlk turda kolay ve emin olunan soruları çözüp zorları ikinci tura bırakmayı", "Tüm soruları sırayla çözüp takılınan soruda dakikalarca beklemeyi", "Sınavı son 10 dakikada rastgele kodlamayı"), correct: "a", subTopic: "Sınav Stratejisi & Turlama Tekniği", explanation: "Turlama tekniği zaman tuzağına düşmeden en yüksek nete ulaşmayı sağlar.", recommendedReview: "Denemelerde soru başına süre takibi ve işaretleme disiplini kur." },
      { id: "yks-wrong", prompt: "Deneme sınavından sonra netleri artırmada en kritik adım hangisidir?", options: options("Yanlış ve boş soruları analiz edip eksik alt konuyu tekrar etmek", "Sadece toplam puana bakıp denemeyi bir kenara koymak", "Hemen başka bir denemeye başlamak"), correct: "a", subTopic: "Yanlış Defteri ve Hata Analizi", explanation: "Net artışı denemenin kendisinden değil, yanlışların öğreticiliğinden gelir.", recommendedReview: "Her deneme sonrası yanlış defterine konu bazlı not çıkar." },
      { id: "yks-repetition", prompt: "Unutulan formül ve kavramları kalıcı kılmanın bilimsel yolu nedir?", options: options("1, 3, 7 ve 21 gün kuralına göre aralıklı tekrar yapmak", "Sınavdan bir gece önce sabahlamak", "Konuyu sadece bir kez okumak"), correct: "a", subTopic: "Aralıklı Tekrar & Kalıcı Hafıza", explanation: "Aralıklı tekrar eğrisi, bilginin uzun süreli belleğe transferini sağlar.", recommendedReview: "Zorlanılan konuları haftalık takvime 15'er dakikalık tekrarlar olarak ekle." },
    ],
  },
  {
    id: "kpss",
    name: "KPSS Hazırlık",
    aliases: ["kpss", "kpss lisans", "kpss önlisans", "memurluk sınavı", "gygk", "genel yetenek genel kültür"],
    kind: "custom",
    icon: "🏛",
    metric: "Çözülen deneme ve soru",
    defaultProofType: "Deneme sınavı karnesi veya konu özet tablosu",
    resources: ["ÖSYM KPSS Portalı — https://www.osym.gov.tr/", "Resmî Gazete — https://www.resmigazete.gov.tr/"],
    starterTasks: [
      { title: "KPSS GY-GK teşhis denemesi çöz", goal: "Süre tutarak 120 soruluk ilk denemeyi yap ve netlerini çıkar.", minutes: 130, taskType: "deep_work" },
      { title: "Tarih ve Vatandaşlık kavram haritası çıkar", goal: "İlk ünite için kronolojik harita ve yanlış analizini kaydet.", minutes: 50, taskType: "problem_solving" },
    ],
    questions: [
      { id: "kpss-logic", prompt: "KPSS Genel Yetenek sözel mantık sorularında en güvenilir çözüm yaklaşımı nedir?", options: options("Verilen öncülleri tablo veya şemaya dökerek kesin bilgileri yerleştirmek", "Soruyu zihinden çözmeye çalışmak", "Şıkları rastgele denemek"), correct: "a", subTopic: "Sözel Mantık Tablolama", explanation: "Sözel mantıkta olasılıkları tablo üzerinde görmek karışıklığı ve hataları önler.", recommendedReview: "Çapraz tablo ve sıralama şablonları üzerine pratik yap." },
      { id: "kpss-constitution", prompt: "KPSS Vatandaşlık çalışırken 1982 Anayasası maddeleri nasıl çalışılmalıdır?", options: options("Kavram haritaları, yetki paylaşımları ve güncel değişikliklerle karşılaştırarak", "Bütün anayasayı ezbere okuyarak", "Yalnızca genel kültür sorularına bakarak"), correct: "a", subTopic: "Anayasa Hukuku & Yasama/Yürütme/Yargı", explanation: "Organların görev ve yetki sınırlarını tablo halinde görmek ezberi kolaylaştırır.", recommendedReview: "Cumhurbaşkanlığı, TBMM ve Yargı organlarının görev tablosunu incele." },
      { id: "kpss-history", prompt: "KPSS Tarih sorularında kronoloji bilgisinin önemi nedir?", options: options("Neden-sonuç ilişkilerini doğru kurmak ve ıslahat sıralamalarını kaçırmamak", "Sadece tarih ezberlemek için", "Soru metnini kısaltmak için"), correct: "a", subTopic: "Tarihsel Kronoloji & Neden-Sonuç", explanation: "Olayların sırası ve dönemsel bağlamı seçenekleri elemeyi sağlar.", recommendedReview: "Padişahlar, ıslahatlar ve inkılaplar için zaman çizelgesi çıkar." },
    ],
  },
  {
    id: "banking",
    name: "Bankacılık Sınavları",
    aliases: ["bankacılık", "müfettiş yardımcılığı", "uzman yardımcılığı", "bankacılık sınavı", "banka sınavları", "banka"],
    kind: "custom",
    icon: "🏦",
    metric: "Çözülen vaka ve soru",
    defaultProofType: "Mali tablo analizi veya sınav deneme karnesi",
    resources: ["BDDK Mevzuat — https://www.bddk.org.tr/", "TCMB Yayınları — https://www.tcmb.gov.tr/"],
    starterTasks: [
      { title: "Müfettişlik teşhis denemesi ve vaka çöz", goal: "Ekonomi, muhasebe ve analitik bölümü tamamla.", minutes: 120, taskType: "deep_work" },
      { title: "Temel bankacılık rasyoları ve mevzuat özeti çıkar", goal: "Sermaye yeterliliği ve kredi mevzuatı ilkelerini not et.", minutes: 50, taskType: "reading" },
    ],
    questions: [
      { id: "bank-car", prompt: "Bankacılıkta Sermaye Yeterlilik Rasyosu (SYR) neyi gösterir?", options: options("Bankanın özkaynaklarının risk ağırlıklı varlıklarına oranını ve finansal sağlamlığını", "Müşteri sayısının şube sayısına oranını", "Günlük nakit girişini"), correct: "a", subTopic: "Sermaye Yeterliliği & Basel İlkeleri", explanation: "SYR (CAR), bankanın olası şoklara karşı taşıdığı sermaye tamponunu gösterir.", recommendedReview: "Basel standartları ve BDDK sermaye yeterliliği yönetmeliğini incele." },
      { id: "bank-npl", prompt: "Takipteki Alacaklar (NPL - Non-Performing Loans) oranı neyi ifade eder?", options: options("Ödemesi gecikmiş/tahsilatı şüpheli kredilerin toplam kredilere oranını", "Bankanın kâr marjını", "Yıllık mevduat faizini"), correct: "a", subTopic: "Kredi Riski ve Varlık Kalitesi", explanation: "NPL oranı bankanın aktif kalitesini ve kredi risk yönetim başarısını gösterir.", recommendedReview: "Karşılık ayrılması ve kredi sınıflandırma esaslarını çalış." },
      { id: "bank-accounting", prompt: "Banka muhasebesinde 'Tekdüzen Hesap Planı'nın temel gerekliliği nedir?", options: options("Mali tabloların standart, şeffaf ve denetlenebilir biçimde sunulması", "Her bankanın farklı isimler kullanması", "Yalnızca vergi ödemek"), correct: "a", subTopic: "Banka Muhasebesi Standartları", explanation: "Standart hesap planı BDDK ve bağımsız denetim organlarının tekdüze analizini sağlar.", recommendedReview: "Bilanço içi ve bilanço dışı (nazım) hesap işleyişini tekrar et." },
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
