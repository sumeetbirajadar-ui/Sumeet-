import React, { useRef, useState, useEffect } from 'react';
import { Sparkles, Send, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';

interface GroundingSource {
  title: string;
  uri: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sources?: GroundingSource[];
}

const SYSTEM_INSTRUCTION = `You are a friendly, precise assistant inside a Karnataka student-prep app for KCET, NEET and JEE. You help with:
- Subject doubts (Physics/Chemistry/Maths/Biology) for PUC/11th-12th level.
- KCET/NEET/JEE counselling questions: registration, document verification (HLC), option entry, mock allotment, seat allotment rounds, mop-up.
- Current exam/counselling news when the student asks about dates, notifications or "latest" updates — use search grounding for these and cite what you find.

Keep answers concise and exam-focused. When a question depends on official dates or rules that change year to year, say so explicitly and recommend the student verify on the official KEA (cetonline.karnataka.gov.in) or NTA site. Never invent a specific date or cutoff number you are not sourcing from search results.`;

const SUGGESTIONS = [
  'Latest KCET counselling updates today',
  'Documents needed for KCET HLC verification',
  'Explain projectile motion range formula',
  'Difference between KCET and NEET marking scheme',
];

// process.env.GEMINI_API_KEY is statically replaced at build time (see vite.config.ts).
const API_KEY: string | undefined = (typeof process !== 'undefined' && (process as any).env?.GEMINI_API_KEY) || undefined;

let chatSingleton: any = null;

async function getChat() {
  if (chatSingleton) return chatSingleton;
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  chatSingleton = ai.chats.create({
    model: 'gemini-2.0-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
    },
  });
  return chatSingleton;
}

export default function AiAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError('');
    setInput('');
    setMessages((m) => [...m, { id: `u_${Date.now()}`, role: 'user', text: trimmed }]);
    setLoading(true);
    try {
      const chat = await getChat();
      const response = await chat.sendMessage({ message: trimmed });
      const sources: GroundingSource[] =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks
          ?.map((c: any) => c.web && { title: c.web.title || c.web.uri, uri: c.web.uri })
          .filter(Boolean) || [];
      setMessages((m) => [
        ...m,
        { id: `a_${Date.now()}`, role: 'assistant', text: response.text || '(No response text)', sources },
      ]);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong reaching the AI assistant.');
    } finally {
      setLoading(false);
    }
  }

  if (!API_KEY) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-sage-50 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-sage-600" />
        </div>
        <h1 className="text-2xl font-bold font-display text-ink-900 mb-2">AI Assistant not set up yet</h1>
        <p className="text-ink-500 text-sm max-w-md mx-auto">
          Ask your admin to add a <code className="bg-ink-100 px-1.5 py-0.5 rounded">GEMINI_API_KEY</code> in{' '}
          <code className="bg-ink-100 px-1.5 py-0.5 rounded">.env.local</code>. Get a free key at{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-gold-600 font-semibold underline">
            aistudio.google.com/apikey
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col h-full">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight font-display mb-2">AI Assistant</h1>
        <p className="text-ink-500 text-sm">Doubt-solving and counselling help, grounded in live search results.</p>
      </header>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-sm bg-white border-2 border-ink-100 hover:border-gold-300 rounded-full px-4 py-2 text-ink-700"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 space-y-4 mb-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-gold-400 text-ink-900 font-medium' : 'bg-white border-2 border-ink-100 text-ink-800'
              }`}
            >
              {m.text}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-ink-100 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Sources</p>
                  {m.sources.map((s, i) => (
                    <a
                      key={i}
                      href={s.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-sage-700 hover:underline truncate"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" /> {s.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border-2 border-ink-100 rounded-3xl px-4 py-3 flex items-center gap-2 text-ink-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-3xl px-4 py-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 sticky bottom-0 bg-ink-50 pt-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a doubt or a counselling question..."
          className="flex-1 border-2 border-ink-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-gold-400 bg-white"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-gold-400 hover:bg-gold-300 disabled:opacity-40 text-ink-900 font-bold px-5 rounded-full flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
      <p className="text-[11px] text-ink-400 text-center mt-3">
        AI-generated — always verify counselling dates and cutoffs against the official KEA/NTA site.
      </p>
    </div>
  );
}
