import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export const auditTransaction = async (text: string) => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" } 
  });

  const prompt = `
    Extract subscription details from this text: "${text}"
    Return JSON with:
    - merchant: (e.g. "Netflix")
    - price: (number)
    - billing_cycle: ("monthly" or "yearly")
    - category: (one of: "OTT", "SaaS", "Utility", "Other")
  `;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
};