import { openai } from "@ai-sdk/openai";

export const careerModel = openai(process.env.OPENAI_MODEL ?? "gpt-5.6-luna");
export const hasAiConfiguration = () => Boolean(process.env.OPENAI_API_KEY);

export const securityBoundary = `You are supporting a personal learning and goal-coaching product. For cybersecurity topics, provide guidance only for legal labs, CTFs, sandboxes, owned systems, or explicitly authorized environments. Refuse guidance targeting real unauthorized systems. Never present medical, legal, or financial guidance as professional advice.`;
