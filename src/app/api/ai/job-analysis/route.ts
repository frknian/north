import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { careerModel, hasAiConfiguration } from "@/lib/ai/model";
import { jobAnalysisInputSchema, jobAnalysisOutputSchema } from "@/lib/ai/schemas";
import { verifyFirebaseRequest } from "@/lib/firebase/admin";
export async function POST(request: Request) { if (!await verifyFirebaseRequest(request)) return NextResponse.json({error:"Oturum gerekli."},{status:401}); const parsed=jobAnalysisInputSchema.safeParse(await request.json()); if(!parsed.success)return NextResponse.json({error:"Geçersiz ilan."},{status:400}); if(!hasAiConfiguration())return NextResponse.json({error:"OpenAI anahtarı eksik."},{status:503}); try {const result=await generateText({model:careerModel,output:Output.object({schema:jobAnalysisOutputSchema}),system:"Türkçe konuşan siber güvenlik kariyer analizcisisin. Yalnızca ilan metnindeki gereksinimleri çıkar. Kullanıcının kanıtlanmış skill puanlarıyla gerçekçi match skoru üret; asla deneyim uydurma.",prompt:JSON.stringify(parsed.data)});return NextResponse.json(result.output)}catch{return NextResponse.json({error:"İlan analizi şu an yapılamadı."},{status:502})} }
