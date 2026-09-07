import { generateText } from "ai";
import { NextResponse } from "next/server";
import { careerModel, hasAiConfiguration, securityBoundary } from "@/lib/ai/model";
import { mentorInputSchema } from "@/lib/ai/schemas";
import { readLimitedJson, secureApiRequest } from "@/lib/server/api-security";

export async function POST(request: Request) {
  const access = await secureApiRequest(request, "ai:mentor");
  if (!access.ok) return access.response;
  const body = await readLimitedJson(request);
  if (!body.ok) return body.response;
  const parsed = mentorInputSchema.safeParse(body.data);
  if (!parsed.success) return NextResponse.json({ error: "Invalid mentor context" }, { status: 400 });
  const { requestedLevel, question, lab } = parsed.data;
  if (requestedLevel === 0) return NextResponse.json({ answer: "Level 0 is active. Continue independently and record your next observation." });
  if (!hasAiConfiguration()) {
    const answer = requestedLevel === 1
      ? "Small hint: compare what you have enumerated with the services you have not yet validated. Pick one missing evidence point."
      : requestedLevel === 2
        ? "Your notes identify a service but not its access boundaries. Investigate what unauthenticated or low-privilege information that service exposes, then record the exact response."
        : requestedLevel === 3
          ? "1) List confirmed open services. 2) For each, write one safe enumeration question. 3) Run only the test for the highest-confidence service. 4) Bring back the exact output before choosing an exploit path."
          : "Full-solution mode requires a configured OpenAI key. For now, turn your recon output into service → evidence → hypothesis rows and validate them one at a time.";
    return NextResponse.json({ answer, fallback: true });
  }
  const levelRules = ["No help.", "Give one small hint.", "Suggest a direction or investigation question.", "Guide step-by-step without revealing the full solution.", "Explain the full solution because the user explicitly requested level 4."];
  const { text } = await generateText({
    model: careerModel,
    system: `${securityBoundary}\nYou are a patient pentest lab mentor. Evaluate current findings, identify the missing thought, give only the next logical step, then stop. ${levelRules[requestedLevel]}`,
    prompt: `Lab context: ${JSON.stringify(lab)}\nUser question: ${question}`,
  });
  return NextResponse.json({ answer: text });
}
