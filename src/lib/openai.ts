import OpenAI from "openai";

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY env var");
  }
  return new OpenAI({ apiKey });
}

export const MODEL_SUMMARY = process.env.OPENAI_SUMMARY_MODEL ?? "gpt-4o-mini";
export const MODEL_EMBEDDING = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";


