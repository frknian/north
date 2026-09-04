import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { careerModel, hasAiConfiguration, securityBoundary } from "@/lib/ai/model";
import { interviewInputSchema, interviewOutputSchema } from "@/lib/ai/schemas";
import { verifyFirebaseRequest } from "@/lib/firebase/admin";
export async function POST(request: Request) { if (!await verifyFirebaseRequest(request)) return NextResponse.json({error:"Oturum gerekli."},{status:401}); const parsed=interviewInputSchema.safeParse(await request.json()); if(!parsed.success)return NextResponse.json({error:"Geçersiz mülakat yanıtı."},{status:400}); if(!hasAiConfiguration())return NextResponse.json({error:"OpenAI anahtarı eksik."},{status:503}); try {const result=await generateText({model:careerModel,output:Output.object({schema:interviewOutputSchema}),system:`${securityBoundary}\nTürkçe veya İngilizce siber güvenlik mülakat değerlendiricisisin. Teknik doğruluk, kapsam ve iletişime dürüst, yapıcı puan ver.`,prompt:JSON.stringify(parsed.data)});return NextResponse.json(result.output)}catch{return NextResponse.json({error:"Mülakat değerlendirmesi şu an yapılamadı."},{status:502})} }
