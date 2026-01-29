import { GoogleGenerativeAI } from "@google/generative-ai";
import { errorHandler } from '../utils/error.js';

export const chatWithGemini = async (req, res, next) => {
  const { prompt, history } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return next(errorHandler(500, "Gemini API Key is missing inside .env file!"));
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // ✅ CHANGED TO 'gemini-flash-latest'
    // Ye automatic latest working version utha lega jo aapki key par available hai.
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest", 
      systemInstruction: `
      Identity: You are 'Jarvis', the smart Real Estate Assistant for OasisSpace.
      
      TONE & LANGUAGE RULES (CRITICAL):
      1. **Language:** You MUST speak in **Hinglish** (A natural mix of Hindi and English).
         - Good Example: "Haan bhai, Mumbai mein 2 BHK mil jayega. Budget kya hai aapka?"
      
      2. **Personality:** Be friendly, slightly witty, and professional like a smart Indian broker.
      
      3. **Scope:** Only answer questions about Real Estate (Buying, Renting, Selling, Interior, Loans). 
         If user asks unrelated things, say: "Arre boss, main sirf property dikhata hoon! 🏠😅"

      4. **Formatting:** Keep answers short (max 3-4 lines). Use emojis 🏠💰 keys where needed.
      `
    });

    // 1. Convert Frontend history to Gemini format
    let chatHistory = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // 2. SANITIZATION RULE (First message must be user)
    if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
        chatHistory.shift(); 
    }

    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const reply = response.text();

    res.status(200).json({ reply });

  } catch (error) {
    console.error("❌ GEMINI API ERROR:", error);
    
    // Error Handling
    if (error.status === 429) {
        return next(errorHandler(429, "Too many requests. Thodi der baad try karein."));
    }
    
    // Fallback: Agar 'flash-latest' bhi na chale, to 'gemini-pro' try karne ka suggestion
    if (error.message.includes("not found")) {
        console.log("👉 Tip: Try changing model to 'gemini-pro' or 'gemini-pro-latest'");
    }

    next(errorHandler(500, "Jarvis thoda busy hai. Please try again later."));
  }
};