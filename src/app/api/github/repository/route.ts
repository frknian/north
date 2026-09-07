import { readLimitedJson, secureApiRequest } from "@/lib/server/api-security";

export async function POST(request: Request) {
  const access = await secureApiRequest(request, "github:repository", { perMinute: 20, perDay: 200 });
  if (!access.ok) return access.response;
  const body = await readLimitedJson(request, 8 * 1024);
  if (!body.ok) return body.response;
  let path: string;
  try {
    const { url } = body.data as { url?: unknown };
    if (typeof url !== "string" || url.length > 300) throw new Error();
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.hostname !== "github.com" || parsed.username || parsed.password || !/^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(parsed.pathname)) throw new Error();
    path = parsed.pathname.replace(/\/$/, "").replace(/\.git$/, "");
  } catch { return Response.json({ error: "https://github.com/kullanici/repo biçiminde bir adres gir." }, { status: 400 }); }
  const options = { headers: { Accept: "application/vnd.github+json", "User-Agent": "North" }, next: { revalidate: 300 }, signal: AbortSignal.timeout(10000) };
  try {
    const repo = await fetch(`https://api.github.com/repos${path}`, options);
    if (!repo.ok) return Response.json({ error: repo.status === 404 ? "Repo bulunamadı. Yalnızca herkese açık repolar destekleniyor." : "GitHub isteği karşılanamadı; daha sonra tekrar dene." }, { status: repo.status === 404 ? 404 : 502 });
    const data = await repo.json();
    const [readme, commits] = await Promise.all([fetch(`https://api.github.com/repos${path}/readme`, options), fetch(`https://api.github.com/repos${path}/commits?per_page=1`, options)]);
    if ((!readme.ok && readme.status !== 404) || (!commits.ok && commits.status !== 409)) throw new Error("GitHub ayrıntıları alınamadı.");
    const readmeData = readme.ok ? await readme.json() : null;
    const commitData = commits.ok ? await commits.json() : [];
    return Response.json({ title: data.full_name, url: data.html_url, description: data.description ?? "", lastCommitAt: commitData[0]?.commit?.committer?.date, readme: readmeData?.content ? Buffer.from(readmeData.content, "base64").toString("utf8").slice(0, 12000) : "", language: data.language ?? "", fetchedAt: new Date().toISOString() });
  } catch { return Response.json({ error: "GitHub bağlantısı tamamlanamadı. Tekrar dene." }, { status: 502 }); }
}
