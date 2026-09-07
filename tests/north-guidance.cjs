/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test runner. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadModule(path, context = {}) {
  const code = fs.readFileSync(path, 'utf8');
  const transpiled = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(
    transpiled,
    {
      module: mod,
      exports: mod.exports,
      require: (req) => {
        if (req === './domain-catalog') return loadModule('src/lib/domain-catalog.ts', context);
        if (req === './north') return loadModule('src/lib/north.ts', context);
        return {};
      },
      ...context,
    }
  );
  return mod.exports;
}

const guidanceModule = loadModule('src/lib/task-guidance.ts');
const { getTaskGuidance } = guidanceModule;

console.log('--- GÖREV REHBERLİĞİ & ALAN İZOLASYONU TESTLERİ ---');

// 1. SATRANÇ: "Aralıklı Tekrar: Taktikler" (Kullanıcının karşılaştığı kritik bug senaryosu)
const chessArea = { id: 'area-chess', name: 'Satranç', kind: 'chess', goal: '1800 Elo hedefine ulaşmak' };
const chessTask = { id: 't-chess-1', areaId: 'area-chess', title: 'Aralıklı Tekrar: Taktik Motifler', goal: '20 taktik bulmaca çöz' };

const chessGuidance = getTaskGuidance(chessTask, chessArea);
const chessText = JSON.stringify(chessGuidance).toLowerCase();

assert.ok(chessText.includes('lichess'), 'Satranç rehberliği Lichess kaynağı içermelidir');
assert.ok(chessText.includes('şat') || chessText.includes('şah'), 'Satranç rehberliği ŞAT veya şah taraması içermelidir');
assert.ok(!chessText.includes('ösym'), 'Satranç rehberliğinde KESİNLİKLE ÖSYM yer alamaz!');
assert.ok(!chessText.includes('cevap anahtarı'), 'Satranç rehberliğinde KESİNLİKLE Cevap Anahtarı yer alamaz!');
assert.ok(!chessText.includes('meb ogm'), 'Satranç rehberliğinde KESİNLİKLE MEB OGM yer alamaz!');
console.log('   ✓ 1. Satranç Aralıklı Tekrar test edildi: Sıfır ÖSYM sızıntısı, Lichess & ŞAT başarıyla doğrulandı.');

// 2. SATRANÇ: Soru kelimesi geçen bulmaca görevi
const chessTask2 = { id: 't-chess-2', areaId: 'area-chess', title: 'Günün taktik soru seti', goal: 'Açmaz ve çatal motiflerini tara' };
const chessGuidance2 = getTaskGuidance(chessTask2, chessArea);
const chessText2 = JSON.stringify(chessGuidance2).toLowerCase();

assert.ok(!chessText2.includes('ösym'), 'Satranç soru setinde ÖSYM yer alamaz');
assert.ok(chessText2.includes('taktik'), 'Satranç rehberliği taktik içeriği barındırmalıdır');
console.log('   ✓ 2. Satranç Taktik Soru Seti test edildi: Soru kelimesi sınav motorunu tetiklemedi.');

// 3. YAZILIM: Tekrar ve refactoring
const softwareArea = { id: 'area-dev', name: 'Yazılım Geliştirme', kind: 'projects', goal: 'Full stack uygulama geliştirmek' };
const softwareTask = { id: 't-dev-1', areaId: 'area-dev', title: 'Haftalık Tekrar & Kod Refactoring', goal: 'API uçlarını gözden geçir' };

const softwareGuidance = getTaskGuidance(softwareTask, softwareArea);
const softwareText = JSON.stringify(softwareGuidance).toLowerCase();

assert.ok(softwareText.includes('git'), 'Yazılım rehberliği Git içermelidir');
assert.ok(!softwareText.includes('ösym'), 'Yazılımda ÖSYM yer alamaz');
console.log('   ✓ 3. Yazılım Tekrar görevi test edildi: Git adımları doğrulandı, sıfır sınav sızıntısı.');

// 4. SİBER GÜVENLİK
const cyberArea = { id: 'area-cyber', name: 'Siber Güvenlik', kind: 'cyber', goal: 'SOC Analisti olmak' };
const cyberTask = { id: 't-cyb-1', areaId: 'area-cyber', title: 'SQLi Zafiyet Labı Çözümü', goal: 'PortSwigger labında payload dene' };

const cyberGuidance = getTaskGuidance(cyberTask, cyberArea);
const cyberText = JSON.stringify(cyberGuidance).toLowerCase();

assert.ok(cyberText.includes('portswigger') || cyberText.includes('zafiyet'), 'Siber güvenlik rehberliği doğru araçları içermelidir');
assert.ok(!cyberText.includes('ösym'), 'Siber güvenlikte ÖSYM yer alamaz');
console.log('   ✓ 4. Siber Güvenlik görevi test edildi: PortSwigger & zafiyet doğrulandı.');

// 5. YKS / TYT (GERÇEK AKADEMİK SINAV ALANI)
const examArea = { id: 'area-yks', name: 'YKS / TYT Hazırlık', kind: 'custom', goal: '100+ Net hedefine ulaşmak' };
const examTask = { id: 't-yks-1', areaId: 'area-yks', title: 'TYT Matematik Denemesi', goal: 'Süre tutarak 40 soru çöz ve net çıkar' };

const examGuidance = getTaskGuidance(examTask, examArea);
const examText = JSON.stringify(examGuidance).toLowerCase();

assert.ok(examText.includes('ösym'), 'YKS rehberliği ÖSYM kaynağını doğru biçimde içermelidir');
assert.ok(examText.includes('cevap anahtarı'), 'YKS rehberliği cevap anahtarı kontrolünü içermelidir');
console.log('   ✓ 5. Gerçek Sınav (YKS) test edildi: ÖSYM ve cevap anahtarı yalnızca sınav alanında aktif.');

// 6. MOBİL UYGULAMA GELİŞTİRME
const mobileArea = { id: 'area-mobile', name: 'Mobil Geliştirme', kind: 'projects', goal: 'Flutter ile mağazaya uygulama çıkarmak' };
const mobileTask = { id: 't-mob-1', areaId: 'area-mobile', title: 'Profil Ekranı Arayüzü', goal: 'State management bağla' };

const mobileGuidance = getTaskGuidance(mobileTask, mobileArea);
const mobileText = JSON.stringify(mobileGuidance).toLowerCase();

assert.ok(mobileText.includes('flutter') || mobileText.includes('android'), 'Mobil rehberlik mobil araçları içermelidir');
console.log('   ✓ 6. Mobil Geliştirme test edildi: Flutter/Android adımları doğrulandı.');

console.log('--- TÜM GÖREV REHBERLİĞİ VE ALAN İZOLASYON TESTLERİ BAŞARIYLA GEÇTİ ---');
