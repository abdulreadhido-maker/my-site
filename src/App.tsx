import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Trash2, 
  Sparkles, 
  Bot, 
  User, 
  Copy, 
  Check, 
  MessageSquare, 
  HelpCircle,
  Clock,
  ArrowDown
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // مراقبة التمرير لإظهار زر "النزول لأسفل" عند الحاجة
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isFarUp = scrollHeight - scrollTop - clientHeight > 400;
    setShowScrollBtn(isFarUp);
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userRawText = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userRawText,
      timestamp: new Date(),
    };

    // تجهيز سياق المحادثة بالكامل لإرساله للخادم (الحفاظ على الذاكرة)
    const conversationHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            message: userRawText,
            conversationHistory: [...conversationHistory, { role: 'user', content: userRawText }]
          }),
        }
      );

      if (!response.ok) throw new Error('فشل في الاتصال');
      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'عذراً، حدث خطأ أثناء معالجة الرد.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'عذراً، تعذر الاتصال بالخادم الذكي حالياً. يرجى التحقق من الشبكة.',
          timestamp: new Date(),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    "اكتب لي كود بايثون لتنظيف البيانات وعمل Script مؤتمت",
    "كيف يمكنني حماية موقعي وتطبيق React من ثغرات XSS؟",
    "اشرح لي مفهوم الـ Async/Await ببساطة مع أمثلة عملية"
  ];

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex overflow-hidden font-sans antialiased selection:bg-cyan-500/30">
      
      {/* الشريط الجانبي للشاشات الكبيرة */}
      <aside className="hidden md:flex w-72 bg-slate-900 border-r border-slate-800/80 flex-col p-4 justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">منصة المساعد الذكي</h2>
              <p className="text-[11px] text-cyan-400 font-medium">النسخة المتقدمة v2.0</p>
            </div>
          </div>

          <button 
            onClick={() => setMessages([])}
            disabled={messages.length === 0}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600/80 transition-all text-slate-300 hover:text-white text-xs disabled:opacity-40 disabled:pointer-events-none group"
          >
            <span className="font-medium">بدء جلسة جديدة</span>
            <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-rose-400 transition-colors" />
          </button>
        </div>

        <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-2 text-slate-300 font-medium mb-1">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>نظام الحماية والخصوصية</span>
          </div>
          <p dir="rtl" className="text-right leading-relaxed">تتم معالجة البيانات عبر قنوات مشفرة آمنة لحماية خصوصية بياناتك وأكوادك البرمجية بالكامل.</p>
        </div>
      </aside>

      {/* مساحة المحادثة الرئيسية */}
      <main className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 relative">
        
        {/* الهيدر العلوي */}
        <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="md:hidden w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white flex items-center gap-2">
                المساعد البرمجي الذكي
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </h1>
              <p className="text-xs text-slate-400 md:block hidden">مستشار التطوير وتدقيق الحماية الفورية</p>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>مسح</span>
            </button>
          )}
        </header>

        {/* منطقة عرض الرسائل الفلتر الديناميكي */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-8 space-y-6 relative scrollbar-thin scrollbar-thumb-slate-800"
        >
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[55vh] text-center px-4">
                <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/10 border border-blue-400/20 animate-pulse">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2 tracking-wide">مرحباً بك في مساحتك البرمجية الآمنة</h2>
                <p className="text-slate-400 text-sm max-w-md leading-relaxed mb-8">
                  اطرح استفساراتك البرمجية، اطلب تدقيقاً للثغرات، أو ابدأ بكتابة معمارية برمجية متكاملة الآن.
                </p>

                <div className="w-full max-w-lg grid grid-cols-1 gap-2.5" dir="rtl">
                  {quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(prompt)}
                      className="text-right text-xs px-4 py-3 bg-slate-900/60 hover:bg-slate-800/80 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-cyan-400 transition-all flex items-center gap-3 group"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                      <span>{prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 group ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${
                    message.role === 'user'
                      ? 'bg-blue-600 border-blue-500 shadow-blue-600/10'
                      : 'bg-slate-900 border-slate-800 shadow-slate-950/50 text-cyan-400'
                  }`}>
                    {message.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className="flex flex-col max-w-[85%] space-y-1">
                    <div className={`rounded-2xl px-4 py-3.5 relative ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/5'
                        : 'bg-slate-900/90 text-slate-100 border border-slate-800/80 shadow-lg shadow-slate-950/20'
                    }`}>
                      <p className="text-[13px] md:text-sm whitespace-pre-wrap leading-relaxed tracking-wide text-right" dir="rtl">
                        {message.content}
                      </p>

                      {/* زر النسخ السريع المظهر فقط عند التحويم */}
                      <div className={`absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                        message.role === 'user' ? 'hidden' : 'block'
                      }`}>
                        <button
                          onClick={() => copyToClipboard(message.content, message.id)}
                          className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700/50 text-slate-400 hover:text-white transition-colors"
                          title="نسخ النص"
                        >
                          {copiedId === message.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    
                    <span className={`text-[10px] text-slate-500 px-1 flex items-center gap-1 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <Clock className="w-2.5 h-2.5" />
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}

            {/* أنيميشن الانتظار وتحميل البيانات */}
            {isLoading && (
              <div className="flex gap-4 animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-500">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-900/60 rounded-2xl px-5 py-4 border border-slate-800/80 flex items-center">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* زر النزول السريع لأسفل المحادثة */}
        {showScrollBtn && (
          <button 
            onClick={() => scrollToBottom('smooth')}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 p-2 rounded-full bg-slate-900/90 border border-slate-700 text-cyan-400 shadow-xl hover:text-white hover:bg-slate-800 transition-all z-20 animate-bounce"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}

        {/* حقل الإدخال السفلي الثابت والمستقر */}
        <div className="border-t border-slate-800/80 bg-slate-900/40 backdrop-blur-md px-4 py-4 shrink-0 z-10">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 bg-slate-900/90 rounded-2xl border border-slate-800 focus-within:border-cyan-500/50 transition-all p-2.5 shadow-inner">
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white hover:opacity-95 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none shrink-0 shadow-md shadow-blue-600/10"
              >
                <Send className="w-4 h-4" />
              </button>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="اكتب استفسارك أو الصق الكود هنا..."
                className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 resize-none outline-none px-3 py-1.5 text-xs md:text-sm text-right leading-relaxed max-h-36 min-h-[24px]"
                rows={Math.min(input.split('\n').length, 5)}
                dir="rtl"
                disabled={isLoading}
              />
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-2.5 tracking-wide">
              اضغط <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-400 text-[9px]">Enter</kbd> للإرسال • <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-400 text-[9px]">Shift + Enter</kbd> لإضافة سطر جديد
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
