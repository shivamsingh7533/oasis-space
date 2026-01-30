import Groq from "groq-sdk";
import Listing from "../models/listing.model.js"; // ✅ Import Listing Model
import { errorHandler } from '../utils/error.js';

export const chatWithGroq = async (req, res, next) => {
  const { prompt, history } = req.body;

  if (!process.env.GROQ_API_KEY) {
    return next(errorHandler(500, "Groq API Key is missing inside .env file!"));
  }

  try {
    // 1️⃣ DATABASE SE LATEST PROPERTIES NIKALO (Real-Time Data)
    // Hum sirf zaroori fields le rahe hain taaki token limit cross na ho
    const listings = await Listing.find({ status: 'available' }) // Sirf available properties
      .sort({ createdAt: -1 }) // Latest pehle
      .limit(10) // Top 10 properties (Token bachane ke liye)
      .select('name address regularPrice discountPrice type description bedrooms bathrooms');

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

    // 4️⃣ MESSAGE HISTORY BHEJO
    const messages = [
      systemMessage,
      ...history,
      { role: "user", content: prompt }
    ];

    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.5, // Thoda strict rakha hai taaki jhoot na bole
      max_tokens: 300,
    });

    const reply = completion.choices[0]?.message?.content || "Sorry, server busy.";

    res.status(200).json({ reply });

  } catch (error) {
    console.error("❌ GROQ API ERROR:", error);
    next(errorHandler(500, "Jarvis is analyzing market trends. Try again later."));
  }
};