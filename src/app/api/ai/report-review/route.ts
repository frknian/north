import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { careerModel, hasAiConfiguration } from "@/lib/ai/model";
import { reportReviewInputSchema, reportReviewOutputSchema } from "@/lib/ai/schemas";
import { verifyFirebaseRequest } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  if (!await verifyFirebaseRequest(request)) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const parsed = reportReviewInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Complete the finding title before evaluation." }, { status: 400 });
  const finding = parsed.data;
  if (!hasAiConfiguration()) {
    const score = (value: string, target: number) => Math.min(9, Math.max(2, Math.round(value.trim().length / target * 8)));
    return NextResponse.json({ clarity: score(finding.description, 180), technicalAccuracy: score(finding.evidence + finding.steps, 260), impactExplanation: score(finding.impact, 140), remediationQuality: score(finding.remediation, 160), feedback: ["Tie each claim to a specific piece of evidence.", "Explain the realistic security impact for the affected asset.", "Make remediation testable and implementation-specific."], fallback: true });
  }
  const { output } = await generateText({ model: careerModel, output: Output.object({ schema: reportReviewOutputSchema }), system: "Review this cybersecurity lab finding. Score clarity, technical accuracy, impact explanation and remediation quality from 0–10. Give concise coaching only. Do not rewrite the finding unless explicitly requested.", prompt: JSON.stringify(finding) });
  return NextResponse.json(output);
}
