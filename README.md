# North

Kişisel siber güvenlik çalışma planını, lab günlüğünü, bağımsız çözüm oranını ve AI destekli değerlendirmeleri yöneten Türkçe web uygulaması.

## Yerelde çalıştırma

```bash
npm install
npm run dev
```

Firebase ayarları olmadan uygulama yerel modda çalışır ve verileri bu tarayıcıda saklar.

## Firebase ile cihazlar arası eşitleme

1. [Firebase Console](https://console.firebase.google.com) üzerinden ücretsiz Spark projesi oluştur.
2. **Authentication → Sign-in method** altında Email/Password yöntemini etkinleştir.
3. **Firestore Database** oluştur.
4. [firestore.rules](./firestore.rules) içeriğini Firestore Rules sekmesine yapıştırıp yayınla.
5. Web uygulaması ayarlarındaki değerlerle `.env.local` oluştur:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6
```

Firebase yapılandırıldığında e-posta/şifre hesabıyla giriş yapılır; veriler `users/{uid}/workspaces/cybercoach` belgesinde tutulur ve Firestore kuralları kullanıcıyı yalnızca kendi belgesiyle sınırlar. Eski `career-os` belgesi varsa ilk girişte otomatik olarak yeni alana taşınır.

## Kalite kontrolleri

```bash
npm run typecheck
npm run lint
npm run build
```
