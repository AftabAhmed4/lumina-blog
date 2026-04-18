import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getGenAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing. Please link your key in the Secrets panel or set it in environment variables.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export const BLOG_TYPES = [
  { id: 'tech', label: 'Technology & AI', prompt: 'Write a tech-focused blog post with technical depth and futuristic insights.' },
  { id: 'lifestyle', label: 'Lifestyle & Wellness', prompt: 'Write a lifestyle blog post that is inspiring, warm, and practical.' },
  { id: 'business', label: 'Professional & Business', prompt: 'Write a professional business article with clear headings, data-driven points, and actionable advice.' },
  { id: 'creative', label: 'Creative & Narrative', prompt: 'Write a creative, storytelling-driven blog post with rich descriptions and an emotional core.' },
  { id: 'news', label: 'News & Report', prompt: 'Write a journalistic news report, focusing on facts, objective tone, and clear headlines.' },
  { id: 'poetic', label: 'Poetic & Expressive', prompt: 'Write a deeply poetic and expressive blog post, using metaphors and artistic language.' },
];

export async function generateBlogSkeleton(topic: string, blogType: string) {
  const selectedType = BLOG_TYPES.find(t => t.id === blogType) || BLOG_TYPES[0];
  
  const systemInstruction = `
    You are an expert Editorial Blog Architect for "LUMINA", a premium digital publication.
    Your goal is to help users draft high-quality blog posts.
    Return the response as a valid JSON object with the following structure:
    {
      "title": "A compelling, editorial-style title",
      "content": "Full markdown content of the blog post. Include an intro, body with subheadings, and a conclusion.",
      "category": "The most appropriate category",
      "excerpt": "A brief, punchy intro paragraph for the post card."
    }
    
    Constraint: The content MUST be formatted in Markdown.
    Tone: Sophisticated, engaging, and professional.
  `;

  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: `${selectedType.prompt}\n\nTopic: ${topic}` }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error: any) {
    if (error?.message?.includes('API key') || error?.status === 'INVALID_ARGUMENT') {
      console.error("AI Studio Error: API Key is missing or invalid. Please check the 'Secrets' panel in the AI Studio side menu.");
    }
    console.error("Gemini Generation Error:", error);
    throw error;
  }
}

export async function chatWithAI(messages: { role: 'user' | 'model', parts: { text: string }[] }[]) {
  const systemInstruction = "You are the LUMINA AI, a sophisticated editorial assistant. You help users refine their blog ideas, suggest titles, and provide feedback on writing.";

  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: messages,
      config: {
        systemInstruction,
      },
    });

    return response.text;
  } catch (error: any) {
    if (error?.message?.includes('API key') || error?.status === 'INVALID_ARGUMENT') {
      console.error("AI Studio Error: API Key is missing or invalid. Please check the 'Secrets' panel in the AI Studio side menu.");
    }
    console.error("Gemini Chat Error:", error);
    throw error;
  }
}
