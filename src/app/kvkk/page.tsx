import Link from "next/link";
import Image from "next/image";
import { NorthLogo } from "@/components/layout/north-logo";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function KvkkPage() {
  return <main className="mx-auto min-h-dvh w-full max-w-3xl px-4 py-10 sm:py-14">
    <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Kayıt ekranına dön</Link>
    <div className="mb-6 flex items-center gap-3"><NorthLogo size={44} priority /><div><p className="font-planorth text-base tracking-[0.04em]">PLANORTH</p><p className="text-xs text-muted-foreground">KVKK bilgilendirmesi</p></div></div>
    <Card><CardHeader><CardTitle>KVKK Aydınlatma Metni</CardTitle><CardDescription>Sürüm: 6 Eylül 2026</CardDescription></CardHeader><CardContent className="space-y-7 text-sm leading-6 text-muted-foreground">
      <section><h2 className="mb-2 text-base font-semibold text-foreground">1. İşlenen veriler</h2><p>North; hesap oluştururken kullanıcı adı, e-posta adresi, Firebase kullanıcı kimliği ve oturum sağlayıcısını işler. Uygulamayı kullandığında hedeflerin, değerlendirme yanıtların ve sonuçların, çalışma planların, görevlerin, odak kayıtların, beceri ve kanıtların, notların ve koç görüşmelerin hesabına bağlı olarak saklanabilir.</p></section>
      <section><h2 className="mb-2 text-base font-semibold text-foreground">2. İşleme amaçları ve hukuki sebep</h2><p>Bu veriler hesabı oluşturmak ve güvenli oturum açmayı sağlamak, ilerlemeyi cihazlar arasında eşitlemek, kişiselleştirilmiş plan ve analiz üretmek, AI koç özelliklerini sunmak ve hizmet güvenliğini korumak amacıyla işlenir. Hesap ve temel çalışma alanı verileri hizmetin kurulması ve ifası kapsamında işlenir.</p></section>
      <section><h2 className="mb-2 text-base font-semibold text-foreground">3. Verilerin aktarılması</h2><p>Kimlik doğrulama ve veri saklama için Google Firebase, uygulamanın barındırılması için Vercel ve yalnızca AI özelliklerini kullandığında yanıt üretimi için OpenAI hizmetlerinden yararlanılır. Bu sağlayıcıların sunucuları Türkiye dışında bulunabileceğinden veriler yurt dışına aktarılabilir. North, burada açıklanan amaç dışında veri satışı yapmaz.</p></section>
      <section><h2 className="mb-2 text-base font-semibold text-foreground">4. Saklama ve güvenlik</h2><p>Veriler hesabın açık olduğu süre boyunca veya hizmetin sunulması ve yasal yükümlülükler için gerekli süre boyunca saklanır. Hesabını sıfırlama ekranından silebilirsin. Aktarım sırasında güvenli bağlantılar ve hizmet sağlayıcıların erişim kontrolleri kullanılır.</p></section>
      <section><h2 className="mb-2 text-base font-semibold text-foreground">5. KVKK kapsamındaki hakların</h2><p>6698 sayılı Kanun&apos;un 11. maddesi kapsamında verilerinin işlenip işlenmediğini öğrenme, bilgi isteme, işleme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme, aktarılan tarafları bilme, eksik veya yanlış verilerin düzeltilmesini isteme, şartları oluştuğunda silme veya yok etme talep etme, otomatik analiz sonucuna itiraz etme ve zararın giderilmesini isteme haklarına sahipsin.</p></section>
    </CardContent></Card>
  </main>;
}
