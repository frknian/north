export interface BookReadingSession {
  id: string;
  bookId: string;
  date: string; // YYYY-MM-DD
  startPage: number;
  endPage: number;
  pagesRead: number;
  minutes: number;
  notes?: string;
  quote?: string;
}

export interface NorthBook {
  id: string;
  title: string;
  author: string;
  category: string;
  totalPages: number;
  currentPage: number;
  status: "reading" | "completed" | "want_to_read";
  startedAt?: string;
  finishedAt?: string;
  rating?: number; // 1 to 5
  notes?: string;
  favoriteQuotes?: string[];
  coverColor?: string; // e.g. "emerald", "indigo", "amber", "rose", "sky", "purple"
  sessions?: BookReadingSession[];
}

export interface BookRecommendation {
  id: string;
  title: string;
  author: string;
  category: string;
  totalPages: number;
  summary: string;
  whyRead: string;
  keyTakeaways: string[];
  difficulty: "Başlangıç" | "Orta" | "İleri";
  goalMood: "Derin Öğrenme" | "Alışkanlık & Zihin" | "Hızlı İlham" | "Felsefe & Zihin Açıcı" | "Teknik & Uzmanlık";
  tags: string[];
  rating: number;
  coverColor?: string;
}

export const BOOK_CATEGORIES = [
  "Tümü",
  "Alışkanlık & Zihin",
  "Siber Güvenlik",
  "Teknoloji & Yazılım",
  "Psikoloji & Zihin",
  "Bilim & Felsefe",
  "Finans & Girişimcilik",
  "Edebiyat & Klasikler",
] as const;

export const BOOK_GOAL_MOODS = [
  "Tümü",
  "Alışkanlık & Zihin",
  "Derin Öğrenme",
  "Hızlı İlham",
  "Felsefe & Zihin Açıcı",
  "Teknik & Uzmanlık",
] as const;

export const BOOK_RECOMMENDATIONS: BookRecommendation[] = [
  {
    id: "rec-deep-work",
    title: "Deep Work (Pürdikkat)",
    author: "Cal Newport",
    category: "Alışkanlık & Zihin",
    totalPages: 280,
    summary: "Bilişsel açıdan zorlu bir göreve dikkatiniz dağılmadan odaklanabilme becerisini ve sığ işlerin tuzaklarından kurtulma yollarını anlatır.",
    whyRead: "Gününüzü sürekli bölünen bildirimler ve e-postalar yerine saatlerce süren kesintisiz, yüksek değerli bir akışa dönüştürmek için.",
    keyTakeaways: [
      "Derin çalışma sadece bir alışkanlık değil, günümüz bilgi ekonomisinde bir süper güçtür.",
      "Dikkat kalıntısı teorisi: Her sekme veya uygulama geçişinde beyniniz eski görevde takılı kalır.",
      "Sığ işleri sıkıca sınırlandırın; her gün en az 90-120 dk pürdikkat blok açın.",
    ],
    difficulty: "Orta",
    goalMood: "Alışkanlık & Zihin",
    tags: ["odak", "üretkenlik", "minimalizm", "zaman yönetimi"],
    rating: 4.9,
    coverColor: "indigo",
  },
  {
    id: "rec-atomic-habits",
    title: "Atomik Alışkanlıklar",
    author: "James Clear",
    category: "Alışkanlık & Zihin",
    totalPages: 320,
    summary: "Küçük, önemsiz gibi görünen günlük seçimlerin uzun vadede olağanüstü bileşik getiriler üretmesini sağlayan pratik kanıtlanmış bir rehber.",
    whyRead: "Hedeflerinize ulaşamamanız iradenizin zayıflığından değil, sisteminizin yanlışlığındandır. Doğru bir alışkanlık mimarisi kurmak için.",
    keyTakeaways: [
      "Her gün %1 daha iyi olmak, yıl sonunda 37 kat daha iyi olmanızı sağlar.",
      "Hedefleri değil, sistemleri optimize edin. Kimliğe dayalı alışkanlıklar edinin.",
      "4 Temel Kanun: Görünür kıl, cazip kıl, kolaylaştır, tatmin edici kıl.",
    ],
    difficulty: "Başlangıç",
    goalMood: "Alışkanlık & Zihin",
    tags: ["alışkanlık", "disiplin", "sistem kurma", "gelişim"],
    rating: 4.9,
    coverColor: "amber",
  },
  {
    id: "rec-web-app-hacker",
    title: "The Web Application Hacker's Handbook",
    author: "Dafydd Stuttard & Marcus Pinto",
    category: "Siber Güvenlik",
    totalPages: 912,
    summary: "Web uygulamalarında zafiyet keşfi, sömürme teknikleri ve savunma mekanizmalarını A'dan Z'ye derinlemesine ele alan efsanevi başvuru kaynağı.",
    whyRead: "Siber güvenlik alanında web katmanını ve PortSwigger/Burp Suite araçlarını saldırganın zihniyetiyle tam anlamak için.",
    keyTakeaways: [
      "Kullanıcıdan gelen hiçbir girdiye güvenilemez; istemci taraflı kontroller tamamen atlatılabilir.",
      "Yetkilendirme ve oturum yönetimi açıkları sistemlerin en hassas ve tehlikeli zafiyetleridir.",
      "Zafiyetleri kavramak, kodlama esnasında güvenli mimariler kurmanın ön şartıdır.",
    ],
    difficulty: "İleri",
    goalMood: "Teknik & Uzmanlık",
    tags: ["siber güvenlik", "web hacking", "owasp", "burp suite"],
    rating: 4.8,
    coverColor: "rose",
  },
  {
    id: "rec-sandworm",
    title: "Sandworm",
    author: "Andy Greenberg",
    category: "Siber Güvenlik",
    totalPages: 352,
    summary: "Ukrayna elektrik şebekesinin çökertilmesinden NotPetya küresel felaketine kadar uzanan, siber savaşın gerçek boyutlarını ortaya koyan sürükleyici bir araştırma.",
    whyRead: "Siber saldırıların sadece sanal dünyada değil, fiziksel altyapılarda ve ulus devletler düzeyinde ne denli yıkıcı olabileceğini kavramak için.",
    keyTakeaways: [
      "Kritik altyapılar (enerji, hastaneler, limanlar) modern savaşın ön cephesidir.",
      "Tedarik zinciri saldırıları (NotPetya) kontrolsüzce dünyaya yayılabilir.",
      "Dijital iz sürme ve atıf (attribution) istihbarat dünyasının en zorlu sanatıdır.",
    ],
    difficulty: "Orta",
    goalMood: "Derin Öğrenme",
    tags: ["siber savaş", "notpetya", "threat intelligence", "tarih"],
    rating: 4.8,
    coverColor: "emerald",
  },
  {
    id: "rec-pragmatic-programmer",
    title: "The Pragmatic Programmer",
    author: "David Thomas & Andrew Hunt",
    category: "Teknoloji & Yazılım",
    totalPages: 352,
    summary: "Yazılım zanaatkarlığı, kod kalitesi, problem çözme alışkanlıkları ve sürekli öğrenme üzerine klasikleşmiş bir rehber.",
    whyRead: "Sadece kod yazan bir teknisyen olmaktan çıkıp, sürdürülebilir, zarif ve değer üreten bir mühendis olmak için.",
    keyTakeaways: [
      "DRY (Don't Repeat Yourself): Bilginin her parçası sistemde tek, açık bir temsile sahip olmalıdır.",
      "Kırık Pencereler Teorisi: Kötü tasarımı ve özensiz kodu anında düzeltin, yayılmasına izin vermeyin.",
      "Taş Çorbası mantığı: Değişimi başlatmak için önce küçük bir çalışan prototip gösterin.",
    ],
    difficulty: "Orta",
    goalMood: "Teknik & Uzmanlık",
    tags: ["yazılım", "mühendislik", "kod kalitesi", "zanaatkarlık"],
    rating: 4.9,
    coverColor: "sky",
  },
  {
    id: "rec-ddia",
    title: "Designing Data-Intensive Applications",
    author: "Martin Kleppmann",
    category: "Teknoloji & Yazılım",
    totalPages: 616,
    summary: "Güvenilir, ölçeklenebilir ve sürdürülebilir modern veri sistemlerinin, veri tabanlarının ve dağıtık mimarilerin anatomisi.",
    whyRead: "Backend, büyük veri ve sistem mimarisi alanında ezberden uzaklaşıp verinin diskteki saklanışından ağdaki tutarlılığına kadar tüm mekaniği öğrenmek için.",
    keyTakeaways: [
      "Güvenilirlik, ölçeklenebilirlik ve sürdürülebilirlik her sistemin ana sacayağıdır.",
      "LSM-Tree vs B-Tree veri yapıları farklı okuma/yazma iş yükleri için tasarlanmıştır.",
      "Dağıtık sistemlerde ağ gecikmeleri ve bölünmeler kaçınılmazdır; mutlak tutarlılık ödünler gerektirir.",
    ],
    difficulty: "İleri",
    goalMood: "Teknik & Uzmanlık",
    tags: ["dağıtık sistemler", "veritabanı", "backend", "mimari"],
    rating: 5.0,
    coverColor: "purple",
  },
  {
    id: "rec-thinking-fast-slow",
    title: "Düşünme, Hızlı ve Yavaş",
    author: "Daniel Kahneman",
    category: "Psikoloji & Zihin",
    totalPages: 512,
    summary: "Nobel ödüllü psikoloğun insan zihnindeki iki düşünce sistemini (otomatik Sistem 1 ve analitik Sistem 2) ve bilişsel yanılgıları açıkladığı başyapıt.",
    whyRead: "Kendi karar alma mekanizmanızdaki sezgisel tuzakları, aşırı güven yanılgısını ve mantık hatalarını fark edip rasyonelleşmek için.",
    keyTakeaways: [
      "Sistem 1 hızlı, sezgisel ve zahmetsiz çalışır; Sistem 2 yavaş, hesaplayıcı ve enerji tüketir.",
      "Kayıptan kaçınma: İnsanlar 100 TL kazanmanın sevincinden çok, 100 TL kaybetmenin acısını hisseder.",
      "Çerçeveleme etkisi: Bilginin sunuluş biçimi alınan kararı kökten değiştirebilir.",
    ],
    difficulty: "Orta",
    goalMood: "Felsefe & Zihin Açıcı",
    tags: ["psikoloji", "karar alma", "bilişsel yanılgılar", "zihin"],
    rating: 4.7,
    coverColor: "amber",
  },
  {
    id: "rec-meditations",
    title: "Kendime Düşünceler",
    author: "Marcus Aurelius",
    category: "Bilim & Felsefe",
    totalPages: 176,
    summary: "Roma İmparatoru'nun savaş meydanlarında, veba salgınlarında ve kriz anlarında kendi zihnine yazdığı samimi Stoacı rehber.",
    whyRead: "Dış dünyada olanları değiştiremediğinde kendi algını ve tepkilerini yöneterek sarsılmaz bir iç huzura ve disipline ulaşmak için.",
    keyTakeaways: [
      "Zihninin üzerinde tam gücün var, dış olaylar üzerinde değil. Bunu anladığında gücünü bulacaksın.",
      "Sabah uyandığında kendine söyle: Bugün nankör, kaba ve bencil insanlarla karşılaşacağım ama onlar bana zarar veremez.",
      "Ölüm kaçınılmazdır; şimdiki anı ertelemeden onurlu ve dingin bir şekilde yaşa.",
    ],
    difficulty: "Başlangıç",
    goalMood: "Felsefe & Zihin Açıcı",
    tags: ["stoacılık", "felsefe", "özdisiplin", "huzur"],
    rating: 4.8,
    coverColor: "emerald",
  },
  {
    id: "rec-zero-to-one",
    title: "Sıfırdan Bire (Zero to One)",
    author: "Peter Thiel",
    category: "Finans & Girişimcilik",
    totalPages: 220,
    summary: "Var olanı 1'den n'e kopyalamak yerine, dünyada daha önce hiç var olmamış yeni bir şeyi 0'dan 1'e üretmenin felsefesi.",
    whyRead: "Acımasız rekabet batağından sıyrılıp, benzersiz bir değer yaratarak kalıcı bir tekel (monopoly) inşa etme vizyonu kazanmak için.",
    keyTakeaways: [
      "Mükemmel rekabet şirket kârlarını sıfırlar; gerçek yaratıcı değer tekel olmaktan gelir.",
      "Çok az insanın seninle aynı fikirde olduğu önemli bir doğru nedir?",
      "Gelecek rastlantısal değil, net bir plan ve vizyonla inşa edilir.",
    ],
    difficulty: "Başlangıç",
    goalMood: "Hızlı İlham",
    tags: ["girişimcilik", "inovasyon", "vizyon", "iş dünyası"],
    rating: 4.7,
    coverColor: "indigo",
  },
  {
    id: "rec-psychology-of-money",
    title: "Psikoloji ve Para",
    author: "Morgan Housel",
    category: "Finans & Girişimcilik",
    totalPages: 256,
    summary: "Parayla kurduğumuz ilişkinin tablolardan ve formüllerden çok, insan psikolojisi, ego ve gururla ilişkili olduğunu anlatan 19 kısa hikaye.",
    whyRead: "Finansal huzurun zekadan ziyade davranış ve sabır yönetimi olduğunu öğrenip uzun vadeli dingin bir varlık inşa etmek için.",
    keyTakeaways: [
      "Zengin olmak para kazanmakla ilgilidir, varlıklı kalmak ise harcamamak ve alçakgönüllülükle ilgilidir.",
      "Bileşik getirinin sırrı yüksek getiri oranında değil, kesintisiz uzun süre oyunda kalmaktadır.",
      "Paranın sağladığı en büyük temettü, kendi zamanınızı kontrol edebilme özgürlüğüdür.",
    ],
    difficulty: "Başlangıç",
    goalMood: "Alışkanlık & Zihin",
    tags: ["finans", "özgürlük", "psikoloji", "zaman yönetimi"],
    rating: 4.9,
    coverColor: "sky",
  },
  {
    id: "rec-digital-minimalism",
    title: "Dijital Minimalizm",
    author: "Cal Newport",
    category: "Alışkanlık & Zihin",
    totalPages: 256,
    summary: "Teknolojiyi tamamen reddetmeden, sadece değerlerinize hizmet eden dijital araçları bilinçli seçerek sakin ve odaklı bir hayat sürme felsefesi.",
    whyRead: "Sosyal medyanın ve algoritmaların beyninizi sürekli bir dopamin döngüsünde tüketmesini engellemek için.",
    keyTakeaways: [
      "30 günlük dijital temizlik (declutter) uygulayarak bağımlılık döngüsünü kırın.",
      "Yalnız kalabilme (solitude) kapasitesi üretkenliğin ve yaratıcı düşüncenin beşiğidir.",
      "Boş zamanınızı pasif kaydırma yerine nitelikli fiziksel veya yaratıcı hobilerle doldurun.",
    ],
    difficulty: "Başlangıç",
    goalMood: "Alışkanlık & Zihin",
    tags: ["minimalizm", "dijital detoks", "odak", "huzur"],
    rating: 4.7,
    coverColor: "emerald",
  },
  {
    id: "rec-1984",
    title: "1984",
    author: "George Orwell",
    category: "Edebiyat & Klasikler",
    totalPages: 352,
    summary: "Büyük Birader'in gözetimi altındaki Okyanusya ülkesinde özgür düşüncenin, dilin ve tarihin nasıl silindiğini anlatan sarsıcı başyapıt.",
    whyRead: "Bireysel mahremiyetin, doğru bilginin ve bağımsız düşüncenin insan onuru için neden vazgeçilmez olduğunu hatırlamak için.",
    keyTakeaways: [
      "Geçmişi kontrol eden geleceği kontrol eder; bugünü kontrol eden geçmişi kontrol eder.",
      "Çiftdüşün: İki çelişkili inancı aynı anda zihninde tutabilme ve ikisine de inanabilme yetisi.",
      "Dil fakirleştirildiğinde düşüncenin sınırları da daralır.",
    ],
    difficulty: "Orta",
    goalMood: "Felsefe & Zihin Açıcı",
    tags: ["distopya", "edebiyat", "mahremiyet", "klasik"],
    rating: 4.9,
    coverColor: "rose",
  },
  {
    id: "rec-clean-code",
    title: "Clean Code (Temiz Kod)",
    author: "Robert C. Martin",
    category: "Teknoloji & Yazılım",
    totalPages: 464,
    summary: "İyi kod ile kötü kod arasındaki farkı somut örneklerle gösteren, okunabilir ve test edilebilir yazılım geliştirme rehberi.",
    whyRead: "Gelecekte kendinizin ve ekip arkadaşlarınızın kafasını karıştırmayacak, yaşayan ve evrilen temiz sistemler yazmak için.",
    keyTakeaways: [
      "Fonksiyonlar tek bir iş yapmalı ve onu en iyi şekilde yapmalıdır.",
      "Yorum satırları genellikle kötü kodu açıklama çabasıdır; kodu kendisi konuşacak kadar açık yazın.",
      "İzci Kuralı: Bulduğunuz kamp yerini bulduğunuzdan daha temiz bırakın.",
    ],
    difficulty: "Orta",
    goalMood: "Teknik & Uzmanlık",
    tags: ["temiz kod", "yazılım", "refactoring", "mühendislik"],
    rating: 4.7,
    coverColor: "purple",
  },
  {
    id: "rec-alchemist",
    title: "Simyacı",
    author: "Paulo Coelho",
    category: "Edebiyat & Klasikler",
    totalPages: 184,
    summary: "Endülüslü çoban Santiago'nun Mısır Piramitleri'ne uzanan kendi kişisel menkıbesini ve kalbinin sesini arayış yolculuğu.",
    whyRead: "Zorlu bir çalışma veya kariyer döneminde kendi amacınızı, cesaretinizi ve hayattaki işaretleri hatırlamak için.",
    keyTakeaways: [
      "Bir şeyi gerçekten istediğinde, bütün evren onu gerçekleştirmen için iş birliği yapar.",
      "Hazine genellikle aradığın yolculuğun ta kendisinde ve başlangıç noktasındadır.",
      "Korku, acının kendisinden daha çok acı verir.",
    ],
    difficulty: "Başlangıç",
    goalMood: "Hızlı İlham",
    tags: ["ilham", "kişisel menkıbe", "yolculuk", "klasik"],
    rating: 4.8,
    coverColor: "amber",
  },
];

const BOOKS_STORAGE_KEY = "north:user_books_shelf";

export const STARTER_BOOKS: NorthBook[] = [
  {
    id: "book-deep-work",
    title: "Deep Work (Pürdikkat)",
    author: "Cal Newport",
    category: "Alışkanlık & Zihin",
    totalPages: 280,
    currentPage: 64,
    status: "reading",
    startedAt: "2026-09-01",
    rating: 5,
    coverColor: "indigo",
    notes: "Odak kasını geliştirmek için sığ bildirimlerden uzak durmalı.",
    favoriteQuotes: [
      "Derin çalışma, günümüz karmaşık ekonomisinde hızla değer kazanan ve nadirleşen bir süper güçtür.",
    ],
    sessions: [
      {
        id: "sess-1",
        bookId: "book-deep-work",
        date: "2026-09-03",
        startPage: 1,
        endPage: 32,
        pagesRead: 32,
        minutes: 35,
        quote: "Dikkat kalıntısı zihinsel performansı doğrudan baltalar.",
      },
      {
        id: "sess-2",
        bookId: "book-deep-work",
        date: "2026-09-07",
        startPage: 33,
        endPage: 64,
        pagesRead: 31,
        minutes: 30,
        quote: "Sığ işleri sınırlandırın; derin işe alan açın.",
      },
    ],
  },
  {
    id: "book-atomic-habits",
    title: "Atomik Alışkanlıklar",
    author: "James Clear",
    category: "Alışkanlık & Zihin",
    totalPages: 320,
    currentPage: 320,
    status: "completed",
    startedAt: "2026-08-10",
    finishedAt: "2026-08-28",
    rating: 5,
    coverColor: "amber",
    notes: "Sistem inşa etmek hedeften önemlidir.",
    favoriteQuotes: [
      "Hedeflerinizin seviyesine yükselmezsiniz, sistemlerinizin seviyesine düşersiniz.",
    ],
    sessions: [
      {
        id: "sess-3",
        bookId: "book-atomic-habits",
        date: "2026-08-28",
        startPage: 280,
        endPage: 320,
        pagesRead: 40,
        minutes: 40,
      },
    ],
  },
  {
    id: "book-sandworm",
    title: "Sandworm",
    author: "Andy Greenberg",
    category: "Siber Güvenlik",
    totalPages: 352,
    currentPage: 0,
    status: "want_to_read",
    coverColor: "emerald",
    notes: "Siber savaş ve altyapı güvenliği üzerine mutlaka okunmalı.",
  },
];

const STARTER_BOOK_IDS = new Set(["book-deep-work", "book-atomic-habits", "book-sandworm"]);

export function loadBooks(): NorthBook[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BOOKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // One-time cleanup for users whose personal shelf was automatically populated with starter mock books
    const cleanedFlag = localStorage.getItem("north:cleaned_starter_books_v1");
    if (!cleanedFlag) {
      localStorage.setItem("north:cleaned_starter_books_v1", "true");
      const userCreatedOnly = parsed.filter((b) => !STARTER_BOOK_IDS.has(b.id));
      if (userCreatedOnly.length !== parsed.length) {
        saveBooks(userCreatedOnly);
        return userCreatedOnly;
      }
    }

    return parsed;
  } catch {
    return [];
  }
}

export function clearAllBooks(): void {
  saveBooks([]);
}

export function loadStarterBooks(): void {
  const current = loadBooks();
  const currentIds = new Set(current.map((b) => b.id));
  const toAdd = STARTER_BOOKS.filter((b) => !currentIds.has(b.id));
  saveBooks([...current, ...toAdd]);
}

export function saveBooks(books: NorthBook[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(books));
  } catch {}
}

export function addBook(book: Omit<NorthBook, "id">): NorthBook {
  const books = loadBooks();
  const newBook: NorthBook = {
    ...book,
    id: `book-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    currentPage: Math.max(0, Number(book.currentPage) || 0),
    totalPages: Math.max(1, Number(book.totalPages) || 100),
    sessions: book.sessions || [],
    favoriteQuotes: book.favoriteQuotes || [],
    coverColor: book.coverColor || ["indigo", "emerald", "amber", "rose", "sky", "purple"][Math.floor(Math.random() * 6)],
  };
  const next = [newBook, ...books];
  saveBooks(next);
  return newBook;
}

export function updateBook(id: string, updates: Partial<NorthBook>): NorthBook | null {
  const books = loadBooks();
  let updatedBook: NorthBook | null = null;
  const next = books.map((b) => {
    if (b.id === id) {
      const merged: NorthBook = { ...b, ...updates };
      if (merged.currentPage >= merged.totalPages && merged.status !== "completed") {
        merged.status = "completed";
        merged.finishedAt = merged.finishedAt || new Date().toISOString().slice(0, 10);
      }
      updatedBook = merged;
      return merged;
    }
    return b;
  });
  saveBooks(next);
  return updatedBook;
}

export function deleteBook(id: string): void {
  const books = loadBooks();
  const next = books.filter((b) => b.id !== id);
  saveBooks(next);
}

export function logReadingSession(
  bookId: string,
  endPage: number,
  minutes: number,
  quote?: string,
  notes?: string
): { book: NorthBook; pagesRead: number } | null {
  const books = loadBooks();
  const target = books.find((b) => b.id === bookId);
  if (!target) return null;

  const startPage = target.currentPage;
  const clampedEnd = Math.min(target.totalPages, Math.max(startPage, endPage));
  const pagesRead = Math.max(0, clampedEnd - startPage);

  const newSession: BookReadingSession = {
    id: `sess-${Date.now()}`,
    bookId,
    date: new Date().toISOString().slice(0, 10),
    startPage,
    endPage: clampedEnd,
    pagesRead,
    minutes: Math.max(1, minutes),
    quote: quote?.trim() || undefined,
    notes: notes?.trim() || undefined,
  };

  const existingQuotes = target.favoriteQuotes || [];
  if (quote && quote.trim() && !existingQuotes.includes(quote.trim())) {
    existingQuotes.push(quote.trim());
  }

  const updated: NorthBook = {
    ...target,
    currentPage: clampedEnd,
    status: clampedEnd >= target.totalPages ? "completed" : "reading",
    finishedAt: clampedEnd >= target.totalPages ? new Date().toISOString().slice(0, 10) : target.finishedAt,
    sessions: [newSession, ...(target.sessions || [])],
    favoriteQuotes: existingQuotes,
  };

  updateBook(bookId, updated);
  return { book: updated, pagesRead };
}

export interface RecommendationFilterOptions {
  category?: string;
  goalMood?: string;
  length?: "all" | "short" | "medium" | "long";
  query?: string;
}

export function filterRecommendations(
  options: RecommendationFilterOptions = {}
): BookRecommendation[] {
  const { category = "Tümü", goalMood = "Tümü", length = "all", query = "" } = options;
  const normalizedQuery = query.toLowerCase().trim();

  return BOOK_RECOMMENDATIONS.filter((rec) => {
    if (category !== "Tümü" && rec.category !== category) {
      return false;
    }
    if (goalMood !== "Tümü" && rec.goalMood !== goalMood) {
      return false;
    }
    if (length === "short" && rec.totalPages >= 200) {
      return false;
    }
    if (length === "medium" && (rec.totalPages < 200 || rec.totalPages > 400)) {
      return false;
    }
    if (length === "long" && rec.totalPages <= 400) {
      return false;
    }
    if (normalizedQuery) {
      const match =
        rec.title.toLowerCase().includes(normalizedQuery) ||
        rec.author.toLowerCase().includes(normalizedQuery) ||
        rec.summary.toLowerCase().includes(normalizedQuery) ||
        rec.tags.some((t) => t.toLowerCase().includes(normalizedQuery));
      if (!match) return false;
    }
    return true;
  });
}
