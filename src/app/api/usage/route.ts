import { NextResponse } from "next/server";
import { AI_LIMITS } from "@/lib/ai/limits";
import { peekDailyUsage, secureApiRequest } from "@/lib/server/api-security";

export async function GET(request: Request) {
  const access = await secureApiRequest(request, "usage", { unlimited: true });
  if (!access.ok) return access.response;
  const uid = access.user.uid;
  const [roadmap, levelTest, tools] = await Promise.all([
    peekDailyUsage(uid, "ai:roadmap"),
    peekDailyUsage(uid, "ai:level-test"),
    // The shared tool counter is the global AI counter.
    peekDailyUsage(uid, "ai:global"),
  ]);
  return NextResponse.json({
    roadmap: { used: roadmap, limit: AI_LIMITS.roadmap },
    levelTest: { used: levelTest, limit: AI_LIMITS.levelTest },
    tools: { used: tools, limit: AI_LIMITS.tools },
    coach: { unlimited: true },
  });
}
