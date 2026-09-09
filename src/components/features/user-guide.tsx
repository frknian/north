"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Clock3,
  Compass,
  ExternalLink,
  Flame,
  FlaskConical,
  GraduationCap,
  Headphones,
  Home,
  Info,
  Layers3,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Volume2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NorthCoachSymbol } from "@/components/north/north-coach-symbol";
import { cn } from "@/lib/utils";
import { startPlanorthTour } from "./guide-tour-modal";

interface GuideSection {
  tab: string;
  route: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  summary: string;
  details: string;
  points: {
    title: string;
    desc: string;
    subBullets?: string[];
  }[];
  proTip?: string;
}

const guideTabs: GuideSection[] = [
  {
    tab: "Bugün (Ana Sayfa)",
    route: "/",
    badge: "1. KONTROL KULESİ",
    icon: Home,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    summary: "Günün tek ana önceliği, sabah/akşam ritüelleri, aktif kamp şeridi ve mikro alışkanlıklar.",
    details: "Masaüstünde tek ekranda scrollsüz kalacak, mobilde ise tek elle kolayca yönetilecek şekilde ergonomik olarak kurgulanmıştır.",
    points: [
      {
        title: "Büyük 'ŞİMDİ' Odak Kartı",
        desc: "Karar yorgunluğunu sıfırlayan odak kartı. O an yapman gereken tek görevi, ayrılan süreyi ve ana kazanımı dev bir kart olarak sunar.",
        subBullets: [
          "'Odak Seansını Başlat' ile anında Odak Kokpiti'ne geçiş",
          "Gözünde büyüyen görevler için kart üzerinden anında 'Yarıya Küçült' kısayolu",
          "Beklenmeyen durumlarda vicdani rahatlıkla 'Ertele' seçeneği",
        ],
      },
      {
        title: "Sabah Pusulası Ritüeli (2 Dakika)",
        desc: "Her sabah güne başlamadan önce niyetini belirle ve günün tek ana önceliğini mühürle. Günün yönü karmaşaya girmeden netleşir.",
      },
      {
        title: "Günü Kapat Ritüeli (2 Dakika)",
        desc: "Akşam çalışmayı noktalarken günün muhasebesini yap. Yetişmeyen işler borç veya negatif puan olmaz; sonraki güne veya haftalık havuza suçluluk duymadan devredilir.",
      },
      {
        title: "Aktif Alt Konu & Sınav Kampı Şeridi",
        desc: "Devam eden bir vize, final veya teknik kampın varsa, ana ekranın en üstünde kalan gün sayısı, sınav tarihi ve tamamlanan modül oranı canlı olarak akar.",
      },
      {
        title: "Mikro Alışkanlık Takibi",
        desc: "Su tüketimi, 15 sayfa kitap okuma, teknik terim tekrarı gibi günlük mikro alışkanlık zincirlerini tek dokunuşla işaretle.",
      },
    ],
    proTip: "Sabahları ilk iş Sabah Pusulası'nı tamamla; odaklanacağın tek görevi seçtikten sonra gün içinde başka listelere bakma.",
  },
  {
    tab: "Alanlar & Sınav Kampları",
    route: "/areas",
    badge: "2. HEDEF & SPRINT MERKEZİ",
    icon: Layers3,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    summary: "Hedef alanları, vize/final alt konuları ve PDF/ders notu yükleme ile modül çıkarma.",
    details: "Tüm uzmanlık alanlarını ve acil sınav/öğrenme sprintlerini tek çatı altında toplar.",
    points: [
      {
        title: "Kişisel Hedef Alanları",
        desc: "Siber Güvenlik, Yazılım, Yabancı Dil, Tıp, Matematik, KPSS vb. alanların her birine özel seviye, hedef ve görev matrisi bulunur.",
      },
      {
        title: "Alt Konu & Sınav Kampı (Topic Sprint)",
        desc: "Üniversite vizesi, finali, sertifika sınavı veya iş mülakatı için belirli bir bitiş tarihi olan yoğun çalışma kampı başlat.",
        subBullets: [
          "Bitiş tarihini seç (örneğin: 14 gün sonra)",
          "Özel alt konuyu veya ders başlığını tanımla",
          "Takvime sınav etkinliği ve geri sayım otomatik işlensin",
        ],
      },
      {
        title: "PDF & Ders Notu Analiz Entegrasyonu",
        desc: "Elinizdeki ders slaytını, konu özetini veya teknik dokümanı yükle. Sistem belgeyi analiz eder, 4-5 uygulanabilir modüle böler ve günlük görevleri otomatik oluşturur.",
      },
    ],
    proTip: "Bir sınava çalışırken tüm kitabı bir kerede bitirmeye çalışma; notlarını PDF olarak yükleyip sistemin modüllere bölmesine izin ver.",
  },
  {
    tab: "Haftalık Plan",
    route: "/week",
    badge: "3. BORÇSUZ VE ESNEK AKIŞ",
    icon: ClipboardList,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    summary: "7 günlük görsel akış, suçluluksuz görev erteleme, küçültme ve takvime akıllı otomatik dağıtım.",
    details: "Klasik to-do listelerin aksine görev yığılmasını ve erteleme suçluluğunu önleyen akıllı mekanizmalar içerir.",
    points: [
      {
        title: "Görev Küçültme (Shrink)",
        desc: "Zamanın yetmediği veya gözünde büyüyen bir görevi tek tıkla yarı yarıya küçült. Örneğin 60 dakikalık derin blok anında 30 dakikalık mikro adıma dönüşür.",
      },
      {
        title: "Borçsuz Erteleme (Postpone) & Havuz (Pool)",
        desc: "Görevi başka bir güne aktarabilir ya da belirli bir güne bağlamadan haftalık esnek havuza bırakabilirsin.",
      },
      {
        title: "Takvime Akıllı Otomatik Dağıtım (Smart Distribution)",
        desc: "Havuzda bekleyen görevleri takvimindeki gerçek boş saatlere tek tıkla dağıt.",
        subBullets: [
          "'Yalnızca Hafta Sonu': Görevleri sadece Cumartesi ve Pazar boşluklarına yerleştirir",
          "'Yalnızca Hafta İçi': Hafta sonuna dokunmaz, Pazartesi-Cuma arasına dengeli böler",
          "'Özel Günler': Seçtiğin günlerdeki (örneğin Salı ve Perşembe) boşlukları kullanır",
        ],
      },
      {
        title: "Kapasite Aşımı Koruması",
        desc: "Bir güne kapasitenin üzerinde görev yığılması durumunda sistem uyarı verir ve aşırı yüklenmeni önler.",
      },
    ],
    proTip: "Haftalık planda pazar günleri havuzdaki işleri 'Yalnızca Hafta Sonu' filtresiyle boşluklara dağıtarak hafta içini hafiflet.",
  },
  {
    tab: "Kaynaklar & Araştırma Merkezi",
    route: "/resources",
    badge: "4. KİTAP, PDF & NOTEBOOKLM",
    icon: BookOpen,
    color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
    summary: "Kitaplık, sistem içi Google PDF arama, kişisel sayfa aralıkları pinleme ve NotebookLM paketi.",
    details: "Ders kitaplarını, açık akademik dokümanları ve yapay zeka araştırma araçlarını birleştiren 4 sekmeli araştırma merkezi.",
    points: [
      {
        title: "1. Kitaplık & Okuma Sekmesi",
        desc: "Kişisel kitaplarını ekle, okuma durumunu (Okunuyor, İstek Listesi, Tamamlandı) ve sayfa ilerlemeni takip et.",
        subBullets: [
          "Kitap İçi Arama Çubuğu: Her kitabın yanındaki arama çubuğuyla o kitaba ait açık kaynakları veya Google PDF materyallerini doğrudan ara",
          "Okuma seansları ve hedef sayfa aralıkları belirleme",
        ],
      },
      {
        title: "2. Web & Google PDF Arama Sekmesi",
        desc: "Sistem içinden canlı web araması ve Google onaylı açık PDF kitap arama motoru. Harici sekme açmadan güvenilir sonuçları, sayfa özetlerini ve PDF bağlantılarını listeler.",
        subBullets: [
          "Doğrulanmış açık kaynak ve üniversite PDF'lerini anında listeleme",
          "Bulunan kitabı tek tıkla kendi kişisel kütüphanene kaydetme",
        ],
      },
      {
        title: "3. Pinli Belgeler & Sayfa Aralıkları Sekmesi",
        desc: "Tamamen kullanıcının KİŞİSEL ALANIDIR. Sistem buraya zorla veya izinsiz öneri eklemez.",
        subBullets: [
          "Kitapların veya belgelerin belirli sayfa aralıklarını (örn: Sayfa 45 - 62) kaydet",
          "Ders notu veya sayfa ekran görüntülerini pinle",
          "İncelemen bittiğinde sayfaları tek tek veya topluca temizle",
        ],
      },
      {
        title: "4. NotebookLM & AI Özetleyici Sekmesi",
        desc: "Yapay zeka ile kaynak özeti çıkar veya tek tıkla NotebookLM için Markdown kaynak paketi kopyala.",
        subBullets: [
          "NotebookLM Kaynak Paketi: Seçili tüm kaynakları tek tıkla panoya kopyalayarak Google NotebookLM'e yapıştır",
          "NotebookLM Çalışma Alanı: Resmi Google NotebookLM arayüzüne tek tıkla geçiş yap",
        ],
      },
    ],
    proTip: "Okuduğun teknik bir kitabın sayfa aralığını pinle; ardından Odak Kokpiti'nde çalışırken yan panelde açarak sekme değiştirmeden oku.",
  },
  {
    tab: "Odak Kokpiti",
    route: "/focus",
    badge: "5. DERİN ODAK & ZEN",
    icon: Play,
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    summary: "Zen modu, 6 kanallı ortam ses mikseri, entegre yan kaynak dock'u ve dikkat kilidi.",
    details: "Masaüstünde tam 100vh kilitli, dikkati dağıtacak hiçbir gereksiz menü barındırmayan saf odak alanı.",
    points: [
      {
        title: "Zen Odak Modu",
        desc: "Sayaç başladığında tüm dış etkenler gizlenir. Ekranda yalnızca kalan süre, görev ismi ve alt adımlar kalır.",
      },
      {
        title: "6 Kanallı Ortam Ses Mikseri",
        desc: "Kendi ses miksajını oluştur: Yağmur, Fırtına, Kafe, Şömine, Okyanus Dalgası ve Beyaz Gürültü. Her birinin ses seviyesini bağımsız ayarla.",
      },
      {
        title: "Yan Kaynak Dock'u (Entegre Okuma)",
        desc: "Çalışırken tarayıcı sekmeleri arasında kaybolma. Görevinle ilgili pinli PDF sayfalarını, web linklerini veya notlarını sağ panelde aç.",
      },
      {
        title: "Sekme & Dikkat Kilidi",
        desc: "Odak seansı sırasında başka sekmelere geçişi hatırlatarak derin çalışma süreni korur.",
      },
    ],
    proTip: "Zor ve yoğun zihinsel işlerde 'Yağmur + Şömine' mikserini %40 seviyesinde açarak kulaklıkla çalış.",
  },
  {
    tab: "İlerleme & Değerlendirme",
    route: "/progress",
    badge: "6. RADAR & HAFTALIK RİTÜEL",
    icon: BarChart3,
    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    summary: "5 eksenli radar analizi, haftalık pazar kapatma ritüeli ve seviye atlayan yol arkadaşı.",
    details: "Süslü başarı yüzdeleri yerine harcanan gerçek odak dakikalarını ve somut pratik çıktıları ölçer.",
    points: [
      {
        title: "5 Eksenli Radar Analizi",
        desc: "Gelişimini 5 temel boyutta objektif olarak gör: Tutarlılık, Derin Odak Süresi, Pratik Çıktı, Çeşitlilik ve Plan Disiplini.",
      },
      {
        title: "Haftalık Pazar Kapatma Ritüeli",
        desc: "Her pazar 10 dakikada haftalık retrospektifini yap: Kazanılan başarılar, yaşanan darboğazlar ve gelecek haftanın tek ana hedefi.",
      },
      {
        title: "Büyüyen Yol Arkadaşı (Companion)",
        desc: "Tamamladığın odak seansları ve ulaştığın hedeflerle seviye atlayan, seni motive eden sanal refakatçin.",
      },
    ],
    proTip: "Pazar günleri ritüeli tamamlamadan yeni haftanın görevlerini planlama; önce geçen haftanın darboğazını tespit et.",
  },
  {
    tab: "Takvim & Zaman Blokları",
    route: "/calendar",
    badge: "7. KAPASİTE KORUMA",
    icon: CalendarDays,
    color: "text-teal-500 bg-teal-500/10 border-teal-500/20",
    summary: "Sabit okul/iş blokları, çakışma engelleme ve günlük serbest zaman hesabı.",
    details: "Gerçek hayatın sınırlarını sisteme öğretir; böylece ulaşılamaz hayali planlar yerine gerçekçi programlar sunar.",
    points: [
      {
        title: "Sabit Zaman Blokları",
        desc: "Okul ders saatlerini, hastane mesailerini veya iş toplantılarını takvime gir.",
      },
      {
        title: "Dinamik Boşluk Eşleme",
        desc: "Görevler yalnızca sabit blokların dışındaki gerçek boş zaman pencerelerine atanır.",
      },
      {
        title: "Aşırı Yüklenme Koruması",
        desc: "Günde 8 saat mesaisi olan birine ek olarak 6 saatlik ağır görev yazılmasını engeller.",
      },
    ],
    proTip: "Haftanın başında önce sabit mesai bloklarını takvime gir; ardından görevleri haftalık plandan otomatik dağıt.",
  },
  {
    tab: "Portföy, Lab & Sertifikalar",
    route: "/evidence",
    badge: "8. SOMUT KANITLAR",
    icon: Briefcase,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    summary: "Doğrulanabilir kanıtlar (/evidence), teknik hata günlüğü (/labs) ve sertifika takibi (/certifications).",
    details: "Öğrendiğini kanıtlayan somut çıktıları, bağımsız problem çözümlerini ve kariyer hedeflerini belgeler.",
    points: [
      {
        title: "Portföy & Kanıtlar (/evidence)",
        desc: "Tamamlanan GitHub reposu, yazılan teknik makale, hazırlanan sunum veya proje bağlantılarını somut kanıt olarak kaydet.",
      },
      {
        title: "Pratik Lab Günlüğü (/labs)",
        desc: "Zorlandığın problemleri, aldığın hata kodlarını, denediğin yolları ve bağımsız çözüm süreni günlüğe işle.",
      },
      {
        title: "Sertifika Yol Haritası (/certifications)",
        desc: "Hedeflediğin sınavların tarihlerini, resmi kaynaklarını ve konu kapsamlarını takip et.",
      },
    ],
    proTip: "Çözdüğün her zorlu teknik sorunu lab günlüğüne yaz; mülakatlarda ve teknik değerlendirmelerde en büyük kanıtın bu olacaktır.",
  },
  {
    tab: "Planorth AI Koç",
    route: "/coach",
    badge: "9. STRATEJİK MENTOR",
    icon: Sparkles,
    color: "text-primary bg-primary/10 border-primary/20",
    summary: "Kalıcı kural hafızası, kayan koç butonu ve stratejik hazır komutlar.",
    details: "Sıradan bir chatbot değildir; senin çalışma sınırlarını, kurallarını öğrenen ve planını savunan bir mentordur.",
    points: [
      {
        title: "Kalıcı Kural Hafızası",
        desc: "Koç'a söylediğin çalışma kuralları unutulmaz. Örneğin: 'Pazartesi sabahları hafif okuma ver', 'Gece 22:00'den sonraya zor soru koyma' dediğinde bunu kalıcı olarak kaydeder.",
      },
      {
        title: "Kayan Koç Butonu (Floating Widget)",
        desc: "Hangi sayfada olursan ol sağ alttaki simgeye dokunarak anında Koç'a danışabilir, planını güncelletebilirsin.",
      },
      {
        title: "Önleyici Müdahale",
        desc: "Haftalık hedeflerinden saptığında veya aşırı yüklendiğinde Koç seni nazikçe uyarır ve planı hafifletmeyi önerir.",
      },
    ],
    proTip: "Koç ile konuşurken çekinme; çalışma alışkanlıkların hakkındaki tüm kurallarını Profil > AI Hafızası sekmesinden de düzenleyebilirsin.",
  },
];

const workflows = [
  {
    title: "1. Tipik Bir Günün Akışı (Gündelik Üretkenlik)",
    badge: "GÜNLÜK RİTİM",
    icon: Flame,
    steps: [
      { step: "08:30", action: "Sabah Pusulası", detail: "Güne Bugün sayfasında başla. 2 dakikada günün niyetini belirle ve tek ana önceliğini mühürle." },
      { step: "09:00", action: "Büyük ŞİMDİ Kartı", detail: "Ekranda beliren tek önceliğe tıkla. 'Odak Seansını Başlat' diyerek doğrudan Odak Kokpiti'ne geç." },
      { step: "Odak", action: "Ses Mikseri & Yan Panel", detail: "Ortam seslerinden 'Yağmur + Kafe' mikserini aç, yan dock'a ilgili notunu sabitle, seansı başlat." },
      { step: "17:30", action: "Günü Kapat Ritüeli", detail: "Çalışma bittiğinde 'Günü Kapat' ile tamamlananları kutla, kalanları borç hissetmeden yarına devret." },
    ],
  },
  {
    title: "2. Vize, Final veya Sınav Kampı (Topic Sprint)",
    badge: "SINAV & SPRINT",
    icon: GraduationCap,
    steps: [
      { step: "1. Adım", action: "Kamp Başlat", detail: "Alanlar (/areas) sekmesinden 'Alt Konu / Sınav Kampı' butonuna tıkla, sınav tarihini seç (örn: 12 gün sonra)." },
      { step: "2. Adım", action: "Ders Notu / PDF Yükle", detail: "Slayt veya konu özetini sisteme yükle. Yapay zeka belgeyi incelesin ve 4-5 çalışma modülüne bölsün." },
      { step: "3. Adım", action: "Takvim & Şerit", detail: "Takvime sınav etkinliği eklenir; Bugün ekranının en üstünde geri sayım ve modül ilerleme şeridi belirir." },
      { step: "4. Adım", action: "Modül Modül İlerle", detail: "Her modülü tamamladıkça sıradaki adımlar otomatik olarak günlük akışına düşer." },
    ],
  },
  {
    title: "3. Kitap Okuma & Araştırma (Google PDF + NotebookLM)",
    badge: "ARAŞTIRMA",
    icon: BookOpen,
    steps: [
      { step: "1. Adım", action: "Kaynaklar Merkezini Aç", detail: "Kaynaklar (/resources) sekmesine geç; kitaplık, PDF arama veya pinli belgeleri seç." },
      { step: "2. Adım", action: "Google PDF Arama", detail: "Kitabın yanındaki arama çubuğunu veya PDF arama motorunu kullanarak açık dokümanları sistem içinde listele." },
      { step: "3. Adım", action: "Sayfa Aralığı Pinle", detail: "Okuyacağın bölümü (örn: Sayfa 45-62) pinle. Burası tamamen senin kişisel alanındır." },
      { step: "4. Adım", action: "NotebookLM Paketi", detail: "Çalışma bittiğinde 'NotebookLM Paketi' ile tek tıkla Markdown çıktısını panoya kopyala ve NotebookLM'e aktar." },
    ],
  },
  {
    title: "4. Yoğun / Aksayan Günlerde Kriz Yönetimi",
    badge: "PLAN KURTARMA",
    icon: RotateCcw,
    steps: [
      { step: "1. Adım", action: "Haftalık Plana Geç", detail: "İşlerin aksadığı veya zamanın kalmadığı günlerde Haftalık Plan (/week) sayfasına gir." },
      { step: "2. Adım", action: "Görevi Küçült (Shrink)", detail: "Gözünde büyüyen 90 dakikalık ağır görevi tek tıkla 45 dakikalık mikro adıma indir." },
      { step: "3. Adım", action: "Havuza Bırak (Pool)", detail: "Bugün yetişmeyecek diğer görevleri vicdan azabı çekmeden haftalık havuza gönder." },
      { step: "4. Adım", action: "Hafta Sonuna Dağıt", detail: "'Takvime Otomatik Dağıt' butonundan 'Yalnızca Hafta Sonu' filtresini seç ve boşluklara yerleştir." },
    ],
  },
];

const faqItems = [
  {
    q: "Sayfa aralıkları kişisel alan mıdır? Sistem oraya zorla veya izinsiz bir şeyler ekler mi?",
    a: "Kesinlikle hayır. Sayfa aralıkları ve pinli belgeler bölümü tamamen kullanıcının kişisel çalışma alanıdır. Sistem buraya zorla veya habersizce içerik ya da kitap eklemez. Yapay zeka yalnızca kullanıcı açıkça talep ederse öneride bulunur. Sayfa aralıklarını tek tek silebilir veya dilediğin an topluca temizleyebilirsin.",
  },
  {
    q: "Google PDF arama sonuçları güvenli midir? Harici sitelere yönlendirir mi?",
    a: "Arama motoru doğrudan Google Books API ve doğrulanmış açık akademik/kamusal PDF kaynaklarını tarar. Arama sonuçları harici pop-up'lara yönlendirmeden doğrudan sistem içindeki güvenli kartlarda listelenir. Bulduğun kitabı tek tıkla kişisel kütüphanene ekleyebilir veya PDF bağlantısını doğrudan inceleyebilirsin.",
  },
  {
    q: "Google NotebookLM kullanmak yasal mıdır? Planorth ile nasıl çalışır?",
    a: "Evet, Google NotebookLM; Google'ın resmi, güvenli ve yasal yapay zeka araştırma asistanıdır. Kendi ders notlarınızı, okuma özetlerinizi veya açık kaynaklı dokümanları NotebookLM'e yükleyerek soru sormak, özet çıkarmak veya sesli genel bakış (Audio Overview) oluşturmak tamamen yasaldır. Planorth, seçtiğiniz kaynakları NotebookLM'e tek tıkla yapıştırmaya hazır Markdown paketi haline getirir.",
  },
  {
    q: "Görevler yetişmezse ceza puanı veya borç birikir mi?",
    a: "Hayır! Planorth felsefesinin temel taşı 'Suçluluksuz ve Borçsuz Akış'tır. Yetişmeyen görevler kırmızı negatif puan veya vicdani borç yaratmaz. Görevi tek tıkla yarı yarıya küçültebilir (Shrink), başka bir güne erteleyebilir (Postpone) veya haftalık havuza bırakabilirsin.",
  },
  {
    q: "Verilerim nerede saklanıyor, gizlilik nasıl korunuyor?",
    a: "Uygulama yerel modda çalışırken tüm verilerin yalnızca tarayıcının kendi belleğinde (localStorage) saklanır. Firebase ile giriş yaptığında ise verilerin Google Cloud Firestore üzerinde yalnızca senin kullanıcı kimliğine (users/{uid}) özel izole alanda saklanır ve üçüncü şahıslarla asla paylaşılmaz. İstediğin an tüm verilerini Profil sekmesinden JSON olarak indirebilir veya silebilirsin.",
  },
  {
    q: "Telefon, tablet ve bilgisayar ekranlarında görünüm nasıl uyarlandı?",
    a: "Planorth tam duyarlı (responsive) mimariye sahiptir: Telefonlarda alt gezinme çubuğu ile tek elle kullanım sağlanır; tabletlerde çift sütunlu rahat okuma sunulur; masaüstünde ise Odak Kokpiti scrollsüz 100vh kilitli ve Haftalık Plan 7 sütunlu geniş ekranda çalışır.",
  },
];

const philosophyRules = [
  {
    title: "1. Tek Anlamlı Öncelik Kuralı",
    desc: "Aynı anda 5 farklı işle uğraşmak derinleşmeyi engeller. Planorth o an sadece tek bir görevi önüne getirir.",
  },
  {
    title: "2. Suçluluksuz ve Borçsuz Akış",
    desc: "Hayat beklenmedik durumlarla doludur. Planına sadık kalamadığında görev borcu birikmez; sistem nazikçe yeniden hizalar.",
  },
  {
    title: "3. Kişisel Alan Dokunulmazlığı",
    desc: "Sayfa aralıkları ve çalışma masan tamamen sana aittir. Sistem izinsiz ve dayatmacı içerik eklemez.",
  },
  {
    title: "4. Kanıta Dayalı İlerleme",
    desc: "İlerleme süslü yüzdelerden değil; harcanan gerçek odak dakikalarından, çözülen lablardan ve somut kanıtlardan gelir.",
  },
];

const readyCommands = [
  "“Bugün için bana tek bir ana öncelik belirle.”",
  "“Bu görevi tamamlayamadım, lütfen yarı yarıya küçült.”",
  "“Son bir haftalık odak verilerimi ve tutarlılığımı analiz et.”",
  "“Önümüzdeki vize sınavım için elimdeki ders notlarını incele ve 2 haftalık kamp kur.”",
  "“Geceleri odaklanmakta zorlanıyorum, akşam saatlerine yalnızca hafif okuma koy.”",
  "“Hafta içi seanslarımı 45 dakika ile sınırla, derin işi hafta sonuna koy.”",
];

export function UserGuide() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("sections");

  // Filter guide tabs based on search
  const filteredGuideTabs = useMemo(() => {
    if (!searchQuery.trim()) return guideTabs;
    const q = searchQuery.toLowerCase();
    return guideTabs.filter(
      (item) =>
        item.tab.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.details.toLowerCase().includes(q) ||
        item.points.some(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.desc.toLowerCase().includes(q) ||
            p.subBullets?.some((sb) => sb.toLowerCase().includes(q))
        )
    );
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. HERO & QUICK LAUNCH BANNER */}
      <Card className="border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-background overflow-hidden relative shadow-lg">
        <div className="absolute -top-20 -right-20 size-60 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-primary text-primary-foreground grid place-items-center shrink-0 shadow-md">
                <NorthCoachSymbol size={26} variant="symbol" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg sm:text-xl font-extrabold text-foreground">
                    Planorth Kullanım &amp; Sistem Kılavuzu
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
                    v2.4 Güncel
                  </Badge>
                </div>
                <CardDescription className="text-xs sm:text-sm mt-0.5">
                  Tüm sekmelerin, ritüellerin, araştırma merkezinin ve yapay zeka koçluk sisteminin ayrıntılı rehberi.
                </CardDescription>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => startPlanorthTour(0)}
              className="rounded-xl font-bold shadow-md h-10 px-4 text-xs gap-2 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Sparkles className="size-4 animate-pulse" />
              İnteraktif Turu Başlat
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rehberde ara: örn. Google PDF, NotebookLM, Sınav Kampı, Hafta sonu, Shrink..."
                className="pl-9 h-9 text-xs rounded-xl bg-background/80"
              />
            </div>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="text-xs h-9 text-muted-foreground hover:text-foreground shrink-0"
              >
                Filtreyi Temizle
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. NAVIGATION SUB-TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto p-1 bg-muted/40 rounded-xl">
          <TabsTrigger value="sections" className="text-xs py-2 rounded-lg gap-1.5">
            <Compass className="size-3.5" /> Sistem Sekmeleri (9 Bölüm)
          </TabsTrigger>
          <TabsTrigger value="workflows" className="text-xs py-2 rounded-lg gap-1.5">
            <Zap className="size-3.5" /> İş Akışları (Workflows)
          </TabsTrigger>
          <TabsTrigger value="faq" className="text-xs py-2 rounded-lg gap-1.5">
            <CircleHelp className="size-3.5" /> Sıkça Sorulan Sorular (SSS)
          </TabsTrigger>
          <TabsTrigger value="philosophy" className="text-xs py-2 rounded-lg gap-1.5">
            <Target className="size-3.5" /> Felsefe &amp; AI Komutları
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: SECTIONS (9 TABS DETAILED) */}
        <TabsContent value="sections" className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="size-4 text-primary" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Sistem Modülleri &amp; Sekme Kılavuzu
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              {filteredGuideTabs.length} / {guideTabs.length} Bölüm
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredGuideTabs.map((item, index) => {
              const ItemIcon = item.icon;
              return (
                <Card
                  key={item.tab}
                  className="border border-border/80 bg-card hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <CardHeader className="pb-2.5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className={cn("size-8 rounded-xl border grid place-items-center shrink-0", item.color)}>
                        <ItemIcon className="size-4" />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {item.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      {item.tab}
                    </CardTitle>
                    <CardDescription className="text-xs leading-snug">
                      {item.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs pt-1">
                    <div className="space-y-2.5 border-t border-border/50 pt-2.5">
                      {item.points.map((pt, pIdx) => (
                        <div key={pIdx} className="space-y-1">
                          <p className="font-semibold text-foreground text-[11px] flex items-center gap-1.5">
                            <Check className="size-3 text-primary shrink-0" />
                            {pt.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed pl-4">
                            {pt.desc}
                          </p>
                          {pt.subBullets && pt.subBullets.length > 0 && (
                            <ul className="pl-6 space-y-0.5 pt-0.5">
                              {pt.subBullets.map((sb, sbIdx) => (
                                <li key={sbIdx} className="text-[10px] text-muted-foreground list-disc">
                                  {sb}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>

                    {item.proTip && (
                      <div className="rounded-lg bg-primary/5 border border-primary/15 p-2 text-[10px] text-muted-foreground flex items-start gap-1.5">
                        <Info className="size-3 text-primary shrink-0 mt-0.5" />
                        <span><strong>İpucu:</strong> {item.proTip}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                      <Button asChild variant="ghost" size="xs" className="text-[11px] h-7 px-2 text-primary">
                        <Link href={item.route}>
                          Sekmeye Git <ArrowRight className="size-3 ml-1" />
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => startPlanorthTour(index === 0 ? 1 : index + 1)}
                        className="text-[10px] h-7 px-2 text-muted-foreground hover:text-foreground"
                      >
                        Turu Buradan Aç
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 2: WORKFLOWS (NASIL YAPILIR) */}
        <TabsContent value="workflows" className="space-y-4 pt-1">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="size-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Adım Adım Gerçek Hayat İş Akışları
            </h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {workflows.map((flow) => {
              const FlowIcon = flow.icon;
              return (
                <Card key={flow.title} className="border border-border/80 bg-card flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30">
                        {flow.badge}
                      </Badge>
                      <FlowIcon className="size-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      {flow.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="space-y-2 border-t border-border/50 pt-3">
                      {flow.steps.map((st, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-2.5 text-xs">
                          <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded shrink-0">
                            {st.step}
                          </span>
                          <div className="space-y-0.5">
                            <p className="font-semibold text-foreground text-[11px]">{st.action}</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">{st.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 3: FAQ */}
        <TabsContent value="faq" className="space-y-4 pt-1">
          <div className="flex items-center gap-2 mb-2">
            <CircleHelp className="size-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Sıkça Sorulan Sorular &amp; Kritik Açıklamalar
            </h3>
          </div>

          <div className="grid gap-3">
            {faqItems.map((item, idx) => (
              <details
                key={idx}
                className="group rounded-xl border border-border/70 bg-card p-3.5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all hover:border-primary/40 open:bg-muted/10"
              >
                <summary className="flex items-center justify-between gap-3 text-xs font-bold text-foreground select-none">
                  <span className="flex items-center gap-2">
                    <span className="text-primary font-mono text-[11px]">Q{idx + 1}.</span>
                    {item.q}
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="mt-2.5 pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground leading-relaxed pl-6">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </TabsContent>

        {/* TAB 4: PHILOSOPHY & COMMANDS */}
        <TabsContent value="philosophy" className="space-y-5 pt-1">
          <div className="grid gap-5 lg:grid-cols-2">
            {/* PHILOSOPHY */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Target className="size-4 text-primary" /> Planorth Felsefesi &amp; Kuralları
                </CardTitle>
                <CardDescription className="text-xs">
                  Sistemi diğer üretkenlik araçlarından ayıran 4 temel ilke.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {philosophyRules.map((rule) => (
                  <div key={rule.title} className="rounded-xl border bg-muted/20 p-3 space-y-1">
                    <h4 className="text-xs font-bold text-foreground">{rule.title}</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{rule.desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* READY COMMANDS & RHYTHM */}
            <div className="space-y-5">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" /> Planorth Koç Hazır Komutları
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Koç ile konuşurken bu cümleleri doğrudan kullanabilirsin.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {readyCommands.map((cmd, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 p-2.5 text-xs text-foreground font-medium flex items-center justify-between gap-2"
                    >
                      <span className="truncate">{cmd}</span>
                      <Button asChild size="xs" variant="ghost" className="shrink-0 h-6 px-2 text-[10px]">
                        <Link href="/coach">Danış</Link>
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Clock3 className="size-4 text-primary" /> Önerilen Günlük &amp; Haftalık Ritim
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Flame className="size-3.5 text-amber-500" /> Her Sabah (2 dk)
                    </span>
                    <span className="font-semibold text-foreground">Sabah Pusulası ile Tek Öncelik Seç</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Play className="size-3.5 text-emerald-500" /> Çalışma Anında
                    </span>
                    <span className="font-semibold text-foreground">Odak Kokpiti &amp; Ses Mikseri</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="size-3.5 text-blue-500" /> Her Akşam (2 dk)
                    </span>
                    <span className="font-semibold text-foreground">Günü Kapat &amp; Suçluluksuz Devret</span>
                  </div>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Compass className="size-3.5 text-purple-500" /> Her Pazar (10 dk)
                    </span>
                    <span className="font-semibold text-foreground">Pazar Değerlendirme Ritüeli</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
