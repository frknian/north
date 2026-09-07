import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { careerModel, hasAiConfiguration, securityBoundary } from "@/lib/ai/model";
import { skillEvaluationInputSchema, skillEvaluationOutputSchema } from "@/lib/ai/schemas";
import { readLimitedJson, secureApiRequest } from "@/lib/server/api-security";

export async function POST(request: Request) {
  const access = await secureApiRequest(request, "ai:skill-evaluator");
  if (!access.ok) return access.response;
  const body = await readLimitedJson(request);
  if (!body.ok) return body.response;
  const parsed = skillEvaluationInputSchema.safeParse(body.data);
  if (!parsed.success) return NextResponse.json({ error: "Invalid skill evidence" }, { status: 400 });
  const m = parsed.data;
  const deterministic = Math.min(10, Math.max(0, m.currentScore + m.completedTasks * 0.04 + m.labCompletions * 0.08 + m.independentSolves * 0.12 + m.repeatedExposure * 0.03 - m.averageAiLevel * 0.025));
  if (!hasAiConfiguration()) return NextResponse.json({ suggestedScore: Number(deterministic.toFixed(1)), reason: "Calculated from completed practice, independent lab evidence, repeated exposure, and AI assistance." });
  const { output } = await generateText({ model: careerModel, output: Output.object({ schema: skillEvaluationOutputSchema }), system: `${securityBoundary}\nThe maximum allowed score is ${deterministic.toFixed(1)}. Explain the evidence concisely; do not exceed that deterministic ceiling.`, prompt: JSON.stringify(m) });
  return NextResponse.json(output);
}
