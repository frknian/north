import type { Metadata } from "next";
import Link from "next/link";
import { SupportForm } from "./support-form";

export const metadata: Metadata = {
  title: "Destek ve iletişim",
  description: "Planorth hakkında sık sorulan sorular, hata bildirimi ve öneri formu.",
  alternates: { canonical: "/support" },
};

const faqs = [
  { q: "Verilerimi nasıl indirebilirim?", a: "Giriş yaptıktan sonra Verilerim sayfasından tüm çalışma alanının JSON kopyasını indirebilir, aynı dosyayı geri yükleyebilirsin." },
  { q: "Hesabımı nasıl silerim?", a: "Hesap ve Güvenlik bölümünde ya da /account-reset sayfasında şifreni doğrulayıp hesabını ve bulut verilerini kalıcı olarak silebilirsin." },
  { q: "Şifremi unuttum.", a: "Giriş ekranında “Şifremi unuttum” bağlantısıyla e-postana sıfırlama bağlantısı gönderebilirsin." },
  { q: "Yol haritamı başka bir yerden getirebilir miyim?", a: "Evet. Yol Haritam ekranında JSON, CSV, Markdown veya metin yükleyebilir, ChatGPT ya da Gemini’nin hazırladığı planı yapıştırabilirsin." },
  { q: "AI Koç neden bazen yanıt vermiyor?", a: "Koç isteklerin dakikalık ve günlük bir sınırı var. Sınıra ulaştıysan bir süre sonra tekrar dene. Sorun sürerse aşağıdan bildir." },
  { q: "Takvimimi telefonuma ekleyebilir miyim?", a: "Takvim ekranındaki “Takvime aktar (.ics)” düğmesiyle planlı görevlerini Google, Apple veya Outlook takvimine ekleyebilirsin." },
];

export default function SupportPage() {
  return (
    <main className="support-page">
      <p className="north-eyebrow">Destek</p>
      <h1>Nasıl yardımcı olabiliriz?</h1>
      <p className="support-lead">Önce sık sorulan sorulara göz at. Cevabı bulamazsan hata bildirimi, öneri ya da sorunu aşağıdan gönder.</p>
      <section aria-labelledby="sss"><h2 id="sss">Sık sorulan sorular</h2>
        <div className="support-faq">{faqs.map((item) => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</div>
      </section>
      <section aria-labelledby="form"><h2 id="form">Bize yaz</h2><SupportForm /></section>
      <p className="support-links"><Link href="/kvkk">KVKK Aydınlatma Metni</Link><Link href="/welcome">Ana sayfa</Link><Link href="/">Uygulamaya dön</Link></p>
    </main>
  );
}
