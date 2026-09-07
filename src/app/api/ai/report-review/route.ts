import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { careerModel, hasAiConfiguration, securityBoundary } from "@/lib/ai/model";
import { reportReviewInputSchema, reportReviewOutputSchema } from "@/lib/ai/schemas";
import { readLimitedJson, secureApiRequest } from "@/lib/server/api-security";

export async function POST(request: Request) {
  const access = await secureApiRequest(request, "ai:report-review");
  if (!access.ok) return access.response;
  const body = await readLimitedJson(request);
  if (!body.ok) return body.response;
  const parsed = reportReviewInputSchema.safeParse(body.data);
  if (!parsed.success) return NextResponse.json({ error: "Complete the finding title before evaluation." }, { status: 400 });
  const finding = parsed.data;
  if (!hasAiConfiguration()) {
    const score = (value: string, target: number) => Math.min(9, Math.max(2, Math.round(value.trim().length / target * 8)));
    return NextResponse.json({ clarity: score(finding.description, 180), technicalAccuracy: score(finding.evidence + finding.steps, 260), impactExplanation: score(finding.impact, 140), remediationQuality: score(finding.remediation, 160), feedback: ["Tie each claim to a specific piece of evidence.", "Explain the realistic security impact for the affected asset.", "Make remediation testable and implementation-specific."], fallback: true });
  }
  const { output } = await generateText({ model: careerModel, output: Output.object({ schema: reportReviewOutputSchema }), system: `${securityBoundary}\nReview this cybersecurity lab finding. Score clarity, technical accuracy, impact explanation and remediation quality from 0–10. Give concise coaching only. Do not rewrite the finding unless explicitly requested.`, prompt: JSON.stringify(finding) });
  return NextResponse.json(output);
}
