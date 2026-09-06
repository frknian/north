import Link from "next/link";
import { Bot, CheckCircle2, CircleHelp, Clock3, Compass, Database, Flag, Focus, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const firstSteps = [
  { icon: Target, title: "Hedefini netleştir", text: "Profil bölümünde ana odağını ve 90 günlük ölçülebilir sonucunu yaz." },
  { icon: Compass, title: "Planını kontrol et", text: "Bugün ekranındaki ilk görevi ve 30–60–90 günlük kilometre taşlarını incele." },
  { icon: Focus, title: "Tek göreve odaklan", text: "Odak sayacını başlat, çalışmanı bitirince sonucu ve kısa notunu kaydet." },
  { icon: CheckCircle2, title: "Kanıt ekle", text: "Ürettiğin belgeyi, projeyi, sertifikayı veya bağlantıyı Kanıtlar bölümüne ekle." },
];

const guideSections = [
  { title: "Her gün ne yapmalıyım?", body: "Bugün ekranında günlük check-in'i doldur. North süre ve enerji durumuna göre önceliğini gösterir. Önce tek ana görevi tamamla; vaktin kalırsa ikinci göreve geç." },
  { title: "North Koç ile nasıl konuşmalıyım?", body: "Doğal biçimde yazabilirsin: “Bugün 30 dakikam var”, “Bu görevi yapamadım, küçült”, “Hedefimi değiştirdim” veya “Son çalışmalarımı analiz et”. Koç değişiklikleri önce önerir; sen onaylamadan planına uygulamaz." },
  { title: "İlerleme neye göre hesaplanır?", body: "İlerleme; gerçek odak süresi, tamamlanan görevler, üretilen kanıtlar ve düzenli check-in kayıtlarından gelir. North veri yokken başarı veya başarısızlık uydurmaz." },
  { title: "Planım ağır gelirse ne yapmalıyım?", body: "North Koç'a görevi küçültmesini veya haftalık havuza almasını söyle. Profil bölümünden haftalık kapasiteyi ve oturum süresini de değiştirebilirsin." },
  { title: "Haftayı nasıl kapatmalıyım?", body: "Hafta sonunda Değerlendirmeler ekranını aç. Tamamlananları, ertelenenleri, darboğazı ve gelecek haftanın tek ana önceliğini belirle." },
  { title: "Verilerimi nasıl korurum?", body: "Verilerim ve güvenlik ekranından çalışma alanının bir kopyasını indirebilirsin. Aynı ekranda gizlilik metni, eşitleme durumu ve hesap silme kontrolleri bulunur." },
];

export function UserGuide() {
  return <div className="space-y-5">
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-2 text-primary"><Sparkles className="size-5" /></div><div><CardTitle>North’a ilk 10 dakika</CardTitle><CardDescription>Ürünü doğru kurmak için bu dört adımı sırayla tamamla.</CardDescription></div></div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {firstSteps.map((step, index) => <div key={step.title} className="rounded-xl border bg-muted/20 p-4"><div className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{index + 1}</span><step.icon className="size-4 text-primary" /><p className="font-medium">{step.title}</p></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p></div>)}
      </CardContent>
    </Card>

    <div className="grid gap-5 lg:grid-cols-[1fr_.7fr]">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CircleHelp className="size-5 text-primary" />Kullanım kılavuzu</CardTitle><CardDescription>İhtiyacın olan başlığı açarak kısa cevaba ulaş.</CardDescription></CardHeader>
        <CardContent className="divide-y">
          {guideSections.map((section, index) => <details key={section.title} open={index === 0} className="group py-4"><summary className="cursor-pointer list-none font-medium marker:hidden"><span className="flex items-center justify-between gap-3">{section.title}<span className="text-muted-foreground transition group-open:rotate-45">+</span></span></summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{section.body}</p></details>)}
        </CardContent>
      </Card>

      <div className="space-y-5">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="size-5 text-primary" />Hazır komutlar</CardTitle><CardDescription>North Koç’a bunlardan biriyle başlayabilirsin.</CardDescription></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p className="rounded-lg border p-3">“Bugün için tek öncelik seç.”</p>
            <p className="rounded-lg border p-3">“Bu görevi yapamadım, küçült.”</p>
            <p className="rounded-lg border p-3">“Son yedi günümü analiz et.”</p>
            <p className="rounded-lg border p-3">“30–60–90 günlük planımı güncelle.”</p>
            <Button className="mt-2 w-full" asChild><Link href="/north-ai"><Bot />North Koç’u aç</Link></Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock3 className="size-5 text-primary" />Önerilen ritim</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm"><GuideRow icon={Flag} label="Her sabah" value="Günlük check-in" /><GuideRow icon={Focus} label="Her çalışma" value="Odak kaydı" /><GuideRow icon={Database} label="Her çıktı" value="Kanıt ekleme" /><GuideRow icon={Compass} label="Her hafta" value="Değerlendirme" /></CardContent>
        </Card>
      </div>
    </div>
  </div>;
}

function GuideRow({ icon: Icon, label, value }: { icon: typeof Flag; label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"><span className="flex items-center gap-2 text-muted-foreground"><Icon className="size-4" />{label}</span><span className="font-medium">{value}</span></div>;
}
