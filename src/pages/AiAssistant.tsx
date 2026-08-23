import React, { useRef, useState, useEffect } from 'react';
import { Sparkles, Send, ExternalLink, AlertCircle, Loader2, Download, Cpu } from 'lucide-react';

interface GroundingSource {
  title: string;
  uri: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sources?: GroundingSource[];
  groundingSkipped?: boolean;
}

const GEMINI_SYSTEM_INSTRUCTION = `You are a friendly, precise assistant inside a Karnataka student-prep app for KCET, NEET and JEE. You help with:
- Subject doubts (Physics/Chemistry/Maths/Biology) for PUC/11th-12th level.
- KCET/NEET/JEE counselling questions: registration, document verification (HLC), option entry, mock allotment, seat allotment rounds, mop-up.
- Current exam/counselling news when the student asks about dates, notifications or "latest" updates — use search grounding for these and cite what you find.

Keep answers concise and exam-focused. When a question depends on official dates or rules that change year to year, say so explicitly and recommend the student verify on the official KEA (cetonline.karnataka.gov.in) or NTA site. Never invent a specific date or cutoff number you are not sourcing from search results.`;

const LOCAL_SYSTEM_PROMPT = `You are a friendly assistant inside a Karnataka student-prep app for KCET, NEET and JEE, helping with subject doubts (Physics/Chemistry/Maths/Biology, PUC/11th-12th level) and general counselling process questions. You are running fully offline on the student's device with no internet access, so you cannot look up current dates, news or cutoffs — if asked about "latest" updates or specific dates, say you cannot check live information and recommend the official KEA (cetonline.karnataka.gov.in) or NTA site. Keep answers concise and exam-focused.`;

const SUGGESTIONS_ONLINE = [
  'Latest KCET counselling updates today',
  'Documents needed for KCET HLC verification',
  'Explain projectile motion range formula',
  'Difference between KCET and NEET marking scheme',
];

const SUGGESTIONS_LOCAL = [
  'Explain projectile motion range formula',
  'Difference between KCET and NEET marking scheme',
  'What is the mole concept in chemistry?',
  'Explain Newton’s second law with an example',
];

// process.env.GEMINI_API_KEY is statically replaced at build time (see vite.config.ts).
const API_KEY: string | undefined = (typeof process !== 'undefined' && (process as any).env?.GEMINI_API_KEY) || undefined;

const GEMINI_MODEL = 'gemini-3.6-flash';

let geminiClientSingleton: any = null;

async function getGeminiClient() {
  if (geminiClientSingleton) return geminiClientSingleton;
  const { GoogleGenAI } = await import('@google/genai');
  geminiClientSingleton = new GoogleGenAI({ apiKey: API_KEY });
  return geminiClientSingleton;
}

function isQuotaError(e: any): boolean {
  const msg = String(e?.message || e);
  return msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429') || msg.toLowerCase().includes('quota');
}

async function callGemini(contents: any[], useGrounding: boolean) {
  const ai = await getGeminiClient();
  return ai.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: {
      systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
      ...(useGrounding ? { tools: [{ googleSearch: {} }] } : {}),
    },
  });
}

function ChatBubbles({
  messages,
  loading,
  loadingText,
  error,
  bottomRef,
}: {
  messages: ChatMessage[];
  loading: boolean;
  loadingText: string;
  error: string;
  bottomRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="flex-1 space-y-4 mb-4">
      {messages.map((m) => (
        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm whitespace-pre-wrap ${
              m.role === 'user' ? 'bg-gold-400 text-ink-900 font-medium' : 'bg-white border-2 border-ink-100 text-ink-800'
            }`}
          >
            {m.text}
            {m.groundingSkipped && (
              <p className="mt-2 text-[11px] text-clay-500 italic">Answered without live search — today's grounding limit was reached.</p>
            )}
            {m.sources && m.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-ink-100 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Sources</p>
                {m.sources.map((s, i) => (
                  <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-sage-700 hover:underline truncate">
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
            <Loader2 className="w-4 h-4 animate-spin" /> {loadingText}
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
  );
}

function GeminiAssistant() {
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
    const history = messages.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
    const contents = [...history, { role: 'user', parts: [{ text: trimmed }] }];
    setMessages((m) => [...m, { id: `u_${Date.now()}`, role: 'user', text: trimmed }]);
    setLoading(true);
    try {
      let response;
      let groundingSkipped = false;
      try {
        response = await callGemini(contents, true);
      } catch (groundedError) {
        if (!isQuotaError(groundedError)) throw groundedError;
        groundingSkipped = true;
        response = await callGemini(contents, false);
      }
      const sources: GroundingSource[] =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web && { title: c.web.title || c.web.uri, uri: c.web.uri }).filter(Boolean) || [];
      setMessages((m) => [...m, { id: `a_${Date.now()}`, role: 'assistant', text: response.text || '(No response text)', sources, groundingSkipped }]);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong reaching the AI assistant.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col h-full">
      <header className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 bg-sage-50 text-sage-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Online · Gemini
        </span>
        <h1 className="text-3xl font-bold tracking-tight font-display mb-2">AI Assistant</h1>
        <p className="text-ink-500 text-sm">Doubt-solving and counselling help, grounded in live search results.</p>
      </header>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {SUGGESTIONS_ONLINE.map((s) => (
            <button key={s} onClick={() => send(s)} className="text-sm bg-white border-2 border-ink-100 hover:border-gold-300 rounded-full px-4 py-2 text-ink-700">
              {s}
            </button>
          ))}
        </div>
      )}

      <ChatBubbles messages={messages} loading={loading} loadingText="Thinking..." error={error} bottomRef={bottomRef} />

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
        <button type="submit" disabled={loading || !input.trim()} className="bg-gold-400 hover:bg-gold-300 disabled:opacity-40 text-ink-900 font-bold px-5 rounded-full flex items-center gap-2">
          <Send className="w-4 h-4" />
        </button>
      </form>
      <p className="text-[11px] text-ink-400 text-center mt-3">AI-generated — always verify counselling dates and cutoffs against the official KEA/NTA site.</p>
    </div>
  );
}

const LOCAL_MODEL_ID = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
const LOCAL_MODEL_SIZE = '~880 MB';

function hasWebGPU(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

function LocalAssistant() {
  const [engine, setEngine] = useState<any>(null);
  const [loadingModel, setLoadingModel] = useState(false);
  const [loadProgress, setLoadProgress] = useState<{ progress: number; text: string } | null>(null);
  const [loadError, setLoadError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const webgpuOk = hasWebGPU();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, generating]);

  async function loadModel() {
    setLoadError('');
    setLoadingModel(true);
    try {
      const webllm = await import('@mlc-ai/web-llm');
      const eng = await webllm.CreateMLCEngine(LOCAL_MODEL_ID, {
        initProgressCallback: (report: { progress: number; text: string }) => setLoadProgress(report),
      });
      setEngine(eng);
    } catch (e: any) {
      setLoadError(e?.message || 'Could not load the on-device model.');
    } finally {
      setLoadingModel(false);
    }
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || generating || !engine) return;
    setError('');
    setInput('');
    const history = messages.map((m) => ({ role: m.role === 'user' ? ('user' as const) : ('assistant' as const), content: m.text }));
    const chatMessages = [{ role: 'system' as const, content: LOCAL_SYSTEM_PROMPT }, ...history, { role: 'user' as const, content: trimmed }];
    setMessages((m) => [...m, { id: `u_${Date.now()}`, role: 'user', text: trimmed }]);
    const assistantId = `a_${Date.now()}`;
    setMessages((m) => [...m, { id: assistantId, role: 'assistant', text: '' }]);
    setGenerating(true);
    try {
      const stream = await engine.chat.completions.create({ messages: chatMessages, stream: true });
      let full = '';
      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content || '';
        full += delta;
        setMessages((m) => m.map((msg) => (msg.id === assistantId ? { ...msg, text: full } : msg)));
      }
    } catch (e: any) {
      setError(e?.message || 'Something went wrong generating a response.');
      setMessages((m) => m.filter((msg) => msg.id !== assistantId));
    } finally {
      setGenerating(false);
    }
  }

  if (!webgpuOk) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-rose-500" />
        </div>
        <h1 className="text-2xl font-bold font-display text-ink-900 mb-2">This device can't run the offline AI</h1>
        <p className="text-ink-500 text-sm max-w-md mx-auto">
          The offline assistant needs WebGPU, which isn't available in this browser/device. Try a recent version of Chrome or Edge on a
          laptop or a newer Android phone. Alternatively, ask your admin to add a Gemini API key for the online assistant instead.
        </p>
      </div>
    );
  }

  if (!engine) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-sage-50 flex items-center justify-center mx-auto mb-4">
          <Cpu className="w-8 h-8 text-sage-600" />
        </div>
        <h1 className="text-2xl font-bold font-display text-ink-900 mb-2">Offline AI Assistant</h1>
        <p className="text-ink-500 text-sm max-w-md mx-auto mb-6">
          Runs entirely on this device — no API key, no server, no internet needed once downloaded. It can't look up live news or
          current dates, only help with subject doubts and general questions.
        </p>
        {!loadingModel && (
          <button
            onClick={loadModel}
            className="bg-gold-400 hover:bg-gold-300 text-ink-900 font-bold px-6 py-3 rounded-full inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Load Model ({LOCAL_MODEL_SIZE}, one-time)
          </button>
        )}
        {loadingModel && (
          <div className="max-w-xs mx-auto">
            <div className="h-2 bg-ink-100 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-gold-400 transition-all" style={{ width: `${Math.round((loadProgress?.progress || 0) * 100)}%` }} />
            </div>
            <p className="text-xs text-ink-400">{loadProgress?.text || 'Starting download...'}</p>
          </div>
        )}
        {loadError && <p className="text-xs text-rose-600 mt-4">{loadError}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col h-full">
      <header className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 bg-ink-100 text-ink-600 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
          <Cpu className="w-3.5 h-3.5" /> Offline · On this device
        </span>
        <h1 className="text-3xl font-bold tracking-tight font-display mb-2">AI Assistant</h1>
        <p className="text-ink-500 text-sm">Subject-doubt help, running fully offline on this device.</p>
      </header>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {SUGGESTIONS_LOCAL.map((s) => (
            <button key={s} onClick={() => send(s)} className="text-sm bg-white border-2 border-ink-100 hover:border-gold-300 rounded-full px-4 py-2 text-ink-700">
              {s}
            </button>
          ))}
        </div>
      )}

      <ChatBubbles messages={messages} loading={generating && messages[messages.length - 1]?.text === ''} loadingText="Generating..." error={error} bottomRef={bottomRef} />

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
          placeholder="Ask a subject doubt..."
          className="flex-1 border-2 border-ink-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-gold-400 bg-white"
        />
        <button type="submit" disabled={generating || !input.trim()} className="bg-gold-400 hover:bg-gold-300 disabled:opacity-40 text-ink-900 font-bold px-5 rounded-full flex items-center gap-2">
          <Send className="w-4 h-4" />
        </button>
      </form>
      <p className="text-[11px] text-ink-400 text-center mt-3">Running offline on this device — no live news or current dates.</p>
    </div>
  );
}

export default function AiAssistant() {
  return API_KEY ? <GeminiAssistant /> : <LocalAssistant />;
}
