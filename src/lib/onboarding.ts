import { initialResources, initialSourceLocks } from "@/lib/resource-data";
import { initializeNorth, weekKey } from "@/lib/north";
import type { InitialSetupInput, Skill, Task, WorkspaceState } from "@/lib/types";

export interface AssessmentQuestion {
  id: string;
  skill: string;
  prompt: string;
  options: { value: string; label: string }[];
  correct: string;
}

const fundamentalsQuestions: AssessmentQuestion[] = [
  {
    id: "dns",
    skill: "Networking",
    prompt: "DNS'in temel görevi nedir?",
    options: [
      { value: "a", label: "Alan adlarını IP adresleriyle eşleştirmek" },
      { value: "b", label: "Dosyaları şifrelemek" },
      { value: "c", label: "Kullanıcı parolalarını saklamak" },
    ],
    correct: "a",
  },
  {
    id: "permissions",
    skill: "Linux",
    prompt: "Linux'ta bir dosyanın izinlerini görüntülemek için en uygun komut hangisidir?",
    options: [
      { value: "a", label: "pwd" },
      { value: "b", label: "ls -l" },
      { value: "c", label: "whoami" },
    ],
    correct: "b",
  },
  {
    id: "xss",
    skill: "Web Security",
    prompt: "XSS riskini azaltan temel savunmalardan biri hangisidir?",
    options: [
      { value: "a", label: "Tüm trafiği HTTP'ye çevirmek" },
      { value: "b", label: "Parolaları tarayıcıda tutmak" },
      { value: "c", label: "Çıktıyı bağlama uygun biçimde kodlamak" },
    ],
    correct: "c",
  },
  {
    id: "scope",
    skill: "Pentest Workflow",
    prompt: "Bir güvenlik testi başlamadan önce ilk doğrulanması gereken nedir?",
    options: [
      { value: "a", label: "Yetki ve test kapsamı" },
      { value: "b", label: "En güçlü istismar aracı" },
      { value: "c", label: "Raporun kapak tasarımı" },
    ],
    correct: "a",
  },
  {
    id: "evidence",
    skill: "Reporting",
    prompt: "Bir zafiyet bulgusunu en iyi destekleyen kanıt hangisidir?",
    options: [
      { value: "a", label: "Sadece aracın adı" },
      { value: "b", label: "Tekrarlanabilir adımlar ve doğrulanmış çıktı" },
      { value: "c", label: "Kaynağı belirsiz bir ekran görüntüsü" },
    ],
    correct: "b",
  },
  {
    id: "least-privilege",
    skill: "Cloud Security",
    prompt: "En az ayrıcalık ilkesi neyi söyler?",
    options: [
      { value: "a", label: "Her kullanıcı yönetici olmalıdır" },
      { value: "b", label: "İzinler süresiz verilmelidir" },
      { value: "c", label: "Yalnızca gerekli yetkiler verilmelidir" },
    ],
    correct: "c",
  },
];

const assessmentQuestionSets: Record<string, AssessmentQuestion[]> = {
  "Siber güvenlik temelleri": fundamentalsQuestions,
  "Ağ ve iç ağ güvenliği": [
    { id: "network-dns", skill: "Networking", prompt: "Bir cihazın alan adı için doğru IP adresini öğrenmesinde hangi sistem rol alır?", options: [{ value: "a", label: "DNS" }, { value: "b", label: "SSH" }, { value: "c", label: "HTML" }], correct: "a" },
    { id: "network-port", skill: "Networking", prompt: "Port taramasının güvenlik çalışmalarındaki temel amacı nedir?", options: [{ value: "a", label: "Açık servisleri ve saldırı yüzeyini belirlemek" }, { value: "b", label: "Disk alanını artırmak" }, { value: "c", label: "Parolaları değiştirmek" }], correct: "a" },
    { id: "network-linux", skill: "Linux", prompt: "Linux'ta ağ arayüzü ve IP bilgilerini görüntülemek için hangi komut uygundur?", options: [{ value: "a", label: "ip addr" }, { value: "b", label: "mkdir" }, { value: "c", label: "cat /etc/shadow" }], correct: "a" },
    { id: "network-scope", skill: "Pentest Workflow", prompt: "İç ağ testi öncesinde hangi bilgi mutlaka netleşmelidir?", options: [{ value: "a", label: "Yetkili kapsam ve izin" }, { value: "b", label: "En hızlı exploit" }, { value: "c", label: "Kullanıcının kişisel şifresi" }], correct: "a" },
    { id: "network-evidence", skill: "Reporting", prompt: "Açık bir servisi raporlarken en güçlü kanıt hangisidir?", options: [{ value: "a", label: "Hedef, zaman, komut ve doğrulanmış çıktı" }, { value: "b", label: "Sadece araç logosu" }, { value: "c", label: "Tahmine dayalı not" }], correct: "a" },
    { id: "network-least-privilege", skill: "Cloud Security", prompt: "Ağ cihazı yönetim erişiminde en az ayrıcalık ne demektir?", options: [{ value: "a", label: "Yalnızca gerekli yönetim yetkisini vermek" }, { value: "b", label: "Herkese tam yönetici yetkisi vermek" }, { value: "c", label: "Erişimi kayıt altına almamak" }], correct: "a" },
  ],
  "Web uygulama güvenliği": [
    { id: "web-input", skill: "Web Security", prompt: "Kullanıcı girdisini sayfada güvenli göstermek için temel yaklaşım hangisidir?", options: [{ value: "a", label: "Bağlama uygun çıktı kodlama" }, { value: "b", label: "Girdiyi doğrudan HTML olarak çalıştırma" }, { value: "c", label: "HTTP kullanmaya zorlama" }], correct: "a" },
    { id: "web-auth", skill: "Web Security", prompt: "Oturum çerezleri için hangi özellik tarayıcı tarafı betik erişimini azaltır?", options: [{ value: "a", label: "HttpOnly" }, { value: "b", label: "Public" }, { value: "c", label: "Unlimited" }], correct: "a" },
    { id: "web-http", skill: "Networking", prompt: "HTTPS'in temel katkısı nedir?", options: [{ value: "a", label: "İstemci ile sunucu arasındaki trafiği şifrelemek" }, { value: "b", label: "Tüm zafiyetleri otomatik kapatmak" }, { value: "c", label: "Alan adını IP'ye çevirmek" }], correct: "a" },
    { id: "web-scope", skill: "Pentest Workflow", prompt: "Bir web testi sırasında üretim verisiyle karşılaşırsan ilk ilke ne olmalıdır?", options: [{ value: "a", label: "Yetki ve kapsam dışına çıkmamak" }, { value: "b", label: "Veriyi indirmek" }, { value: "c", label: "Herkese paylaşmak" }], correct: "a" },
    { id: "web-linux", skill: "Linux", prompt: "Bir URL'ye güvenli bir HTTP isteği göndermek için hangi araç sık kullanılır?", options: [{ value: "a", label: "curl" }, { value: "b", label: "chmod" }, { value: "c", label: "uname" }], correct: "a" },
    { id: "web-report", skill: "Reporting", prompt: "Bir web bulgusunda etkiyi anlatırken ne yazılmalıdır?", options: [{ value: "a", label: "Gerçekçi risk, ön koşullar ve güvenli doğrulama" }, { value: "b", label: "Sadece \"kritik\" etiketi" }, { value: "c", label: "Araç listesinin tamamı" }], correct: "a" },
  ],
  "SOC ve olay müdahalesi": [
    { id: "soc-log", skill: "Networking", prompt: "Bir güvenlik olayını incelemeye başlarken en değerli kaynaklardan biri hangisidir?", options: [{ value: "a", label: "Zaman damgalı olay günlükleri" }, { value: "b", label: "Rastgele internet yorumları" }, { value: "c", label: "Masaüstü duvar kağıdı" }], correct: "a" },
    { id: "soc-triage", skill: "Pentest Workflow", prompt: "Uyarı triyajının ilk amacı nedir?", options: [{ value: "a", label: "Uyarının gerçek riskini ve önceliğini belirlemek" }, { value: "b", label: "Tüm sistemleri kapatmak" }, { value: "c", label: "Kanıtı silmek" }], correct: "a" },
    { id: "soc-linux", skill: "Linux", prompt: "Linux'ta sistem günlüklerini incelemek için hangi araç kullanılabilir?", options: [{ value: "a", label: "journalctl" }, { value: "b", label: "touch" }, { value: "c", label: "cd .." }], correct: "a" },
    { id: "soc-network", skill: "Networking", prompt: "Şüpheli bir bağlantıyı incelerken hangi bilgi faydalıdır?", options: [{ value: "a", label: "Kaynak/hedef IP, port ve zaman" }, { value: "b", label: "Kullanıcının sevdiği renk" }, { value: "c", label: "Ekran çözünürlüğü" }], correct: "a" },
    { id: "soc-report", skill: "Reporting", prompt: "Olay notunda neyi korumak gerekir?", options: [{ value: "a", label: "Gözlem, kanıt, zaman çizelgesi ve alınan aksiyonları" }, { value: "b", label: "Sadece sonucu" }, { value: "c", label: "Doğrulanmamış söylentileri" }], correct: "a" },
    { id: "soc-cloud", skill: "Cloud Security", prompt: "Bulut olay kayıtları için iyi bir uygulama hangisidir?", options: [{ value: "a", label: "Erişim günlüklerini merkezi ve denetlenebilir tutmak" }, { value: "b", label: "Günlükleri kapatmak" }, { value: "c", label: "Herkese silme izni vermek" }], correct: "a" },
  ],
  "Bulut güvenliği": [
    { id: "cloud-iam", skill: "Cloud Security", prompt: "Bulut IAM yapılandırmasında en az ayrıcalık neyi hedefler?", options: [{ value: "a", label: "Yalnızca gerekli izinleri vermeyi" }, { value: "b", label: "Tüm hesapları yönetici yapmayı" }, { value: "c", label: "İzinleri süresiz bırakmayı" }], correct: "a" },
    { id: "cloud-secret", skill: "Cloud Security", prompt: "API anahtarı gibi sırlar için uygun yaklaşım hangisidir?", options: [{ value: "a", label: "Güvenli sır yönetimi kullanmak" }, { value: "b", label: "Kaynak koda yazmak" }, { value: "c", label: "Herkese açık depoya eklemek" }], correct: "a" },
    { id: "cloud-network", skill: "Networking", prompt: "Ağ erişimini daraltmak için hangi kontrol kullanılır?", options: [{ value: "a", label: "Güvenlik grubu veya ağ güvenlik kuralı" }, { value: "b", label: "Açık misafir ağı" }, { value: "c", label: "Sınırsız gelen trafik" }], correct: "a" },
    { id: "cloud-linux", skill: "Linux", prompt: "Bir sunucuda gizli yapılandırma dosyalarının izinlerini neden sınırlandırırsın?", options: [{ value: "a", label: "Yetkisiz okumayı azaltmak için" }, { value: "b", label: "Disk hızını artırmak için" }, { value: "c", label: "DNS'i değiştirmek için" }], correct: "a" },
    { id: "cloud-scope", skill: "Pentest Workflow", prompt: "Bir bulut hesabını test etmeden önce ne gerekir?", options: [{ value: "a", label: "Açık ve yazılı yetki ile kapsam" }, { value: "b", label: "Rastgele hesap denemesi" }, { value: "c", label: "Hesap sahibine haber vermemek" }], correct: "a" },
    { id: "cloud-report", skill: "Reporting", prompt: "Herkese açık bir depolama alanını raporlarken ne önemlidir?", options: [{ value: "a", label: "Maruziyeti güvenli biçimde doğrulamak ve düzeltme önermek" }, { value: "b", label: "Verileri indirmek" }, { value: "c", label: "Bulguya kanıt eklememek" }], correct: "a" },
  ],
  "GRC ve güvenlik yönetişimi": [
    { id: "grc-risk", skill: "Reporting", prompt: "Risk değerlendirmesinde risk seviyesi en temelde neyle ilişkilidir?", options: [{ value: "a", label: "Olasılık ve etkiyle" }, { value: "b", label: "Sunumun rengiyle" }, { value: "c", label: "Ekipteki kişi sayısıyla" }], correct: "a" },
    { id: "grc-control", skill: "Cloud Security", prompt: "Bir güvenlik kontrolünün amacı nedir?", options: [{ value: "a", label: "Belirli bir riski azaltmak veya izlemek" }, { value: "b", label: "Tüm işleri yavaşlatmak" }, { value: "c", label: "Kanıt toplamayı engellemek" }], correct: "a" },
    { id: "grc-evidence", skill: "Reporting", prompt: "Uyum değerlendirmesinde kanıtın güvenilir olması için ne gerekir?", options: [{ value: "a", label: "İzlenebilir, güncel ve doğrulanabilir olması" }, { value: "b", label: "Sözlü aktarım olması" }, { value: "c", label: "Kaynağının bilinmemesi" }], correct: "a" },
    { id: "grc-access", skill: "Linux", prompt: "Erişim gözden geçirmesinin temel faydası nedir?", options: [{ value: "a", label: "Gereksiz yetkileri tespit etmek" }, { value: "b", label: "Herkese yeni yetki vermek" }, { value: "c", label: "Kayıtları kaldırmak" }], correct: "a" },
    { id: "grc-network", skill: "Networking", prompt: "Varlık envanteri neden önemlidir?", options: [{ value: "a", label: "Korunacak sistemleri ve sahiplerini bilmek için" }, { value: "b", label: "Ağ hızını artırmak için" }, { value: "c", label: "DNS'i devre dışı bırakmak için" }], correct: "a" },
    { id: "grc-scope", skill: "Pentest Workflow", prompt: "Bir denetimin kapsamı nasıl tanımlanmalıdır?", options: [{ value: "a", label: "Sistemler, dönem, ölçütler ve sorumluluklar açıkça belirtilerek" }, { value: "b", label: "Sözlü ve belirsiz biçimde" }, { value: "c", label: "İnceleme başladıktan sonra rastgele" }], correct: "a" },
  ],
};

export const assessmentQuestions = fundamentalsQuestions;

export function getAssessmentQuestions(primaryFocus: string | string[]): AssessmentQuestion[] {
  if (Array.isArray(primaryFocus)) {
    return primaryFocus.flatMap((focus, focusIndex) => getAssessmentQuestions(focus).slice(0, 3).map(question => ({ ...question, id: `area-${focusIndex}-${question.id}`, prompt: `${focus} · ${question.prompt}` })));
  }
  if (/matematik|istatistik|ekonomi|iktisat/i.test(primaryFocus)) return [
    { id: "math-concept", skill: primaryFocus, prompt: "Yeni bir kavramı öğrenirken kendi örneğini kurma düzeyin nedir?", options: selfAssessmentOptions("Henüz zorlanıyorum", "Örnekle yapabiliyorum", "Kendi örneğimi kurabiliyorum"), correct: "2" },
    { id: "math-practice", skill: primaryFocus, prompt: "Bir problem veya soruda takıldığında çözümü görmeden ne kadar süre denersin?", options: selfAssessmentOptions("Hemen çözüme bakarım", "Kısa süre denerim", "Strateji değiştirerek denerim"), correct: "2" },
    { id: "math-review", skill: primaryFocus, prompt: "Yanlışlarını tekrar etmek için bir sistemin var mı?", options: selfAssessmentOptions("Henüz yok", "Bazen not alıyorum", "Düzenli yanlış defterim / tekrar düzenim var"), correct: "2" },
  ];
  if (/uygulama|yazılım|geliştirme|kod|programlama/i.test(primaryFocus)) return [
    { id: "dev-build", skill: primaryFocus, prompt: "Küçük bir fikri çalışan bir sürüme dönüştürme deneyimin nasıl?", options: selfAssessmentOptions("Henüz yapmadım", "Rehberle yaptım", "Kendi başıma yayınladım"), correct: "2" },
    { id: "dev-debug", skill: primaryFocus, prompt: "Bir hata aldığında çözüm yaklaşımın nedir?", options: selfAssessmentOptions("Rastgele denerim", "Hata mesajını araştırırım", "Sorunu küçültür, test ederek ilerlerim"), correct: "2" },
    { id: "dev-output", skill: primaryFocus, prompt: "Çalışmalarını gösterebileceğin bir depo, taslak veya yayınlanmış çıktı var mı?", options: selfAssessmentOptions("Henüz yok", "Taslak var", "Düzenli güncel bir çıktım var"), correct: "2" },
  ];
  return assessmentQuestionSets[primaryFocus] ?? [
    { id: "goal-clarity", skill: "Hedef Netliği", prompt: "Başarıya ulaştığını gösterecek somut sonucu ne kadar net tanımladın?", options: selfAssessmentOptions("Henüz net değil", "Kabaca biliyorum", "Ölçülebilir sonucum net"), correct: "2" },
    { id: "goal-foundation", skill: "Temel Bilgi", prompt: "Hedefin için gerekli temel kavramları kendi cümlelerinle açıklama düzeyin nedir?", options: selfAssessmentOptions("Henüz açıklayamıyorum", "Bazılarını açıklayabilirim", "Temelleri rahatça açıklayabilirim"), correct: "2" },
    { id: "goal-practice", skill: "Uygulama", prompt: "Hedefinle ilgili tek başına uygulama veya pratik yapma düzeyin nedir?", options: selfAssessmentOptions("Henüz başlamadım", "Yönlendirmeyle yapabiliyorum", "Bağımsız uygulayabiliyorum"), correct: "2" },
    { id: "goal-output", skill: "Kanıt Üretme", prompt: "Şimdiye kadar gösterebileceğin bir çıktı, kayıt veya kanıt ürettin mi?", options: selfAssessmentOptions("Henüz yok", "Taslak veya yarım çıktı var", "Tamamlanmış kanıtım var"), correct: "2" },
    { id: "goal-consistency", skill: "Süreklilik", prompt: "Son dört haftadaki çalışma düzenin nasıldı?", options: selfAssessmentOptions("Düzenli çalışmadım", "Ara sıra çalıştım", "Haftalık düzenim oluştu"), correct: "2" },
    { id: "goal-obstacles", skill: "Engel Yönetimi", prompt: "Tıkandığında bir sonraki küçük adımı belirleyebilme düzeyin nedir?", options: selfAssessmentOptions("Genellikle tamamen duruyorum", "Bazen yol bulabiliyorum", "Sorunu küçültüp devam edebiliyorum"), correct: "2" },
  ];
}

function selfAssessmentOptions(low: string, middle: string, high: string) {
  return [{ value: "0", label: low }, { value: "1", label: middle }, { value: "2", label: high }];
}

const skillNames = ["Networking", "Pentest Workflow", "Linux", "Web Security", "Python/Bash", "Reporting", "Active Directory", "English", "Portfolio", "Cloud Security"];

export function createEmptyWorkspaceState(): WorkspaceState {
  const state: WorkspaceState = {
    certifications: [],
    profile: {
      id: "profile",
      fullName: "",
      goal: "",
      track: "",
      primaryFocus: "",
      secondaryFocus: "",
      futureFocus: "",
      universityMode: "normal",
      preferredSessionMinutes: 50,
      weeklyCapacityHours: 5,
    },
    weeklyPlan: {
      id: "current-week",
      weekStart: weekKey(),
      mode: "normal",
      targetBlocks: 0,
      aiSummary: "Başlangıç değerlendirmesi tamamlandıktan sonra planın oluşturulacak.",
    },
    tasks: [],
    focusSessions: [],
    labs: [],
    skills: skillNames.map((name, index) => ({ id: `skill-${index + 1}`, name, category: name, score: 0, previousScore: 0, evidence: "Henüz doğrulanmış kanıt yok.", weight: 0.1 })),
    reviews: [],
    notes: [],
    reports: [],
    vocabulary: [],
    coachMessages: [],
    resources: initialResources.map((resource) => ({ ...resource, usageCount: 0, completedTaskCount: 0, rating: undefined, lastUsedAt: undefined })),
    resourceHistory: [],
    sourceLocks: initialSourceLocks,
    coaching: {
      milestones: [],
      checkins: [],
      pendingActions: [],
      actionHistory: [],
      archives: [],
      preferences: { dailyReminderEnabled: true, weeklyReviewReminderEnabled: true, dailyAiLimit: 20, aiUsage: { date: "", count: 0 } },
    },
    portfolio: [],
    jobs: [],
    applications: [],
    interviews: [],
  };
  state.north = initializeNorth(state);
  return state;
}

export function calculateAssessment(answers: Record<string, string>, questions: AssessmentQuestion[]) {
  const bySkill: Record<string, { correct: number; total: number }> = {};
  for (const question of questions) {
    const current = bySkill[question.skill] ?? { correct: 0, total: 0 };
    const numericScale = /^\d+$/.test(question.correct);
    const maximum = numericScale ? Number(question.correct) : 1;
    current.total += maximum;
    current.correct += numericScale ? Math.min(maximum, Math.max(0, Number(answers[question.id] ?? 0))) : answers[question.id] === question.correct ? 1 : 0;
    bySkill[question.skill] = current;
  }
  return { bySkill, score: Object.values(bySkill).reduce((sum, item) => sum + item.correct, 0), total: Object.values(bySkill).reduce((sum, item) => sum + item.total, 0) };
}

function starterTasks(input: InitialSetupInput): Task[] {
  const planId = "current-week";
  const focus = input.primaryFocus;
  const templates = [
    {
      title: `${focus} temel haritasını çıkar`,
      description: `${focus} için temel kavramları, gerekli kaynakları ve başarı ölçütlerini tek sayfalık bir haritada topla.`,
      category: focus,
      duration: input.preferredSessionMinutes,
      outputRequirement: "Kendi cümlelerinle hazırlanmış tek sayfalık bir temel harita.",
    },
    {
      title: `${focus} için ilk küçük pratiği tamamla`,
      description: "Hedefinle doğrudan ilişkili, küçük ve ölçülebilir bir uygulama yap; attığın adımları kaydet.",
      category: focus,
      duration: input.preferredSessionMinutes,
      outputRequirement: "Kullanılan ortam, adımlar, sonuç ve öğrenilenleri içeren kısa çalışma günlüğü.",
    },
    {
      title: "İlk kanıtını North'a ekle",
      description: "Tamamladığın çalışmayı tekrar edilebilir bir not, rapor veya depo çıktısına dönüştür.",
      category: "Kanıt ve portföy",
      duration: 45,
      outputRequirement: "Bağlantısı veya içeriği doğrulanabilir ilk öğrenme kanıtı.",
    },
  ];
  return templates.map((template, index) => ({
    id: `starter-task-${index + 1}`,
    weeklyPlanId: planId,
    ...template,
    difficulty: "easy",
    objectives: ["Hedefin sınırları içinde çalış", "Kendi kararlarını not et", "Somut çıktı üret"],
    successCriteria: [template.outputRequirement, "Çalışmanın sonunda kısa bir öz değerlendirme yaz"],
    recommendedResources: ["North kaynak kütüphanesi", "Resmî dokümantasyon"],
    aiHelpLimit: 2,
    status: "pending",
    isDailyMission: index === 0,
  }));
}

export function createPersonalizedWorkspace(input: InitialSetupInput): WorkspaceState {
  const state = createEmptyWorkspaceState();
  const questions = getAssessmentQuestions(input.interests);
  const result = calculateAssessment(input.assessmentAnswers, questions);
  const ratio = result.total ? result.score / result.total : 0;
  const level = ratio <= .34 ? "beginner" : ratio <= .67 ? "foundation" : "intermediate";
  const generalSkillNames = ["Hedef Netliği", "Temel Bilgi", "Uygulama", "Kanıt Üretme", "Süreklilik", "Engel Yönetimi"];
  const isPresetCyberGoal = Boolean(assessmentQuestionSets[input.primaryFocus]);
  const skillBase = isPresetCyberGoal ? state.skills : generalSkillNames.map((name, index) => ({ id: `goal-skill-${index + 1}`, name, category: input.primaryFocus, score: 0, previousScore: 0, evidence: "Henüz doğrulanmış kanıt yok.", weight: 1 / generalSkillNames.length }));
  const skills: Skill[] = skillBase.map((skill) => {
    const item = result.bySkill[skill.name];
    if (!item) return skill;
    const score = item.total ? Math.round(item.correct / item.total * 10) : 0;
    return { ...skill, score, previousScore: score, evidence: `Başlangıç değerlendirmesi: ${item.correct}/${item.total}. Bu sonuç çalışma başlangıç noktasıdır; gerçek beceri puanı üretilen kanıtlarla güncellenir.` };
  });
  state.profile = {
    ...state.profile,
    fullName: input.fullName.trim(),
    goal: input.goal.trim(),
    track: input.track,
    primaryFocus: input.primaryFocus,
    interests: input.interests,
    university: { isStudent: input.isUniversityStudent, school: input.universitySchool.trim(), department: input.universityDepartment.trim(), courses: input.universityCourses },
    weeklyCapacityHours: input.weeklyCapacityHours,
    preferredSessionMinutes: input.preferredSessionMinutes,
  };
  state.skills = skills;
  state.tasks = starterTasks(input);
  state.weeklyPlan = {
    ...state.weeklyPlan,
    targetBlocks: state.tasks.length,
    aiSummary: `${input.primaryFocus} hedefin için önce temel, güvenli pratik ve kanıt üretme döngüsü kurulacak.`,
  };
  state.coaching.onboarding = {
    completedAt: new Date().toISOString(),
    currentLevel: level,
    englishLevel: input.englishLevel,
    labAccess: input.labAccess,
    preferredStyle: input.preferredStyle,
    constraints: input.constraints.trim(),
    assessmentScore: result.score,
    assessmentTotal: result.total,
    assessmentBySkill: result.bySkill,
  };
  state.coaching.milestones = [
    { id: "milestone-30", title: "Düzenli çalışma döngüsü", horizonDays: 30, description: `${input.primaryFocus} için sürdürülebilir bir çalışma ritmi kur.`, successCriteria: ["En az 8 odak oturumu", "2 güvenli pratik", "2 doğrulanabilir kanıt"], status: "active" },
    { id: "milestone-60", title: "Bağımsız uygulama", horizonDays: 60, description: "Yönlendirme ihtiyacını azaltarak bilgiyi uygulamaya dönüştür.", successCriteria: ["3 bağımsız pratik", "1 tekrar kullanılabilir teknik not", "Haftalık değerlendirme"], status: "upcoming" },
    { id: "milestone-90", title: "Hedefe dönük portföy", horizonDays: 90, description: input.goal, successCriteria: ["3 kaliteli kanıt", "1 yayınlanabilir çalışma", "Sonraki 90 gün planı"], status: "upcoming" },
  ];
  state.north = initializeNorth(state);
  if (state.north && input.isUniversityStudent) {
    const areaId = state.north.areas[0]?.id ?? "primary-goal";
    state.north.events = input.universityCourses.map(course => ({ id: course.id, areaId, title: `${course.name} dersi`, date: "", time: `${course.day} ${course.start}`, kind: "block", minutes: course.minutes }));
  }
  return state;
}
