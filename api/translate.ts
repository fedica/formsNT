import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { texts, sourceLang } = req.body;
    
    if (sourceLang === 'DE' || !process.env.GEMINI_API_KEY || !texts) {
      return res.json({ translated: texts });
    }

    const hasText = Object.values(texts).some(val => val && typeof val === 'string' && (val as string).trim().length > 0);
    if (!hasText) {
      return res.json({ translated: texts });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const langMap: Record<string, string> = {
      'RO': 'Romanian',
      'RU': 'Russian',
      'BG': 'Bulgarian',
      'UKR': 'Ukrainian',
      'DE': 'German'
    };
    const fullLangName = langMap[sourceLang] || sourceLang;

    const prompt = `Translate the following JSON object values from ${fullLangName} to German. Keep the keys exactly the same. If a value is empty, keep it empty. Return ONLY valid JSON.\n\n${JSON.stringify(texts)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (response.text) {
      let textToParse = response.text.trim();
      if (textToParse.startsWith('```')) {
        textToParse = textToParse.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      const translated = JSON.parse(textToParse);
      return res.json({ translated });
    }
    
    res.json({ translated: texts });
  } catch (error) {
    console.error("Translation error:", error);
    res.json({ translated: req.body?.texts });
  }
}
