import type { WorkspaceState } from "@/lib/types";
import { initialResources, initialSourceLocks } from "@/lib/resource-data";

const planId = "00000000-0000-4000-8000-000000000001";

const taskSeed = [
  ["TCP ve UDP pratik tekrarı", "Ağ", "TCP ve UDP trafiğini yakala, el sıkışmalarını karşılaştır ve üç operasyonel farkı belgele."],
  ["Nmap ile host keşfi", "Ağ", "Yetkili bir labda üç host keşif yöntemi uygula ve her birinin hangi durumda başarısız olduğunu açıkla."],
  ["Nmap servis/sürüm taraması", "Ağ", "Bir lab hedefini güvenli Nmap servis tespitiyle tara ve çıktıyı saldırı yüzeyi notuna dönüştür."],
  ["Wireshark paket incelemesi", "Ağ", "DNS ve TCP paketlerini incele, görüntüleme filtreleri uygula ve istek-yanıt akışını notlandır."],
  ["Kolay ağ keşif labı", "Lablar", "Keşif ve enumeration adımlarını walkthrough olmadan tamamla; mentordan en fazla yönlendirici ipucu iste."],
  ["Kolay sızma testi akış labı", "Lablar", "Keşif → enumeration → hipotez → doğrulama akışını izle ve eksiksiz bir lab günlüğü tut."],
  ["İkinci bağımsız lab", "Lablar", "Yeni bir kolay labı bağımsız dene ve yardım istemeden önce her başarısız hipotezi kaydet."],
  ["PortSwigger erişim kontrolü labı", "Web Güvenliği", "Temel bir erişim kontrolü labını çöz ve yetkilendirme hatasını kendi cümlelerinle yaz."],
  ["Python Nmap çıktı ayrıştırıcısı", "Python/Bash", "Nmap XML çıktısını sağlam hata yönetimiyle kısa bir host/port/servis özetine dönüştür."],
  ["Bir zafiyet bulgusu yaz", "Raporlama", "Bir lab bulgusunu kanıt, etki, yeniden üretim adımları ve uygulanabilir çözümle belgele."],
] as const;

const taskResources = [
  ["cisco-networking-basics", "wireshark-guide"], ["nmap-reference", "metasploitable-2"], ["nmap-version-detection", "metasploitable-2"],
  ["wireshark-guide", "wireshark-guide"], ["nmap-reference", "metasploitable-2"], ["nmap-reference", "metasploitable-2"],
  ["nmap-reference", "vulnhub"], ["portswigger-academy", "portswigger-access-control"], ["python-tutorial", "nmap-reference"], ["owasp-reporting", "metasploitable-2"],
] as const;

const taskOutputs = [
  "TCP handshake ve UDP iletişimi arasındaki farkları 5 maddede yaz.",
  "Kullandığın keşif yöntemlerini ve bulunan hostları tablo halinde kaydet.",
  "Port | Protokol | Servis | Sürüm | Notlar tablosu oluştur.",
  "DNS ve TCP trafiğinden en az 5 kanıta dayalı gözlem yaz.",
  "Recon, enumeration ve seçtiğin sonraki adımı kısa lab günlüğüne kaydet.",
  "Her metodoloji aşamasında elde ettiğin kanıtı lab günlüğüne yaz.",
  "Başarısız hipotezler ve neden elendikleri dahil eksiksiz lab günlüğü üret.",
  "Erişim kontrolü hatasını, kanıtı ve etkisini kendi cümlelerinle açıkla.",
  "Nmap XML girdisinden host/port/servis özeti üreten çalışan betik ve README hazırla.",
  "Başlık, önem, açıklama, kanıt, etki, adımlar ve çözüm içeren bir finding yaz.",
] as const;

export const demoState: WorkspaceState = {
  certifications: [],
  profile: {
    id: "00000000-0000-4000-8000-000000000010",
    fullName: "Furkan",
    goal: "Sızma Testi Uzmanı olmak",
    track: "Ofansif Güvenlik",
    primaryFocus: "Ağ / İç Ağ Sızma Testi",
    secondaryFocus: "Bulut Güvenliği",
    futureFocus: "Kırmızı Takım",
    universityMode: "normal",
    preferredSessionMinutes: 50,
    weeklyCapacityHours: 11,
  },
  weeklyPlan: {
    id: planId,
    weekStart: "2026-08-31",
    mode: "normal",
    targetBlocks: 10,
    aiSummary: "Yeni istismar teknikleri eklemeden önce tekrarlanabilir bir enumeration akışı oluştur.",
  },
  tasks: taskSeed.map(([title, category, description], index) => ({
    id: `00000000-0000-4000-8000-${String(index + 101).padStart(12, "0")}`,
    weeklyPlanId: planId,
    title,
    description,
    category,
    duration: index === 6 ? 60 : 50,
    difficulty: index === 6 ? "medium" : "easy",
    objectives: ["Yalnızca yetkili lablarda çalış", "Komutları ve gözlemleri kaydet", "Kanıta dayalı sonuç çıkar"],
    successCriteria: index === 2
      ? ["Açık tüm TCP servislerini tespit et", "İki servis/sürüm etkisini açıkla", "Tekrar kullanılabilir enumeration notu kaydet"]
      : ["Somut bir çıktı üret", "Sonucu walkthrough kopyalamadan açıkla"],
    recommendedResources: ["Resmî dokümantasyon", "Metodoloji notların"],
    theoryResourceId: taskResources[index]?.[0],
    practicalResourceId: taskResources[index]?.[1],
    outputRequirement: taskOutputs[index] ?? "Çalışma sonunda ölçülebilir kısa bir çıktı üret.",
    aiHelpLimit: 2,
    status: index < 3 ? "completed" : "pending",
    isDailyMission: index === 3,
    completedAt: index < 3 ? `2026-09-0${index + 1}T18:00:00.000Z` : undefined,
  })),
  focusSessions: [
    { id: "00000000-0000-4000-8000-000000000301", taskId: "00000000-0000-4000-8000-000000000101", durationMinutes: 48, status: "completed", notes: "Compared handshake behavior.", completedAt: "2026-09-01T18:00:00.000Z" },
    { id: "00000000-0000-4000-8000-000000000302", taskId: "00000000-0000-4000-8000-000000000102", durationMinutes: 52, status: "completed", notes: "ARP and ICMP discovery notes.", completedAt: "2026-09-02T18:00:00.000Z" },
    { id: "00000000-0000-4000-8000-000000000303", taskId: "00000000-0000-4000-8000-000000000103", durationMinutes: 50, status: "completed", notes: "Built baseline command set.", completedAt: "2026-09-03T18:00:00.000Z" },
  ],
  labs: [
    { id: "00000000-0000-4000-8000-000000000401", name: "Fawn", platform: "Hack The Box", difficulty: "easy", category: "Network", date: "2026-09-02", duration: 55, status: "completed", target: "Authorized HTB target", recon: "Host reachable; initial TCP scan completed.", enumeration: "FTP service exposed.", attackSurface: "Anonymous FTP access", attempts: "Tested guest and anonymous access.", exploitation: "Retrieved the lab flag through authorized anonymous access.", privilegeEscalation: "Not applicable", result: "Completed", stuck: "Initially over-focused on web ports.", learned: "Prioritize evidence from exposed services.", aiAssistanceLevel: 1, walkthroughUsed: false, notes: "Repeat FTP enumeration next week.", keyLearnings: ["Enumerate every exposed service", "Test common safe misconfigurations", "Keep hypotheses short"] },
    { id: "00000000-0000-4000-8000-000000000402", name: "SMB Practice", platform: "Local Lab", difficulty: "easy", category: "Internal", date: "2026-09-03", duration: 70, status: "attempted", target: "Owned local VM", recon: "Ports 139/445 exposed.", enumeration: "Shares discovered; permissions unclear.", attackSurface: "SMB shares", attempts: "Guest listing and share enumeration.", exploitation: "", privilegeEscalation: "", result: "Partial", stuck: "Could not connect findings to the next test.", learned: "Need a repeatable SMB checklist.", aiAssistanceLevel: 3, walkthroughUsed: false, notes: "Schedule repetition.", keyLearnings: ["Separate share discovery from permission testing"] },
  ],
  skills: [
    ["Networking", 3.4, 3, 0.2, "Three focused network tasks completed"],
    ["Pentest Workflow", 2.5, 2, 0.2, "One independent lab and one structured attempt"],
    ["Linux", 6, 6, 0.1, "Stable baseline; needs new evidence"],
    ["Web Security", 4, 4, 0.1, "No change this week"],
    ["Python/Bash", 6, 6, 0.1, "Parser task remains open"],
    ["Reporting", 1.4, 1, 0.1, "Lab notes show clearer evidence capture"],
    ["Active Directory", 1, 1, 0.1, "Roadmap stage not started"],
    ["English", 3, 3, 0.05, "Technical reading exposure is consistent"],
    ["Portfolio", 1.5, 1, 0.05, "First reusable lab journal created"],
  ].map(([name, score, previousScore, weight, evidence], index) => ({ id: `00000000-0000-4000-8000-${String(index + 501).padStart(12, "0")}`, name: String(name), category: String(name), score: Number(score), previousScore: Number(previousScore), weight: Number(weight), evidence: String(evidence) })),
  reviews: [],
  notes: [{ id: "00000000-0000-4000-8000-000000000601", title: "Nmap enumeration baseline", category: "Tools", content: "# Baseline\n\nStart broad, validate service versions, then use focused scripts. Record why each command is run.", updatedAt: "2026-09-03T18:00:00.000Z" }],
  reports: [],
  vocabulary: [
    { id: "00000000-0000-4000-8000-000000000701", term: "enumeration", meaning: "Ayrıntılı bilgi toplama süreci", example: "Enumeration revealed an anonymously accessible share." },
    { id: "00000000-0000-4000-8000-000000000702", term: "exposure", meaning: "Bir varlığın erişilebilir veya risk altında olması", example: "The service exposure increased the attack surface." },
  ],
  coachMessages: [],
  coachSessionArchives: [],
  resources: initialResources,
  resourceHistory: [],
  sourceLocks: initialSourceLocks,
  coaching: {
    milestones: [
      { id: "milestone-30", title: "Temel keşif akışı", horizonDays: 30, description: "Ağ keşfi ve temel enumeration akışını kanıtlarla tekrarla.", successCriteria: ["4 odak oturumu", "2 bağımsız kolay lab", "Tekrar kullanılabilir keşif notu"], status: "active" },
      { id: "milestone-60", title: "Web ve iç ağ temeli", horizonDays: 60, description: "Web güvenliği ve SMB/AD temelinde ilk bağımsız çıktılarını üret.", successCriteria: ["2 web labı", "1 SMB checklist", "1 teknik bulgu"], status: "upcoming" },
      { id: "milestone-90", title: "Portföy kanıtı", horizonDays: 90, description: "Seçili alanda işe dönük kanıt ve rapor örnekleri biriktir.", successCriteria: ["3 lab günlüğü", "2 kaliteli bulgu", "Kendi öğrenme özetin"], status: "upcoming" },
    ],
    checkins: [],
    pendingActions: [],
    actionHistory: [],
    archives: [],
    preferences: { dailyReminderEnabled: true, weeklyReviewReminderEnabled: true, dailyAiLimit: 20, aiUsage: { date: "", count: 0 }, clearChatOnClose: true },
  },
  portfolio: [], jobs: [], applications: [], interviews: [],
};
