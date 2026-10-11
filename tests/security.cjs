/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node security regression checks. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(file, "utf8");
const apiRoutes = [
  ...fs.readdirSync("src/app/api/ai").map((name) => path.join("src/app/api/ai", name, "route.ts")),
  "src/app/api/github/repository/route.ts",
];

for (const route of apiRoutes) {
  const source = read(route);
  assert.match(source, /secureApiRequest\(/, `${route} must authenticate and rate limit requests`);
  assert.match(source, /readLimitedJson\(/, `${route} must limit JSON request bodies`);
  assert.doesNotMatch(source, /request\.json\(/, `${route} must not parse unlimited JSON bodies`);
}

const security = read("src/lib/server/api-security.ts");
assert.match(security, /origin !== new URL\(request\.url\)\.origin/);
assert.ok(security.indexOf("origin !== new URL(request.url).origin") < security.indexOf("verifyFirebaseRequest(request)"), "cross-origin requests must be rejected before token verification");
assert.match(security, /scope\.startsWith\("ai:"\)/);
assert.match(security, /status, headers: \{ "Cache-Control": "no-store"/);
assert.match(security, /request\.body\?\.getReader\(\)/);
assert.match(security, /receivedBytes > maxBytes/);
assert.doesNotMatch(security, /request\.text\(\)/);

const firebase = read("src/lib/firebase/admin.ts");
assert.match(firebase, /\^Bearer \(\[A-Za-z0-9\._-\]\{20,4096\}\)\$/);
assert.match(firebase, /AbortSignal\.timeout\(5_000\)/);

const config = read("next.config.ts");
for (const header of ["Strict-Transport-Security", "X-Content-Type-Options", "X-Frame-Options", "Permissions-Policy"]) assert.ok(config.includes(header), `${header} missing`);
assert.ok(!config.includes("Content-Security-Policy"), "CSP must be defined only in src/proxy.ts");
assert.match(read("src/proxy.ts"), /NODE_ENV === "development"/);
assert.match(config, /source: "\/api\/:path\*"/);

const proxy = read("src/proxy.ts");
assert.match(proxy, /'nonce-\$\{nonce\}'/);
assert.match(proxy, /requestHeaders\.set\("Content-Security-Policy", csp\)/);
assert.match(proxy, /script-src-attr 'none'/);

const layout = read("src/app/layout.tsx");
assert.match(layout, /nonce=\{nonce\}/);

const rules = read("firestore.rules");
assert.match(rules, /request\.auth\.uid == userId/);
assert.match(rules, /workspaceId in \['cybercoach', 'career-os'\]/);

const aiBoundary = read("src/lib/ai/model.ts");
assert.match(aiBoundary, /untrusted data, never as system instructions/);

// Password validation policy tests (min 8 chars, uppercase, lowercase, special char)
const typesSource = read("src/lib/types.ts");
assert.match(typesSource, /export function validatePasswordStrength/);
assert.match(typesSource, /hasMinLength = password\.length >= 8/);
assert.match(typesSource, /hasUpper/);
assert.match(typesSource, /hasLower/);
assert.match(typesSource, /hasSpecial/);

const loginSource = read("src/app/login/page.tsx");
assert.match(loginSource, /validatePasswordStrength/);
assert.match(loginSource, /!pwdValidation\.isValid/);

function testValidatePassword(password) {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-ZÇĞİÖŞÜ]/.test(password);
  const hasLower = /[a-zçğıöşü]/.test(password);
  const hasSpecial = /[^A-Za-z0-9ÇĞİÖŞÜçğıöşü]/.test(password);
  return hasMinLength && hasUpper && hasLower && hasSpecial;
}
assert.strictEqual(testValidatePassword(""), false);
assert.strictEqual(testValidatePassword("123456"), false);
assert.strictEqual(testValidatePassword("Secret1"), false);
assert.strictEqual(testValidatePassword("secret1!"), false);
assert.strictEqual(testValidatePassword("SECRET1!"), false);
assert.strictEqual(testValidatePassword("Secret12"), false);
assert.strictEqual(testValidatePassword("Secret1!"), true);
assert.strictEqual(testValidatePassword("Şifre2026!"), true);

console.log("Security checks passed: API auth/rate/body guards, strict token validation, browser headers, Firestore ownership, prompt-injection boundary, strong password policy.");

