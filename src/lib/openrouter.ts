import { Settings, GOOGLE_FALLBACK_CHAIN } from './storage';
import { diff_match_patch } from 'diff-match-patch';

export interface Correction {
  type: 'grammar' | 'spelling';
  original: string;
  suggestion: string;
  explanation: string;
  start: number;
  end: number;
  severity: 'error' | 'warning';
}

export interface AnalysisResponse {
  corrections: Correction[];
  overallScore: number;
  stats: {
    wordCount: number;
    readabilityScore: number;
  };
}

const SYSTEM_PROMPT = `You are a grammar checker. Find ONLY grammar and spelling errors in the text.

CRITICAL RULES:
1. ONLY fix actual grammar mistakes (subject-verb agreement, tense errors, article usage, etc.)
2. ONLY fix spelling mistakes
3. DO NOT rewrite sentences for "clarity" or "style"
4. DO NOT change the meaning or structure of sentences
5. The "suggestion" must be minimal - change ONLY the specific word(s) with errors
6. If a sentence is grammatically correct, DO NOT suggest changes
7. NEVER suggest capitalizing letters WITHIN words - only standalone "i" (the pronoun) should be "I"
8. DO NOT flag individual letters or parts of words - only flag complete words or phrases
9. The lowercase "i" is ONLY wrong when it stands ALONE as the pronoun (e.g., "i think" → "I think")
10. Letters like "i" inside words (like "in", "it", "is", "like", "this") are CORRECT and must NOT be flagged

IMPORTANT GRAMMAR RULES TO FOLLOW:
- After "doesn't", "don't", "does", "do", "didn't", "can't", "won't", "shouldn't", "couldn't", "wouldn't" → use BASE VERB (no -s/-es)
  Example: "doesn't work" is CORRECT, "doesn't works" is WRONG
- After "he/she/it" without auxiliary → use VERB+S
  Example: "it works" is CORRECT, "it work" is WRONG
- "its" = possessive, "it's" = "it is"
- Standalone "i" (pronoun) → should be "I" (capitalized)
  Example: "i think" is WRONG → "I think" is CORRECT
  But "in", "it", "is" are CORRECT as-is

Respond ONLY with a JSON object. No markdown.

JSON Structure:
{
  "corrections": [
    {
      "type": "grammar" | "spelling",
      "original": "exact erroneous word or phrase",
      "suggestion": "corrected word or phrase", 
      "explanation": "brief reason",
      "start": number,
      "end": number,
      "severity": "error" | "warning"
    }
  ],
  "overallScore": 0-100,
  "stats": { "wordCount": number, "readabilityScore": 0-10 }
}

Examples:
- "sometimes it work" → "it work" should be "it works" (subject-verb agreement)
- "doesn't works" → "works" should be "work" (base verb after doesn't)
- "recieve" → "receive" (spelling)
- "a apple" → "an apple" (article)
- "its raining" → "its" should be "it's" (contraction)

DO NOT create correction loops. Analyze the FULL context before suggesting.`;

// Simple in-memory cache for the current session
const analysisCache = new Map<string, { response: AnalysisResponse, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

const MAX_CHUNK_SIZE = 3000; // characters

export async function analyzeText(text: string, settings: Settings): Promise<AnalysisResponse> {
  if (text.length <= MAX_CHUNK_SIZE) {
    return analyzeChunk(text, settings);
  }

  // Handle large text by chunking
  const chunks = chunkText(text, MAX_CHUNK_SIZE);
  const results = await Promise.all(chunks.map(chunk => analyzeChunk(chunk.text, settings)));

  // Merge results and adjust offsets
  const merged: AnalysisResponse = {
    corrections: [],
    overallScore: 0,
    stats: {
      wordCount: 0,
      readabilityScore: 0
    }
  };

  let totalScore = 0;
  let totalReadability = 0;

  results.forEach((res, i) => {
    const offset = chunks[i].offset;
    res.corrections.forEach(c => {
      c.start += offset;
      c.end += offset;
    });
    merged.corrections.push(...res.corrections);
    merged.stats.wordCount += res.stats.wordCount;
    totalScore += res.overallScore;
    totalReadability += res.stats.readabilityScore;
  });

  merged.overallScore = Math.round(totalScore / results.length);
  merged.stats.readabilityScore = Number((totalReadability / results.length).toFixed(1));

  return merged;
}

async function analyzeChunk(text: string, settings: Settings): Promise<AnalysisResponse> {
  const model = settings.provider === 'google' ? settings.googleModel : settings.selectedModel;
  const cacheKey = `${settings.provider}:${model}:${settings.mode}:${settings.aggressiveness}:${text}`;
  const cached = analysisCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.response;
  }

  const systemPrompt = `${SYSTEM_PROMPT}\nWriting Mode: ${settings.mode}\nAggressiveness: ${settings.aggressiveness}`;
  const content = settings.provider === 'google'
    ? await requestGoogleWithFallback(systemPrompt, text, settings)
    : await requestOpenRouter(systemPrompt, text, settings);

  try {
    const parsed = JSON.parse(content) as AnalysisResponse;
    parsed.overallScore ??= 100;
    parsed.stats ??= { wordCount: text.split(/\s+/).filter(Boolean).length, readabilityScore: 0 };
    const validated = validateAndFixCorrections(text, parsed);
    analysisCache.set(cacheKey, { response: validated, timestamp: Date.now() });
    return validated;
  } catch (e) {
    throw new Error('Invalid response format from AI.');
  }
}

async function requestOpenRouter(systemPrompt: string, text: string, settings: Settings): Promise<string> {
  if (!settings.openRouterKey) {
    throw new Error('OpenRouter API key is missing');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/open-grammarly',
      'X-Title': 'Open Grammarly',
    },
    body: JSON.stringify({
      model: settings.selectedModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

const GOOGLE_TIMEOUT_MS = 30000;

// Models may wrap JSON in prose or reasoning text; find the first parseable object with a corrections array
function extractJson(content: string): string | null {
  const end = content.lastIndexOf('}');
  for (let i = content.indexOf('{'); i !== -1 && i < end; i = content.indexOf('{', i + 1)) {
    const candidate = content.slice(i, end + 1);
    try {
      if (Array.isArray(JSON.parse(candidate).corrections)) return candidate;
    } catch {
      // try next brace
    }
  }
  return null;
}

async function requestGoogleWithFallback(systemPrompt: string, text: string, settings: Settings): Promise<string> {
  const start = GOOGLE_FALLBACK_CHAIN.indexOf(settings.googleModel);
  const models = start === -1
    ? [settings.googleModel, ...GOOGLE_FALLBACK_CHAIN]
    : GOOGLE_FALLBACK_CHAIN.slice(start);

  let lastError: unknown;
  for (const model of models) {
    try {
      return await requestGoogle(systemPrompt, text, settings, model);
    } catch (e) {
      lastError = e;
      if (e instanceof Error && e.message === 'Google API key is missing') throw e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('All Google models failed.');
}

async function requestGoogle(systemPrompt: string, text: string, settings: Settings, model: string): Promise<string> {
  if (!settings.googleKey) {
    throw new Error('Google API key is missing');
  }

  // Gemma doesn't reliably support JSON response mode; JSON is extracted from the text instead
  const isGemma = model.startsWith('gemma');
  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text }] }],
    generationConfig: isGemma
      ? { temperature: 0.3 }
      : { temperature: 0.3, responseMimeType: 'application/json' },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'x-goog-api-key': settings.googleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(GOOGLE_TIMEOUT_MS),
    }
  ).catch((e) => {
    if (e?.name === 'TimeoutError') throw new Error(`${model}: timed out after ${GOOGLE_TIMEOUT_MS / 1000}s`);
    throw e;
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`${model}: ${errorData.error?.message || `Google API request failed with status ${response.status}`}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts
    ?.filter((p: { thought?: boolean }) => !p.thought)
    .map((p: { text?: string }) => p.text ?? '')
    .join('');
  if (!content) throw new Error(`${model}: Google API returned an empty response.`);
  console.debug(`[Open Grammarly] ${model} raw response:`, content);
  const json = extractJson(content);
  if (!json) throw new Error(`${model}: response contained no valid JSON with corrections.`);
  return json;
}

function chunkText(text: string, size: number): { text: string, offset: number }[] {
  const chunks: { text: string, offset: number }[] = [];
  let currentPos = 0;

  while (currentPos < text.length) {
    let endPos = currentPos + size;
    if (endPos < text.length) {
      // Try to find a paragraph break
      const lastPara = text.lastIndexOf('\n', endPos);
      if (lastPara > currentPos + size * 0.5) {
        endPos = lastPara + 1;
      } else {
        // Try to find a sentence end
        const lastSentence = text.lastIndexOf('. ', endPos);
        if (lastSentence > currentPos + size * 0.5) {
          endPos = lastSentence + 2;
        }
      }
    } else {
      endPos = text.length;
    }

    chunks.push({
      text: text.substring(currentPos, endPos),
      offset: currentPos
    });
    currentPos = endPos;
  }

  return chunks;
}

function validateAndFixCorrections(originalText: string, response: AnalysisResponse): AnalysisResponse {
  const dmp = new diff_match_patch();
  
  response.corrections = response.corrections.filter(c => {
    // Filter out single-letter corrections that are just case changes (except standalone "i" → "I")
    if (c.original.length === 1 && c.suggestion.length === 1) {
      // Only allow "i" → "I" if it's a standalone word (the pronoun)
      if (c.original === 'i' && c.suggestion === 'I') {
        // Check if it's actually standalone (surrounded by word boundaries)
        const before = c.start > 0 ? originalText[c.start - 1] : ' ';
        const after = c.end < originalText.length ? originalText[c.end] : ' ';
        const isStandalone = /[\s.,!?;:'"()\[\]{}\-]/.test(before) && /[\s.,!?;:'"()\[\]{}\-]/.test(after);
        if (!isStandalone) {
          return false; // Skip - it's "i" inside a word
        }
      } else {
        return false; // Skip other single-letter case changes
      }
    }

    // Filter out corrections where original and suggestion differ only by case of a single letter
    if (c.original.toLowerCase() === c.suggestion.toLowerCase() && 
        c.original !== c.suggestion &&
        c.original.length > 1) {
      // Check if only one character differs in case
      let diffCount = 0;
      for (let i = 0; i < c.original.length; i++) {
        if (c.original[i] !== c.suggestion[i]) diffCount++;
      }
      if (diffCount === 1 && c.original.toLowerCase() === c.suggestion.toLowerCase()) {
        return false; // Skip - just a single letter case change within a word
      }
    }

    // 1. Check if original text at AI-provided indices matches c.original
    const AI_snippet = originalText.substring(c.start, c.end);
    if (AI_snippet === c.original) return true;

    // 2. If not, try to find the exact substring elsewhere
    const exactIndex = originalText.indexOf(c.original);
    if (exactIndex !== -1) {
      c.start = exactIndex;
      c.end = exactIndex + c.original.length;
      return true;
    }

    // 3. Try fuzzy match using DMP
    const fuzzyIndex = dmp.match_main(originalText, c.original, c.start);
    if (fuzzyIndex !== -1) {
      c.start = fuzzyIndex;
      c.end = fuzzyIndex + c.original.length;
      c.original = originalText.substring(c.start, c.end);
      return true;
    }

    return false;
  });

  return response;
}
