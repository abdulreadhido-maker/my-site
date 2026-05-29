import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestPayload {
  message: string;
  conversationHistory?: ChatMessage[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const payload: RequestPayload = await req.json();
    const { message, conversationHistory } = payload;

    // يفضل دائماً جلب المفتاح من الـ Environment Variables الخاصة بـ Supabase لحمايته
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY') || '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';

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'محتوى الرسالة مطلوب' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `أنت مساعد ومستشار برمجيات ذكي وخبير في الحماية والأمن السيبراني. تجيب بدقة عالية وباللغة العربية الفصحى دائماً وبأسلوب تقني مميز ومحترف.

القواعد المتبعة:
- تذكر دائماً السياق السابق للمحادثة لمساعدة المستخدم بناءً على ما تم نقاشه.
- قم بتنسيق الردود التقنية والأكواد البرمجية بشكل منظم يسهل قراءته.
- إذا طلب منك تدقيق كود برمي، ابحث عن الثغرات الشائعة مثل XSS أو SQL Injection وأشر إليها مباشرة مع الحل الفوري.`;

    // بناء مصفوفة الرسائل مع الحفاظ على الذاكرة والسياق
    let apiMessages: ChatMessage[] = [{ role: "system", content: systemPrompt }];

    if (conversationHistory && Array.isArray(conversationHistory)) {
      const sanitizedHistory = conversationHistory.filter(msg => msg.role === 'user' || msg.role === 'assistant');
      apiMessages = [...apiMessages, ...sanitizedHistory];
    } else {
      apiMessages.push({ role: "user", content: message });
    }

    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": Deno.env.get('SUPABASE_URL') || 'https://supabase.co',
        "X-Title": "AI Advanced Assistant Studio"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp:free",
        messages: apiMessages,
        temperature: 0.65,
        max_tokens: 1200,
      }),
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error(`OpenRouter error [${openRouterResponse.status}]: ${errorText}`);
      
      let clientFriendlyMessage = 'واجه خادم المعالجة صعوبة في توليد الرد حالياً.';
      if (openRouterResponse.status === 401) clientFriendlyMessage = 'فشل التحقق من صلاحية مفتاح ربط الذكاء الاصطناعي.';
      if (openRouterResponse.status === 429) clientFriendlyMessage = 'الضغط مرتفع جداً على الخوادم حالياً، يرجى إعادة المحاولة بعد قليل.';

      return new Response(
        JSON.stringify({ response: clientFriendlyMessage }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseData = await openRouterResponse.json();
    const generatedText = responseData.choices?.[0]?.message?.content || 'لم أتمكن من استخلاص الرد بشكل صحيح.';

    return new Response(
      JSON.stringify({ response: generatedText }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ response: 'حدث خطأ غير متوقع بالأنظمة الداخلية.', error: err.message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
