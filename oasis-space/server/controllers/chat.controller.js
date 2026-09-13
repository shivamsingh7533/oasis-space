import Groq from "groq-sdk";
import { errorHandler } from '../utils/error.js';
import { runTool } from '../utils/chatTools.js';

const MAX_PROMPT_LENGTH = 1000;
const MAX_HISTORY_MESSAGES = 6;
const MAX_ROUNDS = 3; // system -> tool calls (max) -> final answer

const CHAT_MODEL = process.env.CHAT_MODEL || 'qwen/qwen3.8-27b';
const FALLBACK_MODELS = (process.env.CHAT_FALLBACK_MODELS || 'qwen/qwen3.6-27b')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_listings',
      description:
        'Search properties currently available in the OasisSpace database. Use ONLY this tool to answer any question about finding properties — never invent listings. Returns matching listings with name, price, location, rooms.',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City or locality mentioned (e.g. Mumbai, Bengaluru). Matches against the listing address.' },
          type: { type: 'string', enum: ['rent', 'sale'], description: 'Property type. rent = monthly rental, sale = buying.' },
          minPrice: { type: 'number', description: 'Minimum price in INR (optional).' },
          maxPrice: { type: 'number', description: 'Maximum price / monthly budget in INR (optional). E.g. "under 20k" -> 20000.' },
          bedrooms: { type: 'number', description: 'Exact number of bedrooms (optional). E.g. 2BHK -> 2.' },
          bathrooms: { type: 'number', description: 'Exact number of bathrooms (optional).' },
          furnished: { type: 'boolean', description: 'Furnished filter (optional).' },
          offer: { type: 'boolean', description: 'Only show listings with an active offer/deal (optional).' },
          sort: { type: 'string', enum: ['recent', 'price-asc', 'price-desc'], description: 'Sort order. recent = newest first.' },
          limit: { type: 'number', description: 'Max results (1-8). Default 8.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_listing_detail',
      description: 'Get the full details (description, amenities, images) of one specific listing by its id. Use when the user asks about a particular property already shown or a listing id.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The listing id (24-char hex).' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_platform_info',
      description:
        'Get official OasisSpace facts: listing fees (rent free, sale one-time fee), seller verification, how to list a property, EMI calculator, search features, support. Use for questions about fees, policies, how the site works.',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', enum: ['fees', 'list', 'seller', 'verification', 'emi', 'search', 'support', 'browse'] },
        },
        required: ['topic'],
      },
    },
  },
];

// Sanitize client-supplied history: only 'user'/'assistant' roles and plain text.
// Blocks system-role injection that could override the assistant's data rules.
const sanitizeHistory = (history) => {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-MAX_HISTORY_MESSAGES)
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const role = item.role === 'assistant' ? 'assistant' : 'user';
      const content = String(item.content || '').slice(0, MAX_PROMPT_LENGTH).trim();
      if (!content) return null;
      return { role, content };
    })
    .filter(Boolean);
};

const buildSystemMessage = () => ({
  role: 'system',
  content: `Identity: You are 'Jarvis', the smart Real Estate Assistant for OasisSpace.

⚙️ HOW TO ANSWER:
1. Any question about finding properties (city, budget, BHK, rent/buy, deals) MUST be answered by calling the 'search_listings' tool with the right filters — never guess or invent listings.
2. If the user asks about a specific property, call 'get_listing_detail' with its id.
3. Questions about fees, seller verification, how-to-list, EMI, support -> call 'get_platform_info' with the matching topic.
4. Greetings/small talk: answer directly with no tool call.

🚫 STRICT RULES:
- ONLY talk about properties actually returned by the tools. NEVER invent or hallucinate listings, prices or locations.
- If search returns no listing for the request, say politely in Hinglish that no such property is listed right now and invite them to search again (e.g. different city/budget).
- Language: Hinglish (Hindi + English mix). Tone: professional yet friendly broker style.
- Keep answers short and scannable: for matched properties, mention name, location, price and key rooms. Ask if they want more details.`,
});

// Single completion attempt; walks the model chain on model_not_found errors.
const complete = async (groq, messages) => {
  const chain = [CHAT_MODEL, ...FALLBACK_MODELS];
  for (let idx = 0; idx < chain.length; idx++) {
    const model = chain[idx];
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages,
        tools: TOOLS,
        tool_choice: 'auto',
        temperature: 0.5,
        max_tokens: 350,
      });
      return { ok: true, model, completion };
    } catch (err) {
      const code = err?.error?.error?.code || err?.status;
      const message = String(err?.message || '').toLowerCase();
      if (err?.status === 429 || /rate.?limit|too many requests/i.test(message) || code === 'rate_limit_exceeded') {
        return { ok: false, limited: true };
      }
      const modelNotFound =
        code === 'model_not_found' || (code === 'invalid_request_error' && /model.*(not found|does not exist)/i.test(message));
      if (modelNotFound && idx < chain.length - 1) {
        console.warn(`⚠️ Model ${model} unavailable, falling back to ${chain[idx + 1]}`);
        continue;
      }
      return { ok: false, fatal: true, err };
    }
  }
  return { ok: false, fatal: true, err: new Error('No usable chat model') };
};

export const chatWithGroq = async (req, res, next) => {
  const { prompt, history } = req.body;

  if (!process.env.GROQ_API_KEY) {
    return next(errorHandler(500, "Groq API Key is missing inside .env file!"));
  }

  const cleanPrompt = String(prompt || '').slice(0, MAX_PROMPT_LENGTH).trim();
  if (!cleanPrompt) {
    return next(errorHandler(400, 'Prompt is required'));
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const messages = [
      buildSystemMessage(),
      ...sanitizeHistory(history),
      { role: 'user', content: cleanPrompt },
    ];

    let listings = [];
    let finalReply = '';

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const result = await complete(groq, messages);

      if (!result.ok) {
        if (result.limited) {
          return res.status(200).json({
            reply:
              'Jarvis thoda overloaded hai boss 🫠 — humara free AI plan ka rate-limit hit ho gaya. Thoda ruk kar dobara poochhiye, kam se kam ~1 minute baad. Ya phir bina AI ke Search page use kar sakte hain!',
            listings: [],
          });
        }
        return next(errorHandler(500, 'Jarvis is analyzing market trends. Try again later.'));
      }

      const choice = result.completion.choices[0];
      const msg = choice?.message;

      if (msg?.tool_calls && msg.tool_calls.length > 0) {
        messages.push(msg); // assistant message carrying the tool_calls
        for (const toolCall of msg.tool_calls) {
          let output;
          try {
            const args = toolCall.function?.arguments
              ? JSON.parse(toolCall.function.arguments)
              : {};
            output = await runTool(toolCall.function.name, args);
          } catch (toolErr) {
            output = { error: String(toolErr.message || toolErr) };
          }
          if (toolCall.function?.name === 'search_listings' && Array.isArray(output)) {
            listings = output;
          }
          // Strip the (potentially huge base64) image before sending results back
          // to the LLM — it never reasons about the image bytes. Cards keep it.
          const lean = (out) =>
            Array.isArray(out)
              ? out.map(({ image: _omitImage, ...rest }) => rest)
              : out && typeof out === 'object' && 'listing' in out
                ? { ...out, listing: lean(out.listing) }
                : out;
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(lean(output)),
          });
        }
        continue;
      }

      finalReply = String(msg?.content || 'Sorry, server busy.').trim();
      break;
    }

    if (!finalReply) finalReply = 'Sorry, server busy.';

    res.status(200).json({ reply: finalReply, listings });
  } catch (error) {
    console.error("❌ GROQ API ERROR:", error);
    next(errorHandler(500, "Jarvis is analyzing market trends. Try again later."));
  }
};