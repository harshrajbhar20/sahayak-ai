/**
 * Tool definitions for Gemma 4 native function calling.
 * These schemas follow the OpenAI-compatible `tools` array shape that
 * Gemma 3 4B-IT accepts on the Hugging Face Inference API.
 */

import type { GemmaTool } from "./gemma";

export const SAHAYAK_TOOLS: GemmaTool[] = [
  {
    type: "function",
    function: {
      name: "search_wikipedia",
      description:
        "Search Wikipedia for a factual topic and return a short summary. Use this when the student asks a knowledge question about science, history, geography, people, or concepts.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The topic to look up, e.g. 'photosynthesis' or 'महात्मा गांधी'",
          },
          lang: {
            type: "string",
            description: "Language code: 'en' for English, 'hi' for Hindi",
            default: "en",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_weather",
      description:
        "Get the current weather for a city. Useful for agriculture-related questions, harvest planning, or when a student asks about local conditions.",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "City name, e.g. 'Patna', 'Lucknow', 'Kolkata'",
          },
        },
        required: ["city"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate",
      description:
        "Evaluate a math expression and return the result. Use for arithmetic problems students bring from homework.",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "A JavaScript-evaluatable arithmetic expression, e.g. '12 * (7 + 3)'",
          },
        },
        required: ["expression"],
      },
    },
  },
];

/** Execute a tool call by name. Returns a string the model can consume. */
export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case "search_wikipedia": {
      const query = String(args.query ?? "");
      const lang = String(args.lang ?? "en");
      return await searchWikipedia(query, lang);
    }
    case "get_weather": {
      const city = String(args.city ?? "");
      return await getWeather(city);
    }
    case "calculate": {
      const expr = String(args.expression ?? "");
      return safeCalculate(expr);
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

async function searchWikipedia(query: string, lang: string): Promise<string> {
  try {
    const safeLang = lang === "hi" ? "hi" : "en";
    const searchUrl = `https://${safeLang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query
    )}&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    const searchJson = await searchRes.json();
    const firstTitle = searchJson?.query?.search?.[0]?.title;
    if (!firstTitle) return `No Wikipedia article found for: ${query}`;

    const summaryUrl = `https://${safeLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
      firstTitle
    )}`;
    const summaryRes = await fetch(summaryUrl);
    const summary = await summaryRes.json();
    return JSON.stringify({
      title: summary.title,
      extract: summary.extract,
      url: summary.content_urls?.desktop?.page,
    });
  } catch (e) {
    return JSON.stringify({ error: `Wikipedia lookup failed: ${(e as Error).message}` });
  }
}

async function getWeather(city: string): Promise<string> {
  try {
    // Open-Meteo geocoding — no API key required, perfect for offline-capable demos
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    const geo = await geoRes.json();
    const place = geo?.results?.[0];
    if (!place) return JSON.stringify({ error: `Could not find city: ${city}` });

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`
    );
    const weather = await weatherRes.json();
    return JSON.stringify({
      city: place.name,
      country: place.country,
      temperature_c: weather?.current?.temperature_2m,
      humidity: weather?.current?.relative_humidity_2m,
      weather_code: weather?.current?.weather_code,
    });
  } catch (e) {
    return JSON.stringify({ error: `Weather lookup failed: ${(e as Error).message}` });
  }
}

function safeCalculate(expression: string): string {
  // Allow only digits, operators, parentheses, decimal points, whitespace
  if (!/^[\d\s+\-*/().%]+$/.test(expression)) {
    return JSON.stringify({ error: "Invalid expression" });
  }
  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${expression})`)();
    return JSON.stringify({ expression, result });
  } catch (e) {
    return JSON.stringify({ error: `Calculation failed: ${(e as Error).message}` });
  }
}
