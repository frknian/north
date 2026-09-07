import type { DomainQuestion } from "./domain-catalog";

export type LanguageCode = "english" | "german" | "french" | "japanese" | "arabic";
export type LanguageLevel = "beginner" | "intermediate" | "advanced";

export interface LanguageLevelMeta {
  code: LanguageLevel;
  label: string;
  cefr: string;
  description: string;
}

export interface LanguageInfo {
  code: LanguageCode;
  id: string;
  name: string;
  nativeName: string;
  flag: string;
  aliases: string[];
  levels: Record<LanguageLevel, LanguageLevelMeta>;
  resources: { title: string; url: string; badge: "Platform" | "Döküman" | "Rehber"; description: string }[];
  dictionaries: { name: string; url: string }[];
  defaultGoals: Record<LanguageLevel, string[]>;
  questions: Record<LanguageLevel, DomainQuestion[]>;
}

const options = (a: string, b: string, c: string) => [
  { value: "a", label: a },
  { value: "b", label: b },
  { value: "c", label: c },
];

export const supportedLanguages: Record<LanguageCode, LanguageInfo> = {
  english: {
    code: "english",
    id: "english",
    name: "İngilizce",
    nativeName: "English",
    flag: "🇬🇧",
    aliases: ["ingilizce", "english", "ing", "ielts", "toefl", "yds"],
    levels: {
      beginner: { code: "beginner", label: "Başlangıç (A1 - A2)", cefr: "A1-A2", description: "Temel kelimeler, günlük selamlaşmalar ve basit zaman çekimleri." },
      intermediate: { code: "intermediate", label: "Orta (B1 - B2)", cefr: "B1-B2", description: "Akıcı günlük diyaloglar, bağlaçlar, phrasal verb ve şart cümleleri." },
      advanced: { code: "advanced", label: "İleri (C1 - C2)", cefr: "C1-C2", description: "Devrik yapılar, akademik kelimeler, deyimsel incelikler ve nüanslar." },
    },
    resources: [
      { title: "BBC Learning English", url: "https://www.bbc.co.uk/learningenglish", badge: "Platform", description: "6 dakikalık İngilizce ses kayıtları, haberler ve gramer serileri." },
      { title: "Cambridge Dictionary", url: "https://dictionary.cambridge.org/", badge: "Döküman", description: "İngilizce-Türkçe ve tek dilli sözlük, telaffuz sesleri ve eşdizimlilikler." },
      { title: "British Council LearnEnglish", url: "https://learnenglish.britishcouncil.org/", badge: "Rehber", description: "A1-C1 seviyelerine göre dinleme ve okuma pratikleri." },
    ],
    dictionaries: [
      { name: "Cambridge Dictionary", url: "https://dictionary.cambridge.org/" },
      { name: "Oxford Learner's Dictionaries", url: "https://www.oxfordlearnersdictionaries.com/" },
    ],
    defaultGoals: {
      beginner: ["A1-A2 temel gramer ve ilk 500 kelimeyi tamamlamak", "Günlük basit diyalogları rahatça kurabilmek", "Yurt dışı seyahatinde temel ihtiyaçları anlatabilmek"],
      intermediate: ["B2 seviyesinde akıcı konuşma ve düşünme pratiği yapmak", "İş İngilizcesi: Profesyonel e-posta ve sunum yapabilmek", "IELTS / TOEFL hazırlığı için altyapı oluşturmak"],
      advanced: ["C1-C2 düzeyinde nüanslı ve akademik makaleler yazabilmek", "Ana dili İngilizce olanlarla tam akıcı tartışabilmek", "Resmi dil sınavında (IELTS 7.5+ / TOEFL 100+) zirveye ulaşmak"],
    },
    questions: {
      beginner: [
        {
          id: "en-beg-1",
          prompt: "Which sentence is grammatically correct for a daily routine?",
          options: options("She goes to work by bus every morning.", "She go to work by bus every morning.", "She is go to work by bus every morning."),
          correct: "a",
          subTopic: "Present Simple (Geniş Zaman)",
          explanation: "Geniş zamanda 3. tekil şahıs (he/she/it) için fiile -s/-es takısı gelir (goes).",
          recommendedReview: "Geniş zaman 3. tekil şahıs fiil çekimlerini tekrar et.",
        },
        {
          id: "en-beg-2",
          prompt: "'I haven't got ___ milk left in the fridge.' Boşluğa hangisi gelmelidir?",
          options: options("any", "some", "many"),
          correct: "a",
          subTopic: "Quantifiers (Some / Any)",
          explanation: "Olumsuz cümlelerde sayılamayan ve çoğul isimlerle 'any' kullanılır.",
          recommendedReview: "Some ve any kullanım kurallarını örnek cümlelerle çalış.",
        },
        {
          id: "en-beg-3",
          prompt: "'Where ___ you yesterday evening at 8 PM?'",
          options: options("were", "was", "did"),
          correct: "a",
          subTopic: "Past Simple of To Be",
          explanation: "'You' öznesi için geçmiş zamanda 'to be' fiili 'were' halini alır.",
          recommendedReview: "Was / were geçmiş zaman çekim tablosunu gözden geçir.",
        },
        {
          id: "en-beg-4",
          prompt: "'She is very interested ___ learning modern UI design.' Hangi edat (preposition) uygundur?",
          options: options("in", "at", "on"),
          correct: "a",
          subTopic: "Prepositions (İlgi Edatları)",
          explanation: "'Interested in' bir alana ilgi duymayı anlatan sabit edattır.",
          recommendedReview: "Sık kullanılan sıfat + edat kalıplarını (interested in, good at) ezberle.",
        },
      ],
      intermediate: [
        {
          id: "en-int-1",
          prompt: "'If I ___ more free time, I would travel around the world.' (Type 2 Conditional)",
          options: options("had", "have", "would have"),
          correct: "a",
          subTopic: "Conditionals (Şart Cümleleri)",
          explanation: "Type 2 Conditional şimdiki zamanla ilgili varsayımları anlatır: If + Past Simple, would + Verb.",
          recommendedReview: "Type 2 ve Type 3 Conditional yapılarının farklarını incele.",
        },
        {
          id: "en-int-2",
          prompt: "'The flight was delayed ___ the severe thunderstorm.' Hangi bağlaç uygundur?",
          options: options("due to", "because", "although"),
          correct: "a",
          subTopic: "Linking Words (Neden-Sonuç Bağlaçları)",
          explanation: "'Due to' ardından isim veya isim öbeği alır; 'because' ise tam cümle gerektirir.",
          recommendedReview: "Due to, because of ve although bağlaçlarının kullanımını tekrar et.",
        },
        {
          id: "en-int-3",
          prompt: "'I look forward to ___ from you soon.' Hangi fiil formu doğrudur?",
          options: options("hearing", "hear", "heard"),
          correct: "a",
          subTopic: "Gerunds after Prepositions",
          explanation: "'Look forward to' ifadesindeki 'to' bir edattır (preposition); edatlardan sonra fiil -ing alır.",
          recommendedReview: "To edatıyla bitip gerund alan kalıpları (look forward to, be used to) çalış.",
        },
        {
          id: "en-int-4",
          prompt: "'By the time we arrived at the station, the train ___.'",
          options: options("had already departed", "already departed", "has already departed"),
          correct: "a",
          subTopic: "Past Perfect Tense",
          explanation: "Geçmişte başka bir eylemden daha önce tamamlanan olaylar için Past Perfect (had + V3) kullanılır.",
          recommendedReview: "Past Simple ile Past Perfect arasındaki zaman ilişkilerini çalış.",
        },
      ],
      advanced: [
        {
          id: "en-adv-1",
          prompt: "'Seldom ___ such remarkable dedication in a junior researcher.' (Inversion / Devrik Cümle)",
          options: options("have I witnessed", "I have witnessed", "I witnessed"),
          correct: "a",
          subTopic: "Negative Inversion (Devrik Cümle)",
          explanation: "'Seldom', 'rarely', 'scarcely' gibi olumsuzluk zarfları başa geldiğinde cümle soru formu gibi devrik kurulur.",
          recommendedReview: "İngilizcede devrik cümle (inversion) kalıpları üzerine alıştırma yap.",
        },
        {
          id: "en-adv-2",
          prompt: "'The board accepted the director's decision to ___ his resignation.'",
          options: options("tender", "dispatch", "demote"),
          correct: "a",
          subTopic: "Collocations & Formal Register",
          explanation: "Resmi İngilizcede istifa sunmak 'to tender one's resignation' kalıbıyla ifade edilir.",
          recommendedReview: "C1-C2 kurumsal ve resmi eşdizimlilikleri (collocations) not al.",
        },
        {
          id: "en-adv-3",
          prompt: "'Had it not been for your timely advice, the project ___ completely.' (Conditional inversion)",
          options: options("would have failed", "will fail", "had failed"),
          correct: "a",
          subTopic: "Third Conditional Inversion",
          explanation: "'Had it not been for' (Type 3 devrik), ana cümlede 'would have + V3' gerektirir.",
          recommendedReview: "Devrik şart yapılarını (Had I known, Were you to) tekrar et.",
        },
        {
          id: "en-adv-4",
          prompt: "'Her thesis was supported by such ___ arguments that the committee approved it without dispute.'",
          options: options("cogent", "redundant", "equivocal"),
          correct: "a",
          subTopic: "Advanced Academic Vocabulary",
          explanation: "'Cogent' mantıksal olarak güçlü, ikna edici ve çürütülemez savları ifade eder.",
          recommendedReview: "Akademik sav ve argümantasyon kelime dağarcığını zenginleştir.",
        },
      ],
    },
  },

  german: {
    code: "german",
    id: "german",
    name: "Almanca",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    aliases: ["almanca", "deutsch", "german", "goethe", "telc"],
    levels: {
      beginner: { code: "beginner", label: "Başlangıç (A1 - A2)", cefr: "A1-A2", description: "Artikel (der/die/das), temel fiil çekimleri ve günlük tanışma kalıpları." },
      intermediate: { code: "intermediate", label: "Orta (B1 - B2)", cefr: "B1-B2", description: "Dativ/Akkusativ ayrımı, yan cümleler (weil/obwohl), Perfekt ve Konjunktiv II." },
      advanced: { code: "advanced", label: "İleri (C1 - C2)", cefr: "C1-C2", description: "Passiv, Partizipialkonstruktionen, Nomen-Verb-Verbindungen ve deyimsel akıcılık." },
    },
    resources: [
      { title: "Deutsche Welle — Deutsch Lernen", url: "https://learngerman.dw.com/", badge: "Platform", description: "Nicos Weg ve seviyelere ayrılmış ücretsiz etkileşimli Almanca kursları." },
      { title: "Goethe-Institut Deutsch Üben", url: "https://www.goethe.de/", badge: "Rehber", description: "Resmi sertifika sınavı denemeleri, dinleme ve okuma alıştırmaları." },
      { title: "Duden Wörterbuch", url: "https://www.duden.de/", badge: "Döküman", description: "Almanca kelime anlamları, artikeller ve çekim tabloları resmi kaynağı." },
    ],
    dictionaries: [
      { name: "Duden", url: "https://www.duden.de/" },
      { name: "PONS Wörterbuch", url: "https://de.pons.com/" },
    ],
    defaultGoals: {
      beginner: ["A1-A2 temel grameri ve artikelleri (der/die/das) öğrenmek", "Günlük hayatta kendini tanıtıp basit sipariş verebilmek", "Almanca A2 Goethe sınavına hazırlanmak"],
      intermediate: ["B2 seviyesinde akıcı konuşma ve telefon diyalogları yürütmek", "Almanya'da iş veya denklik süreçlerinde mülakatlara hazırlanmak", "TestDaF veya Goethe B2 sınavını geçmek"],
      advanced: ["C1 düzeyinde akademik veya mesleki raporlar hazırlamak", "Nüanslı ve deyimsel Almanca ile ana dili gibi iletişim kurmak", "Almanya'da üniversite veya tam profesyonel kariyer seviyesine ulaşmak"],
    },
    questions: {
      beginner: [
        {
          id: "de-beg-1",
          prompt: "'Der Tisch, das Buch, ___ Lampe.' Boşluğa dişil (feminin) artikel olarak hangisi gelmelidir?",
          options: options("die", "der", "das"),
          correct: "a",
          subTopic: "Bestimmter Artikel (Artikeller)",
          explanation: "Almancada 'Lampe' dişil bir kelimedir ve belirli tekil artikeli 'die'dır.",
          recommendedReview: "En sık kullanılan 100 kelimenin artikellerini renklerle kodlayarak çalış.",
        },
        {
          id: "de-beg-2",
          prompt: "'Woher ___ du?' (kommen fiilinin şimdiki zaman çekimi)",
          options: options("kommst", "kommt", "kommen"),
          correct: "a",
          subTopic: "Präsens Konjugation (Fiil Çekimi)",
          explanation: "'Du' (sen) öznesi için düzenli fiil köküne '-st' takısı eklenir: du kommst.",
          recommendedReview: "Düzenli fiil çekim eklerini (ich -e, du -st, er/sie/es -t) tekrar et.",
        },
        {
          id: "de-beg-3",
          prompt: "'Ich habe gestern einen interessanten Film ___.' (Perfekt zaman)",
          options: options("gesehen", "gesehen habe", "sehe"),
          correct: "a",
          subTopic: "Perfekt & Partizip II",
          explanation: "Almancada Perfekt yapısında Partizip II biçimi cümlenin en sonuna yerleştirilir (gesehen).",
          recommendedReview: "Düzensiz fiillerin Partizip II hallerini (sehen -> gesehen) ezberle.",
        },
        {
          id: "de-beg-4",
          prompt: "'Ich trinke ___ Kaffee, sondern Tee.' (Olumsuzluk Bildirme)",
          options: options("keinen", "nicht", "nein"),
          correct: "a",
          subTopic: "Negation (Kein / Nicht)",
          explanation: "Artikelsiz eril bir ismi nesne konumunda (Akkusativ) olumsuz yaparken 'keinen' kullanılır.",
          recommendedReview: "Nicht ve kein kullanım farklarını örnek cümlelerle çalış.",
        },
      ],
      intermediate: [
        {
          id: "de-int-1",
          prompt: "'Ich lerne fleißig Deutsch, ___ ich in Deutschland arbeiten möchte.' (Bağlaç ve fiil sırası)",
          options: options("weil", "denn", "deshalb"),
          correct: "a",
          subTopic: "Nebensätze (Weil / Denn)",
          explanation: "'Weil' yan cümle (Nebensatz) oluşturur ve çekimli yardımcı fiili (möchte) cümlenin sonuna atar.",
          recommendedReview: "Weil, dass ve obwohl bağlaçlarının yan cümle fiil konumunu çalış.",
        },
        {
          id: "de-int-2",
          prompt: "'Ich helfe ___ alten Mann beim Tragen der Taschen.' (Dativ Hali)",
          options: options("dem", "den", "der"),
          correct: "a",
          subTopic: "Dativobjekt (Dativ Hali)",
          explanation: "'Helfen' fiili her zaman Dativ nesne alır; eril 'der Mann' Dativ'de 'dem Mann' olur.",
          recommendedReview: "Dativ alan fiilleri (helfen, danken, gefallen) listele.",
        },
        {
          id: "de-int-3",
          prompt: "'Wenn ich mehr Zeit hätte, ___ ich jeden Tag Sport machen.' (Konjunktiv II)",
          options: options("würde", "werde", "wurde"),
          correct: "a",
          subTopic: "Konjunktiv II (Dilek ve Şart)",
          explanation: "Dilek ve hayali durumlar için 'würde + Mastar' yapısı kullanılır.",
          recommendedReview: "Konjunktiv II 'hätte', 'wäre' ve 'würde' formlarını tekrar et.",
        },
        {
          id: "de-int-4",
          prompt: "'Er freut sich sehr ___ seine bevorstehende Reise nach Wien.'",
          options: options("auf", "über", "an"),
          correct: "a",
          subTopic: "Verben mit Präpositionen (Edatlı Fiiller)",
          explanation: "Gelecekteki bir olaya sevinmek/sabırsızlanmak 'sich freuen auf (+Akk)' kalıbıdır.",
          recommendedReview: "Sich freuen auf (gelecek) ve sich freuen über (geçmiş/şimdiki) ayrımını incele.",
        },
      ],
      advanced: [
        {
          id: "de-adv-1",
          prompt: "'Die Ursachen des Problems wurden von der Kommission ausführlich ___.'",
          options: options("erörtert", "aufgegeben", "verpasst"),
          correct: "a",
          subTopic: "Gehobener Wortschatz (İleri Kelime)",
          explanation: "'Erörtern' bilimsel ve etraflıca tartışmak/incelemek anlamına gelen C1 seviye fiildir.",
          recommendedReview: "Akademik Almancada sık geçen tartışma fiillerini çalış.",
        },
        {
          id: "de-adv-2",
          prompt: "'___ der schwierigen Wetterbedingungen landete das Flugzeug pünktlich.' (Genitiv Edatı)",
          options: options("Ungeachtet", "Trotzdem", "Weil"),
          correct: "a",
          subTopic: "Genitiv-Präpositionen",
          explanation: "'Ungeachtet' (-e bakılmaksızın / -e rağmen) Genitiv alan ileri seviye bir edattır.",
          recommendedReview: "Wegen, infolge, anlässlich ve ungeachtet Genitiv edatlarını çalış.",
        },
        {
          id: "de-adv-3",
          prompt: "'Es steht völlig außer ___, dass diese Maßnahme notwendig war.' (Redewendung)",
          options: options("Zweifel", "Frage", "Kritik"),
          correct: "a",
          subTopic: "Feste Wendungen (Kalıplaşmış Deyimler)",
          explanation: "'Außer Zweifel stehen' şüpheye yer bırakmamak, kesin olmak anlamına gelir.",
          recommendedReview: "C1 seviyesi Nomen-Verb-Verbindungen listesini tekrar et.",
        },
        {
          id: "de-adv-4",
          prompt: "'Die von der Regierung zu ___ Maßnahmen erfordern erhebliche Investitionen.' (Gerundivum)",
          options: options("treffenden", "getroffenen", "treffen"),
          correct: "a",
          subTopic: "Partizipialkonstruktionen & Gerundivum",
          explanation: "'zu + Partizip I' yapısı alınması gereken / zorunlu eylemleri sıfat tamlaması olarak niteler.",
          recommendedReview: "Genişletilmiş sıfat tamlamalarını (erweiterte Partizipien) incele.",
        },
      ],
    },
  },

  french: {
    code: "french",
    id: "french",
    name: "Fransızca",
    nativeName: "Français",
    flag: "🇫🇷",
    aliases: ["fransızca", "french", "français", "delf", "dalf"],
    levels: {
      beginner: { code: "beginner", label: "Başlangıç (A1 - A2)", cefr: "A1-A2", description: "Être/avoir, le/la artikelleri, temel şimdiki zaman ve günlük tanışma cümleleri." },
      intermediate: { code: "intermediate", label: "Orta (B1 - B2)", cefr: "B1-B2", description: "Passé Composé vs Imparfait, ilgi zamirleri (dont/qui/que) ve Subjonctif temelleri." },
      advanced: { code: "advanced", label: "İleri (C1 - C2)", cefr: "C1-C2", description: "Subjonctif passé, concordances des temps, deyimsel ifadeler ve edebi nüanslar." },
    },
    resources: [
      { title: "TV5Monde — Apprendre le Français", url: "https://apprendre.tv5monde.com/", badge: "Platform", description: "Videolu haberler ve A1-B2 seviyelerine göre interaktif Fransızca dersleri." },
      { title: "RFI Savoirs — Français Facile", url: "https://francaisfacile.rfi.fr/", badge: "Rehber", description: "Yavaş ve anlaşılır Fransızca haber podcastleri ve dinleme alıştırmaları." },
      { title: "Larousse Dictionnaire", url: "https://www.larousse.fr/", badge: "Döküman", description: "Fransızca kelime anlamları, deyimler ve eş anlamlılar sözlüğü." },
    ],
    dictionaries: [
      { name: "Larousse", url: "https://www.larousse.fr/" },
      { name: "Le Robert", url: "https://dictionnaire.lerobert.com/" },
    ],
    defaultGoals: {
      beginner: ["A1-A2 temel dilbilgisini ve günlük 300 kelimeyi tamamlamak", "Fransa seyahatinde veya kafede sipariş verip yol sorabilmek", "DELF A2 sınavına hazırlanmak"],
      intermediate: ["B2 düzeyinde akıcı konuşma ve tartışma becerisi kazanmak", "Fransızca podcastleri ve romanları sözlüksüz takip edebilmek", "DELF B2 sertifikası alarak eğitim veya iş başvurusu yapmak"],
      advanced: ["C1 seviyesinde akademik analiz ve edebi metinler yazabilmek", "Fransızca mülakat ve münazaralarda üst düzey akıcılık sağlamak", "DALF C1 diploması hedefine ulaşmak"],
    },
    questions: {
      beginner: [
        {
          id: "fr-beg-1",
          prompt: "'Nous ___ très contents de vous rencontrer.' (Être fiili şimdiki zaman çekimi)",
          options: options("sommes", "êtes", "sont"),
          correct: "a",
          subTopic: "Verbe Être au Présent",
          explanation: "'Nous' (biz) şahsı için être fiilinin çekimi 'sommes'dur.",
          recommendedReview: "Être ve avoir fiillerinin şimdiki zaman çekim tablosunu ezberle.",
        },
        {
          id: "fr-beg-2",
          prompt: "'Hier soir, j'ai ___ un bon café au restaurant.' (Passé composé)",
          options: options("bu", "bois", "boire"),
          correct: "a",
          subTopic: "Passé Composé (Geçmiş Zaman)",
          explanation: "'Boire' fiilinin Passé Composé partizipi 'bu'dur (j'ai bu).",
          recommendedReview: "Sık kullanılan düzensiz fiillerin geçmiş zaman partiziplerini çalış.",
        },
        {
          id: "fr-beg-3",
          prompt: "'___ maison est très ancienne et charmante.' (İşaret sıfatı)",
          options: options("Cette", "Ce", "Cet"),
          correct: "a",
          subTopic: "Adjectifs Démonstratifs (İşaret Sıfatları)",
          explanation: "'Maison' dişil (feminin) bir kelimedir; dişil tekillerde 'Cette' kullanılır.",
          recommendedReview: "Ce, cet, cette, ces işaret sıfatı kurallarını tekrar et.",
        },
        {
          id: "fr-beg-4",
          prompt: "'J'habite ___ Paris, ___ France.' (Şehir ve Ülke Edatları)",
          options: options("à / en", "en / à", "au / dans"),
          correct: "a",
          subTopic: "Prépositions de Lieu (Yer Edatları)",
          explanation: "Şehir adlarının önüne 'à', dişil ülke adlarının önüne 'en' gelir.",
          recommendedReview: "Ülkelerin cinsiyetine göre (en France, au Japon) edat kurallarını çalış.",
        },
      ],
      intermediate: [
        {
          id: "fr-int-1",
          prompt: "'Pendant que je lisais tranquillement, mon frère ___ dans la pièce.' (Imparfait vs Passé Composé)",
          options: options("est entré", "entrait", "avait entré"),
          correct: "a",
          subTopic: "Imparfait vs Passé Composé",
          explanation: "Süren bir eylemi (Imparfait) bölen ani ve tamamlanmış olaylar için Passé Composé kullanılır.",
          recommendedReview: "Imparfait (arka plan) ve Passé Composé (eylem) dengesini çalış.",
        },
        {
          id: "fr-int-2",
          prompt: "'C'est le collègue ___ je vous ai parlé la semaine dernière.' (Pronom relatif)",
          options: options("dont", "que", "qui"),
          correct: "a",
          subTopic: "Pronoms Relatifs (Dont / Que / Qui)",
          explanation: "'Parler de' (birinden bahsetmek) 'de' edatı aldığı için ilgi zamiri 'dont' olur.",
          recommendedReview: "Dont zamirinin kullanım kurallarını örnek cümlelerle pekiştir.",
        },
        {
          id: "fr-int-3",
          prompt: "'Il est indispensable que tu ___ tes devoirs avant de sortir.' (Subjonctif)",
          options: options("fasses", "fais", "feras"),
          correct: "a",
          subTopic: "Subjonctif Présent",
          explanation: "Gereklilik bildiren 'il est indispensable que' yapısı fiilin Subjonctif çekimini gerektirir (faire -> fasses).",
          recommendedReview: "Faire, aller, pouvoir fiillerinin Subjonctif çekimlerini çalış.",
        },
        {
          id: "fr-int-4",
          prompt: "'Si j'avais eu plus de temps, je vous ___ visite.' (Conditionnel passé)",
          options: options("aurais rendu", "avais rendu", "rendais"),
          correct: "a",
          subTopic: "Si + Plus-que-parfait (Conditionnel Passé)",
          explanation: "Geçmişte gerçekleşmemiş şartlar için 'Si + Plus-que-parfait ... Conditionnel Passé' yapısı kullanılır.",
          recommendedReview: "Fransızcada şart cümlelerinin (Si) üç temel kuralını gözden geçir.",
        },
      ],
      advanced: [
        {
          id: "fr-adv-1",
          prompt: "'Bien que ce projet ___ ambitieux, nous devons veiller aux dépenses.' (Subjonctif)",
          options: options("soit", "est", "sera"),
          correct: "a",
          subTopic: "Conjonctions avec Subjonctif",
          explanation: "'Bien que' (her ne kadar ... olsa da) bağlacı kesinlikle Subjonctif kip gerektirir (être -> soit).",
          recommendedReview: "Bien que, pour que, sans que bağlaçlarından sonra Subjonctif pratiği yap.",
        },
        {
          id: "fr-adv-2",
          prompt: "'Dans cette situation de crise, le ministre a su faire preuve d'un grand ___.'",
          options: options("sang-froid", "coup d'œil", "tête-à-tête"),
          correct: "a",
          subTopic: "Expressions Idiomatiques (Deyimsel İfadeler)",
          explanation: "'Faire preuve de sang-froid' panik yapmadan soğukkanlılığını koruyabilmek anlamına gelir.",
          recommendedReview: "C1-C2 deyim ve sabit söz kalıplarını çalışma defterine kaydet.",
        },
        {
          id: "fr-adv-3",
          prompt: "'Quoi qu'il en ___, nous prendrons la décision finale dès demain matin.'",
          options: options("soit", "est", "était"),
          correct: "a",
          subTopic: "Formules Figées (Kalıplaşmış Sözler)",
          explanation: "'Quoi qu'il en soit' (her halükarda, ne olursa olsun) deyimleşmiş bir Subjonctif formudur.",
          recommendedReview: "Fransızca edebi ve resmi kalıp ifadeleri tekrar et.",
        },
        {
          id: "fr-adv-4",
          prompt: "'Ses hésitations répétées ont jeté un ___ sur l'honnêteté de sa démarche.'",
          options: options("discrédit", "bénéfice", "regard"),
          correct: "a",
          subTopic: "Registre Soutenu (Edebi ve Resmi Dil)",
          explanation: "'Jeter le discrédit sur' güvenilirliği ve itibarı sarsmak anlamına gelen resmi bir tabirdir.",
          recommendedReview: "Akademik ve edebi Fransızca kelime dağarcığını zenginleştir.",
        },
      ],
    },
  },

  japanese: {
    code: "japanese",
    id: "japanese",
    name: "Japonca",
    nativeName: "日本語",
    flag: "🇯🇵",
    aliases: ["japonca", "japanese", "nihongo", "jlpt", "kanji", "hiragana", "katakana"],
    levels: {
      beginner: { code: "beginner", label: "Başlangıç (N5 - N4)", cefr: "A1-A2", description: "Hiragana, Katakana, temel parçacıklar (wa, ga, o, ni) ve desu/masu kibar çekimleri." },
      intermediate: { code: "intermediate", label: "Orta (N3)", cefr: "B1-B2", description: "Te-form bileşimleri, günlük konuşma kalıpları, 300+ temel Kanji ve akıcı diyaloglar." },
      advanced: { code: "advanced", label: "İleri (N2 - N1)", cefr: "C1-C2", description: "Resmi iş dili (Keigo), karmaşık gramer kalıpları, gazete/roman okuma ve JLPT N2/N1." },
    },
    resources: [
      { title: "NHK World-JAPAN — Easy Japanese", url: "https://www.nhk.or.jp/lesson/", badge: "Platform", description: "Sesli diyaloglar, günlük yaşam sahneleri ve temel Japonca dersleri." },
      { title: "Tae Kim's Guide to Japanese Grammar", url: "https://guidetojapanese.org/", badge: "Rehber", description: "Japonca dilbilgisini ezberletmeden mantığıyla anlatan eksiksiz açık kaynak." },
      { title: "Jisho Japanese Dictionary", url: "https://jisho.org/", badge: "Döküman", description: "Kanji vuruş sıraları, anlamları ve JLPT seviyelerine göre kelime arama motoru." },
    ],
    dictionaries: [
      { name: "Jisho.org", url: "https://jisho.org/" },
      { name: "Mazii Japanese", url: "https://mazii.net/" },
    ],
    defaultGoals: {
      beginner: ["Hiragana ve Katakana alfabelerini eksiksiz öğrenmek", "JLPT N5 seviyesinde 100 Kanji ve temel diyalogları kavramak", "Japonya seyahatinde temel iletişimi kurabilmek"],
      intermediate: ["JLPT N3 sınavını başarıyla geçmek", "Anime, dizi ve mangaları temel düzeyde altyazısız anlayabilmek", "Japonca arkadaş edinip akıcı günlük konuşma sürdürebilmek"],
      advanced: ["JLPT N2 veya N1 seviyesine ulaşarak Japonya'da kariyer yapmak", "Resmi iş ortamında saygılı dil (Keigo) ile akıcı iletişim kurmak", "Japonca akademik ve iş dokümanlarını rahatça okuyup yazmak"],
    },
    questions: {
      beginner: [
        {
          id: "ja-beg-1",
          prompt: "'わたし___ 田中（たなか）です。' Cümlede konuyu (topic) belirten parçacık hangisidir?",
          options: options("は (wa)", "を (o)", "へ (e)"),
          correct: "a",
          subTopic: "Topic Marker (は Parçacığı)",
          explanation: "Cümlenin ana konusunu belirtmek için 'は' (wa olarak okunur) parçacığı kullanılır.",
          recommendedReview: "Temel parçacıkların (wa, ga, o, ni, de) işlevlerini tekrar et.",
        },
        {
          id: "ja-beg-2",
          prompt: "'ほん を よみます。' Cümlesindeki 'よみます' fiilinin anlamı nedir?",
          options: options("Okumak (Kitap okurum)", "Yazmak", "Yemek yemek"),
          correct: "a",
          subTopic: "Temel Fiiller & Nesne Parçacığı (を)",
          explanation: "'Yomimasu' okumak fiilidir; 'hon o yomimasu' kitap okurum demektir.",
          recommendedReview: "N5 seviyesi ilk 20 temel fiili kibar çekimleriyle çalış.",
        },
        {
          id: "ja-beg-3",
          prompt: "'きのう ともだち に ___。' (Kibar geçmiş zaman çekimi)",
          options: options("あいました (aimashita)", "あいます (aimasu)", "あう (au)"),
          correct: "a",
          subTopic: "Past Polite Form (-mashita)",
          explanation: "Dün (kinou) gerçekleşen eylemler için kibar geçmiş zaman '-mashita' kullanılır (aimashita = buluştum).",
          recommendedReview: "-masu, -masen, -mashita, -masendeshita tablosunu tekrar et.",
        },
        {
          id: "ja-beg-4",
          prompt: "Yabancı dillerden geçen ödünç kelimeleri ve yabancı isimleri yazmak için hangi alfabe kullanılır?",
          options: options("Katakana (カタカナ)", "Hiragana (ひらがな)", "Kanji (漢字)"),
          correct: "a",
          subTopic: "Japon Yazı Sistemleri",
          explanation: "Katakana, yabancı dillerden alınan kelimeler ve isimler için kullanılan köşeli alfabedir.",
          recommendedReview: "Katakana tablosunu ve ses uzatma işaretini (ー) çalış.",
        },
      ],
      intermediate: [
        {
          id: "ja-int-1",
          prompt: "'いま としょかん で 本 を よんで ___。' (Devam eden eylem / Şimdiki zaman)",
          options: options("います (imasu)", "あります (arimasu)", "おきます (okimasu)"),
          correct: "a",
          subTopic: "Te-form + Imasu (Şimdiki Zaman)",
          explanation: "Fiilin Te-formu + imasu (-te imasu), şu anda devam eden eylemi belirtir.",
          recommendedReview: "Fiillerin Te-formu çekim kurallarını (ichidan/godan) çalış.",
        },
        {
          id: "ja-int-2",
          prompt: "'あめ が ふって も、サッカーのしあい に いきます。' Cümlesindeki '-te mo' yapısının anlamı nedir?",
          options: options("Yağmur yağsa bile gideceğim (-se bile / rağmen)", "Yağmur yağdığı için gideceğim", "Yağmur yağarsa gitmeyeceğim"),
          correct: "a",
          subTopic: "Kavramsal Bağlaçlar (-te mo)",
          explanation: "'-te mo' yapısı karşıtlık bildiren '-se bile / -e rağmen' anlamına gelir.",
          recommendedReview: "-te mo ve -tara şart yapılarının karşılaştırmasını incele.",
        },
        {
          id: "ja-int-3",
          prompt: "'日本語 を はなす ___ が できます。' (Yeterlilik yapısı)",
          options: options("こと (koto)", "もの (mono)", "とき (toki)"),
          correct: "a",
          subTopic: "Koto ga dekimasu (Yeterlilik)",
          explanation: "'Fiil sözlük hali + koto ga dekimasu' bir eylemi yapabilme yeterliliğini ifade eder.",
          recommendedReview: "İsimleştirme (koto / no) ve potansiyel fiil formlarını çalış.",
        },
        {
          id: "ja-int-4",
          prompt: "'あした の かいぎ の ため に、しりょう を コピーして ___。' (Önceden hazırlık yapıp bırakmak)",
          options: options("おきます (okimasu)", "しまいます (shimaimasu)", "みます (mimasu)"),
          correct: "a",
          subTopic: "Te-form + Oku (Ön Hazırlık)",
          explanation: "'-te oku' yapısı gelecekteki bir amaç için önceden hazırlık yapıp hazır tutmayı ifade eder.",
          recommendedReview: "-te oku, -te shimau ve -te miru yardımcı fiil kalıplarını çalış.",
        },
      ],
      advanced: [
        {
          id: "ja-adv-1",
          prompt: "İş ortamında müşteriye 'Birazdan geleceğim' derken hangi alçakgönüllü (kenjougo) ifade uygundur?",
          options: options("まもなく参ります (mairimasu)", "まもなく来ます (kimasu)", "まもなく行きます (ikimasu)"),
          correct: "a",
          subTopic: "Keigo (Kenjougo - Alçakgönüllü Dil)",
          explanation: "'Mairu', kuru/iku fiillerinin kenjougo halidir; kendi eylemini müşteriye karşı tevazu ile anlatır.",
          recommendedReview: "Sonkeigo (saygı) ile Kenjougo (tevazu) fiil eşleşmelerini çalış.",
        },
        {
          id: "ja-adv-2",
          prompt: "'彼はいかなる困難に直面しよう___、決して諦めない。' Boşluğa hangi ileri seviye bağlaç gelmelidir?",
          options: options("とも (tomo)", "から (kara)", "ので (node)"),
          correct: "a",
          subTopic: "İkoukei + Tomo (N1/N2 Grameri)",
          explanation: "'Fiil yönelim hali (ikoukei) + tomo' kalıbı 'ne denli ... olsa da / her ne olursa olsun' anlamına gelir.",
          recommendedReview: "JLPT N2/N1 karşıtlık ve varsayım bağlaçlarını tekrar et.",
        },
        {
          id: "ja-adv-3",
          prompt: "'プロの医師___、患者の命を最優先に考えるべきだ。'",
          options: options("たるもの (tarumono)", "だけに (dakeni)", "にしては (nishiteha)"),
          correct: "a",
          subTopic: "Tarumono (Unvana Yakışır Şekilde)",
          explanation: "'İsim + tarumono', '... olan bir kimseye yakışır şekilde / ... sıfatını taşıyan biri olarak' anlamı verir.",
          recommendedReview: "N1 seviyesindeki 'tarumono', 'to ie domo' kalıplarını çalış.",
        },
        {
          id: "ja-adv-4",
          prompt: "'多大なるご支援を賜り、誠に___。' (Resmi teşekkür ve minnet ifadesi)",
          options: options("恐れ入ります (osoreirimasu)", "すみません (sumimasen)", "ごめんなさい (gomennasai)"),
          correct: "a",
          subTopic: "İş Yazışmaları & Resmiyet",
          explanation: "'Osoreirimasu', resmi iş dilinde minnettarlık ve mahcubiyet ifade eden en saygın tabirdir.",
          recommendedReview: "Japonca kurumsal e-posta kalıplarını ve resmi teşekkür ifadelerini çalış.",
        },
      ],
    },
  },

  arabic: {
    code: "arabic",
    id: "arabic",
    name: "Arapça",
    nativeName: "العربية",
    flag: "🇸🇦",
    aliases: ["arapça", "arabic", "fasih arapça", "modern standart arapça", "sarf", "nahiv"],
    levels: {
      beginner: { code: "beginner", label: "Başlangıç (A1 - A2)", cefr: "A1-A2", description: "Harfler ve hareke mantığı, isim cümlesi (mübteda-haber) ve temel zamirler." },
      intermediate: { code: "intermediate", label: "Orta (B1 - B2)", cefr: "B1-B2", description: "İsim tamlaması (izafet), mazi/muzari fiil çekimi, harf-i cerler ve mansub haller." },
      advanced: { code: "advanced", label: "İleri (C1 - C2)", cefr: "C1-C2", description: "Sülasi mezid bablar, tam i'rab tahlili, fesahat ve belagat incelikleri." },
    },
    resources: [
      { title: "Al Jazeera Learning Arabic", url: "https://learning.aljazeera.net/", badge: "Platform", description: "Fasih haberler, metin analizleri ve seviyelere göre interaktif alıştırmalar." },
      { title: "Madinah Arabic", url: "https://www.madinaharabic.com/", badge: "Rehber", description: "Medine Arapçası metotları, harfler, kelimeler ve gramer dersleri." },
      { title: "Almaany Arapça Sözlük", url: "https://www.almaany.com/", badge: "Döküman", description: "Kök harflere göre kapsamlı Arapça-Türkçe ve Arapça-Arapça sözlük." },
    ],
    dictionaries: [
      { name: "Almaany", url: "https://www.almaany.com/" },
      { name: "Tevafuk Sözlük", url: "https://tevafuk.com/" },
    ],
    defaultGoals: {
      beginner: ["Arap alfabesini, harekeleri ve ilk 300 temel kelimeyi öğrenmek", "Basit isim ve fiil cümlelerini kurup harekeleyebilmek", "A1-A2 seviyesinde temel iletişim sağlamak"],
      intermediate: ["Sarf ve Nahiv temellerini kavrayarak metinleri harekesiz okuyabilmek", "Arapça haberleri ve yazıları sözlük yardımıyla anlayabilmek", "YDS / YÖKDİL Arapça sınavında 70+ puan hedeflemek"],
      advanced: ["Klasik ve modern edebiyat metinlerini derinlemesine tahlil edebilmek", "Tam i'rab analizi ve belagat kurallarına hakim olmak", "Uluslararası düzeyde simultane veya profesyonel çeviri yetkinliğine ulaşmak"],
    },
    questions: {
      beginner: [
        {
          id: "ar-beg-1",
          prompt: "'الكِتَابُ جَدِيدٌ' (Kitap yenidir) cümlesinde 'الكِتَابُ' kelimesinin cümledeki konumu nedir?",
          options: options("Mübteda (Özne - Merfu)", "Haber (Yüklem)", "Mef'ul (Nesne)"),
          correct: "a",
          subTopic: "İsim Cümlesi (Mübteda ve Haber)",
          explanation: "İsim cümlesine başlanan ve merfu olan marife isme 'Mübteda' denir.",
          recommendedReview: "İsim cümlesi ögelerini ve ref alameti olan dammeyi (ötre) çalış.",
        },
        {
          id: "ar-beg-2",
          prompt: "'ذَهَبَ الطَّالِبُ ___ المَدْرَسَةِ.' Boşluğa hangi harf-i cer gelmelidir?",
          options: options("إِلَى (İla - -e doğru)", "عَلَى (Ala - üzerinde)", "مِنْ (Min - -den)"),
          correct: "a",
          subTopic: "Harf-i Cerler (Edatlar)",
          explanation: "Bir yere yönelme bildiren 'zehebe' (gitti) fiili 'ila' (إلى) harf-i ceriyle kullanılır.",
          recommendedReview: "En sık kullanılan 7 harf-i ceri (fi, ila, min, an, ala, bi, li) ezberle.",
        },
        {
          id: "ar-beg-3",
          prompt: "'هَذِهِ سَيَّارَةٌ' cümlesinde müzekker 'هَذَا' yerine müennes 'هَذِهِ' kullanılma sebebi nedir?",
          options: options("Seyyare (سيارة) kelimesinin sonunda yuvarlak te (ة) bulunması", "Kelimenin çoğul olması", "Cümlede fiil bulunmaması"),
          correct: "a",
          subTopic: "Müzekker ve Müennes Ayrımı",
          explanation: "Arapçada sonunda ta-i merbuta (ة) bulunan isimler müennestir ve 'hazihi' ile işaret edilir.",
          recommendedReview: "Müenneslik alametlerini ve işaret zamirlerini tekrar et.",
        },
        {
          id: "ar-beg-4",
          prompt: "'يَكْتُبُ' (Yektübü) fiilinin zamanı ve şahıs çekimi nedir?",
          options: options("O (erkek) yazıyor / yazar (Muzari / Şimdiki-Geniş Zaman)", "O yazdı (Mazi)", "Yaz! (Emir)"),
          correct: "a",
          subTopic: "Muzari Fiil Çekimi",
          explanation: "Baştaki 'ye' muzaraat harfi 3. tekil şahıs erili ve şimdiki/geniş zamanı ifade eder.",
          recommendedReview: "Mazi ve muzari fiil çekim tablosunu karşılaştır.",
        },
      ],
      intermediate: [
        {
          id: "ar-int-1",
          prompt: "'بَابُ البَيْتِ' (Evin kapısı) terkibinde 'البَيْتِ' kelimesinin irabı nedir?",
          options: options("Muzafun İleyh - Mecrur (Esre ile)", "Fail - Merfu", "Mef'ul - Mansub"),
          correct: "a",
          subTopic: "İzafet Terkibi (İsim Tamlaması)",
          explanation: "İsim tamlamasında ikinci kelime 'muzafun ileyh'tir ve daima mecrurdur (kesralı).",
          recommendedReview: "Muzaf ve muzafun ileyh kurallarını ve tenvin düşmesini çalış.",
        },
        {
          id: "ar-int-2",
          prompt: "'الطُّلاَّبُ ___ إِلَى المَكْتَبَةِ.' (Mübteda çoğul olduğunda fiil haberi)",
          options: options("ذَهَبُوا (Zehebû)", "ذَهَبَ (Zehebe)", "ذَهَبَتْ (Zehebet)"),
          correct: "a",
          subTopic: "Fiil-Fail Uyumu (İsim Cümlesinde)",
          explanation: "Mübteda başta çoğul geldiğinde, sonra gelen haber fiili sayı ve cinsiyet bakımından ona uyar (cemi müzekker -> zehebû).",
          recommendedReview: "Fiil cümlesi ile isim cümlesindeki fiil-fail uyumu farkını çalış.",
        },
        {
          id: "ar-int-3",
          prompt: "'لَنْ ___ فِي الِامْتِحَانِ.' (Nasp edatı 'len' sonrası fiil harekesi)",
          options: options("يَرْسُبَ (Yersübe - fethalı)", "يَرْسُبُ (Yersübü)", "يَرْسُبْ (Yersüb)"),
          correct: "a",
          subTopic: "Muzariyi Nasbeden Edatlar",
          explanation: "'Len' (asla) edatı muzari fiili nasbeder ve son harekesini fetha yapar.",
          recommendedReview: "En, len, key, izen (nasb edatları) kurallarını tekrar et.",
        },
        {
          id: "ar-int-4",
          prompt: "'عَلَّمَ' (Alleme - Öğretti) fiili, 'عَلِمَ' (Alime - Bildi) fiilinin hangi mezid babıdır?",
          options: options("Tef'il babı (تَفْعِيل)", "İf'al babı (إِفْعَال)", "İstif'al babı (اسْتِفْعَال)"),
          correct: "a",
          subTopic: "Sülasi Mezid Bablar (Sarf)",
          explanation: "Aynü'l-fiilin (orta harfin) şeddelenmesiyle kurulan kalıp Tef'il (تَفْعِيل) babıdır.",
          recommendedReview: "İf'al, Tef'il ve Müfaale bablarının anlam özelliklerini çalış.",
        },
      ],
      advanced: [
        {
          id: "ar-adv-1",
          prompt: "'إِنَّ الحَقَّ وَاضِحٌ' cümlesinde 'الحَقَّ' kelimesinin irabı nedir?",
          options: options("İnne'nin ismi olup mansubtur (fetha ile)", "İnne'nin haberi olup merfudur", "Mübtedadır"),
          correct: "a",
          subTopic: "İnne ve Kardeşleri (İ'rab)",
          explanation: "'İnne' ve benzerleri isim cümlesine dahil olur; ismini nasb, haberini ref eder.",
          recommendedReview: "İnne, kâne ve benzerlerinin amel ve i'rab farklarını incele.",
        },
        {
          id: "ar-adv-2",
          prompt: "'لَوْلاَ العِلْمُ لَسَادَ الجَهْلُ' (İlim olmasaydı cehalet hakim olurdu) cümlesindeki 'Levlâ' ne bildirir?",
          options: options("Bir şeyin varlığı sebebiyle diğerinin yokluğunu (İmtina li-vücud)", "Kesin kabul", "Zaman zarfı"),
          correct: "a",
          subTopic: "Şart Edatları ve Anlam İncelikleri",
          explanation: "'Levlâ' bir şeyin varlığının başka bir şeyin gerçekleşmesini engellediğini bildiren şart edatıdır.",
          recommendedReview: "Lev, levlâ ve izâ şart edatlarının belagat farklarını çalış.",
        },
        {
          id: "ar-adv-3",
          prompt: "'كَادَ المَطَرُ يَهْطِلُ' (Yağmur neredeyse yağacaktı) cümlesinde 'Kâde' hangi fiil grubundandır?",
          options: options("Ef'al-i Mukarabe (Yaklaşma fiilleri)", "Ef'al-i Reca (Umut fiilleri)", "Ef'al-i Şuru' (Başlama fiilleri)"),
          correct: "a",
          subTopic: "Mukarabe, Reca ve Şuru' Fiilleri",
          explanation: "'Kâde' ve 'evşeke', eylemin gerçekleşmeye yaklaştığını belirten yaklaşma (mukarabe) fiilleridir.",
          recommendedReview: "Kâde, asâ ve cerahe gibi mukarabe/reca fiillerinin haber yapılarını çalış.",
        },
        {
          id: "ar-adv-4",
          prompt: "Arap belagatinde 'Kinaye' sanatı neyi ifade eder?",
          options: options("Gerçek anlamı da kastedilebilecekken başka bir manayı ima etmeyi", "Sadece iki kelimeyi kafiyeli dizmeyi", "Zıt anlamlı kelimeleri birleştirmeyi"),
          correct: "a",
          subTopic: "Belagat (Beyan İlmi)",
          explanation: "Kinaye, asıl anlamı da mümkün olmakla birlikte, bir vasfı veya durumu ima yoluyla anlatmaktır.",
          recommendedReview: "Teşbih, istiare ve kinaye belagat sanatlarını örnekleriyle çalış.",
        },
      ],
    },
  },
};

export function detectLanguage(text: string): LanguageInfo | undefined {
  if (!text) return undefined;
  const normTr = text.toLocaleLowerCase("tr").trim();
  const normEn = text.toLowerCase().trim();
  for (const lang of Object.values(supportedLanguages)) {
    const langNameTr = lang.name.toLocaleLowerCase("tr");
    const langNameEn = lang.name.toLowerCase();
    if (
      langNameTr === normTr ||
      langNameEn === normEn ||
      lang.aliases.some((a) => {
        const aliasTr = a.toLocaleLowerCase("tr");
        const aliasEn = a.toLowerCase();
        return (
          normTr.includes(aliasTr) ||
          normEn.includes(aliasEn) ||
          aliasTr.includes(normTr) ||
          aliasEn.includes(normEn)
        );
      })
    ) {
      return lang;
    }
  }
  return undefined;
}

export function getLanguageLevelLabel(lang: LanguageInfo, level: LanguageLevel): string {
  return lang.levels[level]?.label ?? "Başlangıç";
}

export function getLanguageQuestions(languageName: string, level: LanguageLevel = "beginner"): DomainQuestion[] {
  const lang = detectLanguage(languageName);
  if (!lang) return [];
  const levelQuestions = lang.questions[level] ?? lang.questions.beginner;
  return levelQuestions.map((q) => ({ ...q, subTopic: `${lang.name} · ${q.subTopic}` }));
}

export function getLanguageGoalSuggestions(languageName: string, level: LanguageLevel = "beginner"): string[] {
  const lang = detectLanguage(languageName);
  if (!lang) return ["Günlük konuşma pratiği yapmak", "Temel gramer ve kelime dağarcığını geliştirmek", "Akıcı iletişim kurmak"];
  return lang.defaultGoals[level] ?? lang.defaultGoals.beginner;
}
