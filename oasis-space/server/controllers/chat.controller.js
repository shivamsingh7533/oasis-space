import Groq from "groq-sdk";
import Listing from "../models/listing.model.js"; // ✅ Import Listing Model
import { errorHandler } from '../utils/error.js';

const MAX_PROMPT_LENGTH = 1000;
const MAX_HISTORY_MESSAGES = 6;

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
    // 1️⃣ DATABASE SE LATEST PROPERTIES NIKALO (Real-Time Data)
    const listings = await Listing.find({ status: 'available' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name address regularPrice discountPrice type description bedrooms bathrooms offer');

    // 2️⃣ DATA KO STRING FORMAT MEIN CONVERT KARO
    const propertiesContext = listings.map((p, index) => {
      const price = p.offer ? p.discountPrice : p.regularPrice;
      return `${index + 1}. Name: ${p.name}, Type: ${p.type}, Price: ₹${price}, Location: ${p.address}, Beds: ${p.bedrooms}, Baths: ${p.bathrooms}.`;
    }).join("\n");

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // 3️⃣ SYSTEM PROMPT MEIN REAL DATA INJECT KARO
    const systemMessage = {
      role: "system",
      content: `Identity: You are 'Jarvis', the smart Real Estate Assistant for OasisSpace.
      
      ⚠️ STRICT DATA RULES (READ CAREFULLY):
      1. **Only Recommend Listed Properties:** Below is the list of REAL properties currently available in our database. You MUST ONLY talk about these. Do NOT invent or hallucinate properties that are not in this list.
      2. **If No Match Found:** If the user asks for something not on the list (e.g., "Pune" but list has only "Mumbai"), say politely: "Maaf kijiye boss, abhi wahan koi property listed nahi hai. Par aap nayi listing ka wait kar sakte hain!"
      3. **Language:** Hinglish (Hindi + English mix).
      4. **Tone:** Professional yet friendly broker style.

      👇 **AVAILABLE PROPERTIES LIST (Use this data only):**
      ${propertiesContext ? propertiesContext : "No properties listed currently."}
      
      End of Data.`
    };

    // 4️⃣ MESSAGE HISTORY — sanitized, never trusted as system input
    const messages = [
      systemMessage,
      ...sanitizeHistory(history),
      { role: "user", content: cleanPrompt }
    ];

    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 300,
    });

    const reply = completion.choices[0]?.message?.content || "Sorry, server busy.";

    res.status(200).json({ reply });

  } catch (error) {
    console.error("❌ GROQ API ERROR:", error);
    next(errorHandler(500, "Jarvis is analyzing market trends. Try again later."));
  }
};