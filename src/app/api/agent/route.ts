/**
 * POST /api/agent
 * Agent Lab tab — demonstrates Gemma 4's native function calling. The student
 * asks a question that requires external data ("Tell me about photosynthesis"
 * → search_wikipedia; "What's the weather in Patna?" → get_weather;
 * "What is 12 * 7?" → calculate). The route runs a multi-step tool-use loop
 * and returns both the final answer and the full reasoning trace so judges
 * can see Gemma deciding which tool to call.
 */

import { NextRequest, NextResponse } from "next/server";
import { gemmaChatWithTools, hasHfToken, type GemmaMessage } from "@/lib/gemma";
import { SAHAYAK_TOOLS, executeTool } from "@/lib/tools";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  try {
    const { question, language } = (await req.json()) as {
      question: string;
      language?: "hi" | "en";
    };

    if (!question) {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    const lang = language === "en" ? "English" : "Hindi (Devanagari)";

    const messages: GemmaMessage[] = [
      {
        role: "system",
        content: `You are Sahayak AI, an autonomous tutor agent for rural Indian students. You can call tools to fetch real-world information. Decide which tool (if any) is needed, call it, then answer the student in ${lang} using simple language. If no tool is needed, answer directly.`,
      },
      { role: "user", content: question },
    ];

    const { finalText, trace } = await gemmaChatWithTools(
      messages,
      SAHAYAK_TOOLS,
      async (call) => executeTool(call.name, call.arguments),
      4
    );

    // Strip system message from the public trace for clarity
    const publicTrace = trace.filter((m) => m.role !== "system");

    return NextResponse.json({
      answer: finalText,
      trace: publicTrace,
      toolsAvailable: SAHAYAK_TOOLS.map((t) => t.function.name),
      model: "google/gemma-3-4b-it",
      mode: hasHfToken() ? "live" : "mock",
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
