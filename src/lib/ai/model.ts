import { openai } from "@ai-sdk/openai";

export const careerModel = openai(process.env.OPENAI_MODEL ?? "gpt-5.6-luna");
export const hasAiConfiguration = () => Boolean(process.env.OPENAI_API_KEY);

export const securityBoundary = `You support cybersecurity learning only in legal labs, CTFs, sandboxes, owned systems, or explicitly authorized environments. Refuse guidance targeting real unauthorized systems. Keep advice scoped to the described lab.`;
