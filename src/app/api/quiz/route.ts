/**
 * POST /api/quiz
 * Quiz Builder tab — takes a topic + grade + count, asks Gemma 4 to generate
 * a structured JSON quiz. We instruct the model to return strict JSON so the
 * UI can render MCQs with grading.
 */

import { NextRequest, NextResponse } from "next/server";
import { gemmaText, hasHfToken, type GemmaMessage } from "@/lib/gemma";

export const runtime = "nodejs";
export const maxDuration = 60;

export type Quiz = {
  title: string;
  questions: Array<{
    q: string;
    options: string[];
    answer: number;
    explanation: string;
  }>;
};

export async function POST(req: NextRequest) {
  try {
    const { topic, grade, count, language } = (await req.json()) as {
      topic: string;
      grade?: string;
      count?: number;
      language?: "hi" | "en";
    };

    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "Missing topic" }, { status: 400 });
    }

    const n = Math.min(Math.max(count ?? 3, 1), 6);
    const lang = language === "en" ? "English" : "Hindi (Devanagari)";
    const gradeLabel = grade ? `Suitable for ${grade}.` : "Suitable for Class 6-10.";

    const messages: GemmaMessage[] = [
      {
        role: "system",
        content: `You are Sahayak AI's quiz generator. Produce ${n} multiple-choice questions about the given topic in ${lang}. ${gradeLabel} Each question has exactly 4 options. Return STRICT JSON only — no markdown, no prose. Schema: {"title": string, "questions": [{"q": string, "options": string[4], "answer": number (0-3), "explanation": string}]}.`,
      },
      { role: "user", content: `Topic: ${topic}` },
    ];

    const raw = await gemmaText(messages, { temperature: 0.5, maxTokens: 1400 });

    // Try to parse JSON. If the model wrapped in code fences, strip them.
    let quiz: Quiz;
    try {
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      quiz = JSON.parse(cleaned);
    } catch {
      // Fall back to a minimal quiz so the UI never crashes
      quiz = {
        title: `${topic} — Quiz`,
        questions: [
          {
            q: `What is ${topic}? (Gemma returned non-JSON output — fallback question)`,
            options: ["A concept", "A place", "A person", "An object"],
            answer: 0,
            explanation: "The model output could not be parsed. Try again.",
          },
        ],
      };
    }

    return NextResponse.json({
      quiz,
      model: "google/gemma-3-4b-it",
      mode: hasHfToken() ? "live" : "mock",
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
