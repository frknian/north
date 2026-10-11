import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Compass, Library, LineChart, Map as MapIcon, ShieldCheck, Sparkles, Timer } from "lucide-react";
import { NorthLogo } from "@/components/layout/north-logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: { absolute: "Planorth — Daha az karar, daha iyi odak" },
  description: "Hedeflerini haftalık yol haritasına çeviren, her gün sana tek bir sonraki adımı gösteren kişisel AI koçun.",
  alternates: { canonical: "/welcome" },
  openGraph: { title: "Planorth — kişisel odak koçun", description: "Yol haritası, günlük odak, takvim ve AI koç tek yerde.", type: "website", locale: "tr_TR" },
};

const features = [
  { icon: Sparkles, title: "AI Koç", text: "Hedefini anlat; koç planını yazsın, takıldığında yönlendirsin." },
  { icon: MapIcon, title: "Yol haritası", text: "Haftalık görevler. JSON, CSV, Markdown yükle ya da ChatGPT/Gemini çıktısını yapıştır." },
  { icon: Timer, title: "Odak oturumları", text: "Zamanlayıcı, notlar ve kaynaklar tek ekranda; oturum sonunda çıktını kaydet." },
  { icon: CalendarDays, title: "Takvim ve plan", text: "Görevler günlere dengeli dağılır; takvimini .ics ile dışa aktar." },
  { icon: Library, title: "Kütüphane", text: "Notlarını kaydet, aralıklı tekrarla kalıcı öğren." },
  { icon: LineChart, title: "Gerçek ilerleme", text: "Yalnızca tamamladığın işler sayılır; seri ve istatistikler dürüst." },
];

const steps = [
  { n: "1", title: "Hedefini yaz", text: "Ne öğrenmek ya da başarmak istediğini ve haftada ne kadar zaman ayırabileceğini söyle." },
  { n: "2", title: "Planı al", text: "Koç haftalık yol haritasını hazırlar; istediğin gibi düzenlersin." },
  { n: "3", title: "Her gün tek adım", text: "Ana ekran bugün yapman gereken en önemli işi gösterir. Başla, bitir, ilerle." },
];

export default function WelcomePage() {
  return (
    <div className="landing">
      <header className="landing-bar">
        <Link href="/welcome" className="landing-brand" aria-label="Planorth"><NorthLogo size={30} priority /><span className="font-planorth">Planorth</span></Link>
        <nav aria-label="Genel" className="landing-nav"><Link href="/support">Destek</Link><Button asChild size="sm"><Link href="/login">Giriş yap</Link></Button></nav>
      </header>
      <main>
        <section className="landing-hero">
          <p className="north-eyebrow">Kişisel odak koçun</p>
          <h1>Daha az karar.<br />Daha iyi odak.</h1>
          <p className="landing-lead">Planorth hedeflerini haftalık bir yol haritasına çevirir ve her gün sana yalnızca bir sonraki anlamlı adımı gösterir. Sınav, dil, yazılım ya da kişisel gelişim; hepsi tek yerde.</p>
          <div className="landing-cta"><Button asChild size="lg"><Link href="/login">Hemen başla <ArrowRight size={16} /></Link></Button><Button asChild size="lg" variant="outline"><Link href="#nasil">Nasıl çalışır?</Link></Button></div>
          <ul className="landing-proof" aria-label="Öne çıkanlar"><li><Compass size={15} />Tek anlamlı adım kuralı</li><li><ShieldCheck size={15} />Verilerini istediğin an indir ya da sil</li></ul>
        </section>
        <section id="nasil" className="landing-section">
          <h2>Nasıl çalışır?</h2>
          <ol className="landing-steps">{steps.map((step) => <li key={step.n}><span>{step.n}</span><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
        </section>
        <section className="landing-section">
          <h2>İhtiyacın olan her şey</h2>
          <div className="landing-grid">{features.map((feature) => <article key={feature.title}><feature.icon size={20} /><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div>
        </section>
        <section className="landing-final"><h2>Bugün bir adımla başla</h2><p>Hesap oluşturmak bir dakika sürer.</p><Button asChild size="lg"><Link href="/login">Hesap oluştur</Link></Button></section>
      </main>
      <footer className="landing-footer"><span>© {new Date().getFullYear()} Planorth</span><nav aria-label="Alt bağlantılar"><Link href="/kvkk">KVKK Aydınlatma Metni</Link><Link href="/support">Destek ve iletişim</Link><Link href="/login">Giriş</Link></nav></footer>
    </div>
  );
}
