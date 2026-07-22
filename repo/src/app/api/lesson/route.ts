/**
 * POST /api/lesson
 * Photo Lesson tab — accepts a textbook page image (base64) + optional grade,
 * calls Gemma 3 4B-IT vision to extract text and produce a Hindi/English
 * explanation suitable for rural students.
 */

import { NextRequest, NextResponse } from "next/server";
import { gemmaVision, hasHfToken } from "@/lib/gemma";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, mimeType, grade, language } = body as {
      image: string;
      mimeType?: string;
      grade?: string;
      language?: "hi" | "en";
    };

    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Missing image (base64)" }, { status: 400 });
    }

    const lang = language === "en" ? "English" : "Hindi (Devanagari)";
    const gradeLabel = grade
      ? `The student is in ${grade}.`
      : "The student is in middle school (Class 6-10).";

    const systemPrompt = `You are Sahayak AI, a patient rural-India tutor. You explain textbook concepts in ${lang} using simple words and everyday examples a village student can relate to. Always structure your answer with: (1) what the page shows, (2) the key concept in one line, (3) a real-life example, (4) two practice questions. ${gradeLabel}`;

    const userPrompt = `Look at this textbook page image. Extract the visible text, identify the subject and topic, and explain the concept in ${lang}. Use simple language and at least one everyday example.`;

    const explanation = await gemmaVision(
      systemPrompt,
      userPrompt,
      image,
      mimeType ?? "image/jpeg"
    );

    return NextResponse.json({
      explanation,
      model: "google/gemma-3-4b-it",
      mode: hasHfToken() ? "live" : "mock",
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
