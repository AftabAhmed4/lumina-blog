import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Sparkles, Loader2, Eraser, MoveRight, ArrowRight, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { chatWithAI, generateBlogSkeleton, BLOG_TYPES } from '../services/gemini';
import { logout, isAdmin } from '../lib/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { User as FirebaseUser } from 'firebase/auth';

interface Message {
  role: 'user' | 'model';
  content: string;
  isGenerating?: boolean;
  generatedData?: any;
}

interface AIChatProps {
  user: FirebaseUser | null;
}

export default function AIChat({ user }: AIChatProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hello! I'm your LUMINA AI Editorial Assistant. I can help you brainstorm ideas or even draft a full blog post for you. What's on your mind today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState(BLOG_TYPES[0].id);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Gemini requires the first message in history to be from 'user'.
      // Our first message is a greeting from the 'model', so we filter it out 
      // or ensure we start from the first user message.
      const chatHistory = messages
        .filter((msg, index) => index > 0 || msg.role === 'user')
        .map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        }));
      chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });

      const response = await chatWithAI(chatHistory);
      setMessages(prev => [...prev, { role: 'model', content: response || "I'm sorry, I couldn't generate a response." }]);
    } catch (error: any) {
      console.error(error);
      const isAuthError = error?.message?.includes('API key') || error?.status === 'INVALID_ARGUMENT';
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: isAuthError 
          ? "I'm having trouble connecting to my brain! It looks like the Gemini API Key is missing or invalid. Please check the 'Secrets' panel in the AI Studio side menu."
          : "Something went wrong. Please check your connection and try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoGenerate = async (topic: string) => {
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: `Generate a ${selectedType} blog about: ${topic}` }]);
    
    try {
      const result = await generateBlogSkeleton(topic, selectedType);
      const generatedContent = `### ${result.title}\n\n**Category:** ${result.category}\n\n${result.content}`;
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: generatedContent,
        isGenerating: true,
        generatedData: result
      }]);
    } catch (error: any) {
      console.error(error);
      const isAuthError = error?.message?.includes('API key') || error?.status === 'INVALID_ARGUMENT';
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: isAuthError 
          ? "Failed to generate blog post. It looks like the Gemini API Key is missing or invalid. Please check the 'Secrets' panel in the AI Studio side menu." 
          : "Failed to generate blog post. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      { role: 'model', content: "Chat cleared. How else can I assist your creative process?" }
    ]);
  };

  const saveToDraft = async (data: any) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    setIsLoading(true);
    try {
      await addDoc(collection(db, 'posts'), {
        ...data,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhoto: user.photoURL || '',
        createdAt: serverTimestamp(),
        status: 'draft',
        likes: 0,
        views: 0
      });
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
      alert("Failed to save draft. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg pt-24 pb-12 px-6 sm:px-10 flex flex-col items-center">
      <div className="max-w-4xl w-full flex flex-col h-[80vh] bg-accent rounded-[40px] border border-border overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-bg/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-bg shadow-lg shadow-primary/20">
              <Bot size={22} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-text-main">LUMINA AI Assistant</h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-sub">Online & Ready</span>
              </div>
            </div>
          </div>
          <button 
            onClick={clearChat}
            className="p-2 text-text-sub hover:text-red-500 transition-colors"
            title="Clear Chat"
          >
            <Eraser size={20} />
          </button>
        </div>

        {/* Templates Selector */}
        <div className="px-8 py-4 border-b border-border bg-bg/30 overflow-x-auto whitespace-nowrap scrollbar-hide flex gap-3">
          {BLOG_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                selectedType === type.id 
                ? 'bg-primary text-bg shadow-md' 
                : 'bg-accent border border-border text-text-sub hover:border-primary'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-grow overflow-y-auto p-8 space-y-8 scroll-smooth"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-accent border border-border text-text-main' : 'bg-primary text-bg'
                }`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`max-w-[80%] p-5 rounded-[24px] ${
                  msg.role === 'user' 
                  ? 'bg-primary text-bg rounded-tr-none' 
                  : 'bg-bg border border-border rounded-tl-none text-text-main'
                }`}>
                  <div className="prose prose-sm dark:prose-invert max-w-none font-medium leading-relaxed text-inherit">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  
                  {msg.isGenerating && (
                    <div className="mt-6 pt-6 border-t border-border flex flex-wrap gap-3 justify-end">
                      <button 
                        onClick={() => saveToDraft(msg.generatedData)}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-accent border border-border text-text-main px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-bg transition-colors"
                      >
                        Save as Draft
                      </button>
                      <button 
                        onClick={() => navigate('/create', { state: { draft: msg.generatedData } })}
                        className="flex items-center gap-2 bg-primary text-bg px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-transform"
                      >
                        Edit in Editor <MoveRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <div className="w-8 h-8 rounded-full bg-primary text-bg flex items-center justify-center">
                <Loader2 className="animate-spin" size={16} />
              </div>
              <div className="bg-bg border border-border p-4 rounded-[24px] rounded-tl-none italic text-text-sub text-sm">
                Lumina is thinking...
              </div>
            </motion.div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="px-8 py-3 bg-bg/50 border-t border-border flex gap-2">
          <button 
            onClick={() => setInput("Brainstorm 5 catchy titles for my next tech blog.")}
            className="px-3 py-1.5 bg-accent border border-border rounded-lg text-[10px] font-bold text-text-sub hover:text-primary transition-colors"
          >
            Refine Titles
          </button>
          <button 
            onClick={() => setInput("Help me create an outline for a travel guide.")}
            className="px-3 py-1.5 bg-accent border border-border rounded-lg text-[10px] font-bold text-text-sub hover:text-primary transition-colors"
          >
            Create Outline
          </button>
          <button 
            onClick={() => setInput("What are the current trends in AI blogging?")}
            className="px-3 py-1.5 bg-accent border border-border rounded-lg text-[10px] font-bold text-text-sub hover:text-primary transition-colors"
          >
            Current Trends
          </button>
        </div>

        {/* Input Area */}
        <div className="p-8 bg-bg border-t border-border mt-auto">
          <div className="relative flex items-center gap-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything or request a blog generation..."
              className="w-full bg-accent border border-border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-1 focus:ring-primary transition-all resize-none h-16"
            />
            <div className="flex gap-2">
               <button
                onClick={() => handleAutoGenerate(input || "New Blog Topic")}
                disabled={isLoading}
                className="p-4 bg-accent border border-border text-primary rounded-2xl hover:bg-primary hover:text-bg transition-all disabled:opacity-50"
                title="Auto-Generate full blog"
              >
                <Sparkles size={20} />
              </button>
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="p-4 bg-primary text-bg rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-text-sub mt-4 text-center font-bold uppercase tracking-[0.2em]">
            Tip: Press Sparkles to generate a full editorial draft
          </p>
        </div>
      </div>
    </div>
  );
}
