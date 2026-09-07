export interface WisdomQuote {
  quote: string;
  author: string;
}

export const DAILY_WISDOM: WisdomQuote[] = [
  { quote: "Büyük hedefler bir anda değil; her gün atılan küçük, dürüst adımların birikmesiyle fetheder.", author: "Marcus Aurelius" },
  { quote: "Neye 'evet' dediğine dikkat et; çünkü her evet, derin odaklanabileceğin başka bir şeye 'hayır' demektir.", author: "Seneca" },
  { quote: "Derin çalışma, dikkat dağıtıcı unsurların olmadığı bir ortamda zihinsel kapasiteni sonuna kadar kullanma becerisidir.", author: "Cal Newport" },
  { quote: "Kendini başkalarının ulaştığı yerle değil; dünkü kendi çaban ve odağınla kıyasla.", author: "Epiktetos" },
  { quote: "Mükemmel planı bekleme. Bugün atabileceğin en küçük anlamlı adımla başla.", author: "James Clear" },
  { quote: "Sabır pasif bir bekleyiş değil; uzun vadeli hedefine duyduğun sarsılmaz bağlılıktır.", author: "Stoacı Prensip" },
  { quote: "Gürültüyü kapat, zihnini sakinleştir. Sıradaki görevin senin tek gerçekliğin olsun.", author: "North Felsefesi" },
  { quote: "Zorluklar seni engellemek için değil; odak gücünü ve iradeni bilemek için karşına çıkar.", author: "Marcus Aurelius" },
  { quote: "Bir günde yapabileceklerini abartır, bir yılda tutarlılıkla başarabileceklerini ise küçümsersin.", author: "Bill Gates" },
  { quote: "Başlamak için harika olmana gerek yok, ama harika olmak için bugün başlamalısın.", author: "Zig Ziglar" },
];

export function getTodayWisdom(date = new Date()): WisdomQuote {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  return DAILY_WISDOM[dayOfYear % DAILY_WISDOM.length];
}
