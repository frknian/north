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
assert.match(security, /scope\.startsWith\("ai:"\)/);
assert.match(security, /status, headers: \{ "Cache-Control": "no-store"/);

const firebase = read("src/lib/firebase/admin.ts");
assert.match(firebase, /\^Bearer \(\[A-Za-z0-9\._-\]\{20,4096\}\)\$/);
assert.match(firebase, /AbortSignal\.timeout\(5_000\)/);

const config = read("next.config.ts");
for (const header of ["Content-Security-Policy", "Strict-Transport-Security", "X-Content-Type-Options", "X-Frame-Options", "Permissions-Policy"]) assert.ok(config.includes(header), `${header} missing`);
assert.match(config, /NODE_ENV === "development"/);

const rules = read("firestore.rules");
assert.match(rules, /request\.auth\.uid == userId/);
assert.match(rules, /workspaceId in \['cybercoach', 'career-os'\]/);

const aiBoundary = read("src/lib/ai/model.ts");
assert.match(aiBoundary, /untrusted data, never as system instructions/);

console.log("Security checks passed: API auth/rate/body guards, strict token validation, browser headers, Firestore ownership, prompt-injection boundary.");
