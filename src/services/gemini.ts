import { GoogleGenAI, Type } from "@google/genai";

export const BLOG_TYPES = [
  { id: 'tech', label: 'Technology & AI', prompt: 'Write a tech-focused blog post with technical depth and futuristic insights.' },
  { id: 'lifestyle', label: 'Lifestyle & Wellness', prompt: 'Write a lifestyle blog post that is inspiring, warm, and practical.' },
  { id: 'business', label: 'Professional & Business', prompt: 'Write a professional business article with clear headings, data-driven points, and actionable advice.' },
  { id: 'creative', label: 'Creative & Narrative', prompt: 'Write a creative, storytelling-driven blog post with rich descriptions and an emotional core.' },
  { id: 'news', label: 'News & Report', prompt: 'Write a journalistic news report, focusing on facts, objective tone, and clear headlines.' },
  { id: 'poetic', label: 'Poetic & Expressive', prompt: 'Write a deeply poetic and expressive blog post, using metaphors and artistic language.' },
];

function getGenAI() {
  // Use a safer way to access the key, checking for both regular and window-injected process.env
  const globalObj = (typeof window !== 'undefined' ? window : globalThis) as any;
  const env = (typeof process !== 'undefined' ? process.env : globalObj.process?.env || {}) as any;
  
  let apiKey = env.GEMINI_API_KEY || globalObj.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'undefined' || apiKey.trim() === '') {
    throw new Error("GEMINI_API_KEY is missing. Please ensure it's provided in the Secrets panel (Side Menu > Settings > Secrets).");
  }
  // Trim and remove any accidental quotes that users might have pasted
  apiKey = apiKey.trim().replace(/^["'](.+)["']$/, '$1');
  
  return new GoogleGenAI({ apiKey });
}

export async function generateBlogSkeleton(topic: string, blogType: string) {
  const selectedType = BLOG_TYPES.find(t => t.id === blogType) || BLOG_TYPES[0];
  const ai = getGenAI();
  
  const systemInstruction = `
    You are an expert Editorial Blog Architect for "LUMINA", a premium digital publication.
    Your goal is to help users draft high-quality blog posts.
    Constraint: The content MUST be formatted in Markdown.
    Tone: Sophisticated, engaging, and professional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: `${selectedType.prompt}\n\nTopic: ${topic}` }] }],
      config: {
        responseMimeType: "application/json",
        systemInstruction,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A compelling, editorial-style title" },
            content: { type: Type.STRING, description: "Full markdown content of the blog post. Include an intro, body with subheadings, and a conclusion." },
            category: { type: Type.STRING, description: "The most appropriate category" },
            excerpt: { type: Type.STRING, description: "A brief, punchy intro paragraph for the post card." }
          },
          required: ["title", "content", "category", "excerpt"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No content generated from AI");
    }

    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    let userMessage = error.message;
    try {
      const parsed = JSON.parse(error.message);
      if (parsed.error?.message) {
        userMessage = parsed.error.message;
      }
    } catch (e) {}
    throw new Error(userMessage);
  }
}

export async function chatWithAI(messages: any[]) {
  const ai = getGenAI();
  const systemInstruction = "You are the LUMINA AI, a sophisticated editorial assistant. You help users refine their blog ideas, suggest titles, and provide feedback on writing.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: messages,
      config: {
        systemInstruction,
      }
    });

    return response.text;
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    let userMessage = error.message;
    try {
      const parsed = JSON.parse(error.message);
      if (parsed.error?.message) {
        userMessage = parsed.error.message;
      }
    } catch (e) {}
    throw new Error(userMessage);
  }
}
