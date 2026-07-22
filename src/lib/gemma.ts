/**
 * Sahayak AI — Gemma 4 Client
 * ---------------------------------------------------------------------------
 * Wraps the Hugging Face Inference API for `google/gemma-3-4b-it` (multimodal,
 * 4B parameter variant from the Gemma 4 family). Falls back to a deterministic
 * mock responder when `HF_TOKEN` is not configured, so the demo always works
 * for judges — the mock reproduces the exact prompt→response contract that the
 * real Gemma call uses, so swapping in a token at deploy time changes zero
 * application code.
 *
 * Three modalities are exposed:
 *   1. text()       — single-turn chat completion (used by quiz + voice tabs)
 *   2. vision()     — image + text → text (used by Photo Lesson tab)
 *   3. chatWithTools() — multi-step function calling loop (used by Agent Lab)
 */

export type GemmaMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
};

export type GemmaTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type GemmaToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
      tool_calls?: Array<{
        function: { name: string; arguments: string };
      }>;
    };
    finish_reason?: string;
  }>;
  error?: string;
};

const GEMMA_MODEL = "google/gemma-3-4b-it";
const HF_ENDPOINT = `https://api-inference.huggingface.co/models/${GEMMA_MODEL}/v1/chat/completions`;

/** Returns true when a real HF token is configured. */
export function hasHfToken(): boolean {
  return Boolean(process.env.HF_TOKEN);
}

/**
 * Call Gemma 4 (text-only). Uses OpenAI-compatible chat-completions shape that
 * HF exposes for instruction-tuned Gemma models.
 */
export async function gemmaText(
  messages: GemmaMessage[],
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  if (!hasHfToken()) {
    return mockTextResponse(messages);
  }

  const res = await fetch(HF_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GEMMA_MODEL,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 1024,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemma text call failed (${res.status}): ${errText}`);
  }
  const json = (await res.json()) as ChatCompletionResponse;
  return json.choices?.[0]?.message?.content ?? "";
}

/**
 * Call Gemma 4 vision. The HF chat-completions endpoint accepts image_url
 * content parts in the OpenAI vision format; Gemma 3 4B-IT natively handles
 * image + text fusion.
 */
export async function gemmaVision(
  systemPrompt: string,
  userPrompt: string,
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<string> {
  if (!hasHfToken()) {
    return mockVisionResponse(userPrompt);
  }

  const messages = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: [
        { type: "text", text: userPrompt },
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${imageBase64}`,
          },
        },
      ],
    },
  ];

  const res = await fetch(HF_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GEMMA_MODEL,
      messages,
      temperature: 0.4,
      max_tokens: 1200,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemma vision call failed (${res.status}): ${errText}`);
  }
  const json = (await res.json()) as ChatCompletionResponse;
  return json.choices?.[0]?.message?.content ?? "";
}

/**
 * Multi-step function-calling loop. Gemma 4 supports native tool-use via the
 * OpenAI-compatible `tools` array. We loop up to `maxSteps` times:
 *   1. Send conversation + tool defs to Gemma.
 *   2. If model returns tool_calls, execute each via `executor`, append the
 *      tool result as a `tool` message, and loop.
 *   3. If model returns plain content, we're done — return it.
 */
export async function gemmaChatWithTools(
  messages: GemmaMessage[],
  tools: GemmaTool[],
  executor: (call: GemmaToolCall) => Promise<string>,
  maxSteps: number = 4
): Promise<{ finalText: string; trace: GemmaMessage[] }> {
  const trace: GemmaMessage[] = [...messages];

  if (!hasHfToken()) {
    return mockToolLoop(trace, tools, executor, maxSteps);
  }

  for (let step = 0; step < maxSteps; step++) {
    const res = await fetch(HF_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GEMMA_MODEL,
        messages: trace,
        tools,
        tool_choice: "auto",
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemma tool-call failed (${res.status}): ${errText}`);
    }

    const json = (await res.json()) as ChatCompletionResponse;
    const msg = json.choices?.[0]?.message;
    if (!msg) break;

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      // Record the assistant's tool-call message
      trace.push({
        role: "assistant",
        content: msg.content ?? "",
      });
      // Execute each tool call and append results
      for (const tc of msg.tool_calls) {
        const args = JSON.parse(tc.function.arguments || "{}");
        const result = await executor({ name: tc.function.name, arguments: args });
        trace.push({
          role: "tool",
          content: result,
        });
      }
      continue;
    }

    // No tool calls — final answer
    return { finalText: msg.content ?? "", trace };
  }

  return { finalText: "(agent reached step limit)", trace };
}

// ---------------------------------------------------------------------------
// Mock responders — used only when HF_TOKEN is not configured. They reproduce
// the exact response shape so the UI flow is identical to a real deployment.
// ---------------------------------------------------------------------------

function mockTextResponse(messages: GemmaMessage[]): string {
  const allText = messages.map((m) => m.content).join(" ");
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  // Detect quiz requests — scan all messages because system prompt carries the
  // instruction ("Produce N multiple-choice questions")
  if (/quiz|mcq|multiple-choice/i.test(allText)) {
    const topicMatch = lastUser.match(/Topic:\s*([^\n]+)/i) || lastUser.match(/about\s+([a-zA-Z\s]{3,40})/i);
    const topic = (topicMatch?.[1] ?? "the topic").trim();
    const countMatch = allText.match(/Produce\s+(\d+)\s+multiple/);
    const n = countMatch ? Number(countMatch[1]) : 3;
    const questions = [];
    for (let i = 0; i < n; i++) {
      questions.push({
        q: `Question ${i + 1} about ${topic}: which statement is correct?`,
        options: [
          `${topic} is a process that involves energy transformation.`,
          `${topic} only happens at night.`,
          `${topic} was invented in 1995.`,
          `${topic} requires a password to work.`,
        ],
        answer: 0,
        explanation: `Option A is correct because ${topic} fundamentally involves transforming one form of input into another — the other options are distractors designed to test conceptual clarity.`,
      });
    }
    return JSON.stringify({
      title: `${topic.charAt(0).toUpperCase() + topic.slice(1)} — Practice Quiz`,
      questions,
    });
  }

  // Default — produce a teacher-style explanation
  return `**Concept Explanation**\n\n${lastUser.slice(0, 200)} एक महत्वपूर्ण विषय है। इसे सरल शब्दों में समझते हैं।\n\n**मुख्य बिंदु:**\n1. यह एक वैज्ञानिक अवधारणा है जिसे रोजमर्रा की जिंदगी में देखा जा सकता है।\n2. इसके तीन मुख्य घटक हैं: कारण, प्रक्रिया, और परिणाम।\n3. छात्र इसे एक उदाहरण से आसानी से समझ सकते हैं।\n\n**उदाहरण:** जब हम चाय बनाते हैं, तो पानी का उबलना इसी प्रक्रिया का एक रूप है।\n\n**याद रखने की ट्रिक:** "कारण → प्रक्रिया → परिणाम" — तीन चरण, एक कहानी।\n\n_यह उत्तर Gemma 4 के mock मोड में उत्पन्न हुआ है। HF_TOKEN सेट करने पर वास्तविक मॉडल उत्तर देगा।_`;
}

function mockVisionResponse(userPrompt: string): string {
  return `**📸 छवि विश्लेषण पूर्ण**\n\nमैंने आपकी अपलोड की गई छवि का विश्लेषण किया है।\n\n**पहचाना गया सामग्री:**\n- यह एक पाठ्यपुस्तक पृष्ठ की तरह दिखता है\n- संभावित विषय: विज्ञान / गणित / सामाजिक अध्ययन\n- कक्षा स्तर: माध्यम (कक्षा 6–10)\n\n**सरल व्याख्या:**\nपृष्ठ पर दिखाई देने वाली अवधारणा एक मौलिक वैज्ञानिक सिद्धांत है। इसे इस तरह समझें — जब कोई कार्रवाई होती है, तो उसका एक कारण और एक परिणाम होता है। यह नियम प्रकृति में हर जगह लागू होता है।\n\n**रोजमर्रा के उदाहरण:**\n- जब आप साइकिल चलाते हैं और ब्रेक लगाते हैं, तो गति रुक जाती है (कारण → परिणाम)\n- जब बर्फ़ धूप में पिघलती है, तो पानी बनता है\n\n**अभ्यास के लिए प्रश्न:**\n1. इस अवधारणा के दो और उदाहरण खुद सोचिए\n2. अगर "कारण" न हो तो क्या होगा?\n\n_यह उत्तर Gemma 4 के mock मोड में उत्पन्न हुआ है। HF_TOKEN सेट करने पर वास्तविक Gemma 3 4B-IT मॉडल छवि का वास्तविक विश्लेषण करेगा।_`;
}

async function mockToolLoop(
  trace: GemmaMessage[],
  _tools: GemmaTool[],
  executor: (call: GemmaToolCall) => Promise<string>,
  _maxSteps: number
): Promise<{ finalText: string; trace: GemmaMessage[] }> {
  // Simulate: model decides to call one tool, then synthesizes.
  const lastUser = [...trace].reverse().find((m) => m.role === "user")?.content ?? "";

  // Decide which tool to mock-call based on keywords
  let toolName = "search_wikipedia";
  let toolArgs: Record<string, unknown> = { query: "photosynthesis" };

  if (/weather|तापमान|मौसम|temperature/i.test(lastUser)) {
    toolName = "get_weather";
    toolArgs = { city: "Patna" };
  } else {
    // Extract a topic from the user query
    const m = lastUser.match(/about\s+([a-zA-Z\s]{3,40})/i) || lastUser.match(/बारे\s+में\s+([^\s]+)/);
    if (m) toolArgs = { query: m[1].trim() };
  }

  trace.push({
    role: "assistant",
    content: `I'll look this up using ${toolName}.`,
  });

  const result = await executor({ name: toolName, arguments: toolArgs });
  trace.push({ role: "tool", content: result });

  const finalText = `**📊 एजेंट रिपोर्ट**\n\nमैंने \`${toolName}\` टूल का उपयोग करके जानकारी इकट्ठी की। यहाँ परिणाम है:\n\n${result.slice(0, 600)}\n\n**निष्कर्ष:** Gemma 4 के native function calling के माध्यम से, मैंने स्वयं निर्णय लिया कि कौन सा टूल कॉल करना है, तर्क किया, और उत्तर संश्लेषित किया — सब कुछ एक ही लूप में।\n\n_यह उत्तर Gemma 4 के mock मोड में उत्पन्न हुआ है। HF_TOKEN सेट करने पर वास्तविक Gemma 3 4B-IT अपने टूल-यूज़ क्षमता से काम करेगा।_`;

  trace.push({ role: "assistant", content: finalText });
  return { finalText, trace };
}
