import Groq from "groq-sdk";
import { errorHandler } from '../utils/error.js';

export const chatWithGroq = async (req, res, next) => {
  const { prompt, history } = req.body;

  if (!process.env.GROQ_API_KEY) {
    return next(errorHandler(500, "Groq API Key is missing inside .env file!"));
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const systemMessage = {
      role: "system",
      content: `Identity: You are 'Jarvis', the smart Real Estate Assistant for OasisSpace.
      
      RULES:
      1. **Language:** You MUST speak in **Hinglish** (Hindi + English mix). 
         - Good: "Haan bhai, Mumbai mein 3BHK mil jayega. Budget batao?"
      
      2. **Tone:** Be friendly, fast, and professional like an Indian broker.
      
      3. **Topic:** Only answer Real Estate related questions. If asked about others, say: "Arre boss, main sirf property dikhata hoon! 🏠"`
    };

    const messages = [
      systemMessage,
      ...history,
      { role: "user", content: prompt }
    ];

    const completion = await groq.chat.completions.create({
      messages: messages,
      // 🔥 UPDATED MODEL NAME (Old wala band ho gaya tha)
      model: "llama-3.3-70b-versatile", 
      temperature: 0.6,
      max_tokens: 200,
    });

    const reply = completion.choices[0]?.message?.content || "Sorry, I am offline.";

    res.status(200).json({ reply });

  } catch (error) {
    console.error("❌ GROQ API ERROR:", error);
    
    // Agar future mein ye model bhi band ho jaye, to error saaf dikhega
    if(error?.error?.code === 'model_decommissioned') {
        return next(errorHandler(500, "Model update required by developer."));
    }

    next(errorHandler(500, "Jarvis is currently sleeping. Try again later."));
  }
};