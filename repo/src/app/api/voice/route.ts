/**
 * POST /api/voice
 * Voice Doubt tab — accepts either a base64 audio blob (which would normally
 * be passed to an ASR model like Whisper) or a transcript. In production, this
 * route would call an ASR endpoint first; for the sprint we accept either
 * path so the demo is resilient. Returns a Gemma 4 explanation in the same
 * language as the question.
 */

import { NextRequest, NextResponse } from "next/server";
import { gemmaText, hasHfToken, type GemmaMessage } from "@/lib/gemma";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transcript, language, audio } = body as {
      transcript?: string;
      audio?: string;
      language?: "hi" | "en";
    };

    // If only audio is provided we'd normally call Whisper here. For the
    // sprint we surface a friendly note that ASR wiring is left to deployment.
    const question = transcript?.trim();
    if (!question) {
      return NextResponse.json(
        {
          error:
            "No transcript provided. Wire an ASR model (e.g. openai/whisper-small) to consume the audio field.",
        },
        { status: 400 }
      );
    }

    const lang = language === "en" ? "English" : "Hindi (Devanagari)";
    const messages: GemmaMessage[] = [
      {
        role: "system",
        content: `You are Sahayak AI, a voice-based tutor for rural Indian students. The student just asked a question in ${lang}. Answer in the same language, using simple words and a concrete everyday example. Keep the answer under 150 words. End with one follow-up question to check understanding.`,
      },
      { role: "user", content: question },
    ];

    const answer = await gemmaText(messages, { temperature: 0.6, maxTokens: 600 });
    return NextResponse.json({
      question,
      answer,
      model: "google/gemma-3-4b-it",
      mode: hasHfToken() ? "live" : "mock",
      audioProvided: Boolean(audio),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
