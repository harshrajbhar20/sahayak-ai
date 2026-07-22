"use client";

import { useState, useCallback, useRef } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  Camera,
  Mic,
  Brain,
  Sparkles,
  Upload,
  Loader2,
  Languages,
  BookOpen,
  Calculator,
  Cloud,
  Globe,
  GraduationCap,
  Heart,
  Wifi,
  Github,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

type Lang = "hi" | "en";

type Quiz = {
  title: string;
  questions: Array<{
    q: string;
    options: string[];
    answer: number;
    explanation: string;
  }>;
};

type AgentTrace = Array<{
  role: "user" | "assistant" | "tool";
  content: string;
}>;

export default function Home() {
  const [lang, setLang] = useState<Lang>("hi");
  const [tab, setTab] = useState("lesson");

  const t = (hi: string, en: string) => (lang === "hi" ? hi : en);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 via-white to-teal-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-amber-200/60 bg-white/85 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 grid place-items-center text-white shadow-md shadow-amber-200">
              <GraduationCap className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-base sm:text-lg text-slate-900 leading-tight truncate">
                {t("सहायक AI", "Sahayak AI")}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                {t("ग्रामीण छात्रों के लिए ट्यूटर", "A tutor for rural students")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:inline-flex border-amber-300 text-amber-700 bg-amber-50">
              <Sparkles className="size-3 mr-1" />
              Gemma 4 · E4B
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLang((p) => (p === "hi" ? "en" : "hi"))}
              className="border-slate-300"
            >
              <Languages className="size-4 mr-1" />
              {lang === "hi" ? "EN" : "हिं"}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-amber-100 bg-gradient-to-br from-amber-100/60 via-rose-50 to-teal-50">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <Badge className="mb-3 bg-rose-500 hover:bg-rose-500">
                <Heart className="size-3 mr-1" />
                {t("हाइपर-लोकल · सामाजिक प्रभाव", "Hyper-Local · Social Impact")}
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                {t(
                  "हर बच्चे के लिए, हर भाषा में, हर जगह — एक शिक्षक।",
                  "A teacher for every child, in every language, everywhere."
                )}
              </h2>
              <p className="mt-3 text-slate-600 text-sm sm:text-base max-w-prose">
                {t(
                  "Sahayak AI ग्रामीण भारत के छात्रों के लिए Gemma 4 पर बना एक मल्टीमॉडल ट्यूटर है। तस्वीर खींचें, बोलकर सवाल पूछें, या क्विज़ बनाएँ — सब कुछ ऑफलाइन-फर्स्ट, हिंदी में।",
                  "Sahayak AI is a Gemma 4 multimodal tutor for rural India. Snap a textbook page, ask by voice, or generate a quiz — offline-first, in Hindi."
                )}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Pill icon={<Camera className="size-3.5" />} label={t("मल्टीमॉडल", "Multimodal")} />
                <Pill icon={<Wifi className="size-3.5" />} label={t("ऑफलाइन-फर्स्ट", "Offline-first")} />
                <Pill icon={<Brain className="size-3.5" />} label={t("फंक्शन कॉलिंग", "Function calling")} />
                <Pill icon={<Languages className="size-3.5" />} label={t("हिंदी + EN", "Hindi + EN")} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <StatBlock value="4B" label={t("पैरामीटर", "Param model")} sub="Gemma 3 4B-IT" />
              <StatBlock value="4" label={t("मोडलिटीज़", "Modalities")} sub="img · voice · text · tools" />
              <StatBlock value="0₹" label={t("छात्र लागत", "Student cost")} sub={t("हमेशा मुफ्त", "always free")} />
            </div>
          </div>
        </div>
      </section>

      {/* Main tabs */}
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-6 sm:py-8">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full mb-6 bg-amber-100/60">
            <TabsTrigger value="lesson" className="data-[state=active]:bg-white">
              <Camera className="size-4 mr-2" />
              <span className="hidden sm:inline">{t("फोटो पाठ", "Photo Lesson")}</span>
              <span className="sm:hidden">{t("फोटो", "Photo")}</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="data-[state=active]:bg-white">
              <Mic className="size-4 mr-2" />
              <span className="hidden sm:inline">{t("आवाज़ सवाल", "Voice Doubt")}</span>
              <span className="sm:hidden">{t("आवाज़", "Voice")}</span>
            </TabsTrigger>
            <TabsTrigger value="quiz" className="data-[state=active]:bg-white">
              <Sparkles className="size-4 mr-2" />
              <span className="hidden sm:inline">{t("क्विज़ बिल्डर", "Quiz Builder")}</span>
              <span className="sm:hidden">{t("क्विज़", "Quiz")}</span>
            </TabsTrigger>
            <TabsTrigger value="agent" className="data-[state=active]:bg-white">
              <Brain className="size-4 mr-2" />
              <span className="hidden sm:inline">{t("एजेंट लैब", "Agent Lab")}</span>
              <span className="sm:hidden">{t("एजेंट", "Agent")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lesson"><PhotoLessonTab lang={lang} t={t} /></TabsContent>
          <TabsContent value="voice"><VoiceDoubtTab lang={lang} t={t} /></TabsContent>
          <TabsContent value="quiz"><QuizBuilderTab lang={lang} t={t} /></TabsContent>
          <TabsContent value="agent"><AgentLabTab lang={lang} t={t} /></TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-100 bg-white mt-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            <p className="font-medium text-slate-700">
              {t("Gemma 4 Hackathon Sprint · Local Frontier Innovation", "Gemma 4 Hackathon Sprint · Local Frontier Innovation")}
            </p>
            <p className="mt-0.5">
              {t(
                "Google Gemma 3 4B-IT पर बना · HF Inference API · Next.js 16",
                "Built on Google Gemma 3 4B-IT · HF Inference API · Next.js 16"
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Github className="size-3.5" /> GitHub repo
            </span>
            <Separator orientation="vertical" className="h-3" />
            <span className="inline-flex items-center gap-1">
              <ExternalLink className="size-3.5" /> Live demo
            </span>
          </div>
        </div>
      </footer>

      <Toaster richColors position="top-center" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reusable bits
// ---------------------------------------------------------------------------

function Pill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 border border-amber-200 px-3 py-1 text-xs font-medium text-slate-700">
      {icon}
      {label}
    </span>
  );
}

function StatBlock({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <div className="rounded-xl bg-white/80 border border-amber-200 p-3 text-center shadow-sm">
      <div className="text-2xl font-extrabold bg-gradient-to-br from-amber-600 to-rose-600 bg-clip-text text-transparent">
        {value}
      </div>
      <div className="text-[11px] font-semibold text-slate-700 mt-0.5">{label}</div>
      <div className="text-[10px] text-slate-500">{sub}</div>
    </div>
  );
}

function ModeBadge({ mode }: { mode: "live" | "mock" }) {
  return mode === "live" ? (
    <Badge className="bg-emerald-500 hover:bg-emerald-500">
      <CheckCircle2 className="size-3 mr-1" /> Live Gemma 4
    </Badge>
  ) : (
    <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50">
      <AlertCircle className="size-3 mr-1" /> Demo mode (set HF_TOKEN)
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Photo Lesson tab
// ---------------------------------------------------------------------------

function PhotoLessonTab({
  lang,
  t,
}: {
  lang: Lang;
  t: (hi: string, en: string) => string;
}) {
  const [image, setImage] = useState<string | null>(null);
  const [grade, setGrade] = useState("Class 8");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ explanation: string; mode: "live" | "mock" } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Strip the data URL prefix, keep only base64 payload
      const base64 = dataUrl.split(",")[1] ?? "";
      setImage(base64);
      setResult(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) onFile(file);
  };

  const submit = async () => {
    if (!image) {
      toast.error(t("पहले एक तस्वीर चुनें", "Pick an image first"));
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, grade, language: lang }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setResult({ explanation: json.explanation, mode: json.mode });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Camera className="size-5 text-amber-600" />
            {t("पाठ्यपुस्तक पृष्ठ अपलोड करें", "Upload a textbook page")}
          </CardTitle>
          <CardDescription>
            {t(
              "किसी भी पृष्ठ की फोटो खींचें — Gemma 4 उसे पढ़ेगा और सरल शब्दों में समझाएगा।",
              "Snap a photo of any page — Gemma 4 will read it and explain in simple words."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/40 hover:bg-amber-50 transition-colors p-6 grid place-items-center min-h-[200px]"
          >
            {image ? (
              <img
                src={`data:image/jpeg;base64,${image}`}
                alt="Uploaded textbook page"
                className="max-h-[280px] rounded-lg shadow-md object-contain"
              />
            ) : (
              <div className="text-center text-slate-500">
                <Upload className="size-8 mx-auto mb-2 text-amber-500" />
                <p className="text-sm font-medium">
                  {t("तस्वीर यहाँ छोड़ें या क्लिक करके चुनें", "Drop image here or click to pick")}
                </p>
                <p className="text-xs mt-1">PNG / JPG · max ~5MB</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
          </div>

          <div>
            <Label className="text-xs text-slate-600">{t("कक्षा", "Grade")}</Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"].map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={submit}
            disabled={loading || !image}
            className="w-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white"
          >
            {loading ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Sparkles className="size-4 mr-2" />}
            {t("समझाएँ", "Explain it")}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-slate-900">
            <span className="flex items-center gap-2">
              <BookOpen className="size-5 text-rose-500" />
              {t("सरल व्याख्या", "Explanation")}
            </span>
            {result && <ModeBadge mode={result.mode} />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-3 bg-amber-100 rounded animate-pulse" style={{ width: `${90 - i * 8}%` }} />
              ))}
            </div>
          ) : result ? (
            <ScrollArea className="h-[420px] pr-3">
              <div className="prose prose-sm prose-slate max-w-none">
                <ReactMarkdown>{result.explanation}</ReactMarkdown>
              </div>
            </ScrollArea>
          ) : (
            <div className="h-[420px] grid place-items-center text-center text-slate-400 text-sm">
              {t(
                "तस्वीर अपलोड करें और \"समझाएँ\" बटन दबाएँ।",
                "Upload an image and press Explain it."
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Voice Doubt tab
// ---------------------------------------------------------------------------

function VoiceDoubtTab({
  lang,
  t,
}: {
  lang: Lang;
  t: (hi: string, en: string) => string;
}) {
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ question: string; answer: string; mode: "live" | "mock" } | null>(null);
  const [recording, setRecording] = useState(false);

  // Web Speech API for live transcription (Chrome/Edge only). Falls back gracefully.
  const recogRef = useRef<any>(null);
  const startRecording = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error(t(
        "यह ब्राउज़र वॉइस इनपुट समर्थित नहीं करता। कृपया Chrome आज़माएँ या टेक्स्ट टाइप करें।",
        "This browser doesn't support voice input. Try Chrome or type the question."
      ));
      return;
    }
    const recog = new SR();
    recog.lang = lang === "hi" ? "hi-IN" : "en-IN";
    recog.interimResults = false;
    recog.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      toast.success(t("ट्रांसक्रिप्ट हो गया", "Transcribed"));
    };
    recog.onerror = () => toast.error(t("रिकॉर्डिंग विफल", "Recording failed"));
    recog.onend = () => setRecording(false);
    recog.start();
    recogRef.current = recog;
    setRecording(true);
  };
  const stopRecording = () => {
    recogRef.current?.stop();
    setRecording(false);
  };

  const submit = async () => {
    if (!transcript.trim()) {
      toast.error(t("पहले सवाल लिखें या बोलें", "Type or speak a question first"));
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, language: lang }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setResult({ question: json.question, answer: json.answer, mode: json.mode });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Mic className="size-5 text-rose-500" />
            {t("अपना सवाल पूछें", "Ask your question")}
          </CardTitle>
          <CardDescription>
            {t(
              "बोलकर पूछें (Chrome में) या टाइप करें — Gemma 4 उसी भाषा में जवाब देगा।",
              "Speak (in Chrome) or type — Gemma 4 answers in the same language."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={recording ? stopRecording : startRecording}
              variant={recording ? "destructive" : "outline"}
              className="rounded-full size-20 p-0"
              aria-label={recording ? "Stop recording" : "Start recording"}
            >
              {recording ? <Loader2 className="size-7 animate-spin" /> : <Mic className="size-7" />}
            </Button>
          </div>
          <p className="text-center text-xs text-slate-500">
            {recording
              ? t("सुन रहा है… बोलें", "Listening… speak now")
              : t("माइक पर क्लिक करके बोलें", "Tap the mic and speak")}
          </p>
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={t(
              "जैसे: जल चक्र क्या है?",
              "e.g. What is the water cycle?"
            )}
            rows={3}
          />
          <Button
            onClick={submit}
            disabled={loading || !transcript.trim()}
            className="w-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white"
          >
            {loading ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Sparkles className="size-4 mr-2" />}
            {t("जवाब दें", "Answer")}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-slate-900">
            <span className="flex items-center gap-2">
              <BookOpen className="size-5 text-amber-600" />
              {t("जवाब", "Answer")}
            </span>
            {result && <ModeBadge mode={result.mode} />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result ? (
            <ScrollArea className="h-[420px] pr-3">
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-3 text-sm">
                <span className="text-xs font-semibold text-amber-700 uppercase">{t("सवाल", "Question")}</span>
                <p className="text-slate-800 mt-1">{result.question}</p>
              </div>
              <div className="prose prose-sm prose-slate max-w-none">
                <ReactMarkdown>{result.answer}</ReactMarkdown>
              </div>
            </ScrollArea>
          ) : (
            <div className="h-[420px] grid place-items-center text-center text-slate-400 text-sm">
              {t("सवाल पूछें और जवाब यहाँ दिखेगा।", "Ask a question and the answer will appear here.")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quiz Builder tab
// ---------------------------------------------------------------------------

function QuizBuilderTab({
  lang,
  t,
}: {
  lang: Lang;
  t: (hi: string, en: string) => string;
}) {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState("3");
  const [grade, setGrade] = useState("Class 8");
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [mode, setMode] = useState<"live" | "mock" | null>(null);

  const submit = async () => {
    if (!topic.trim()) {
      toast.error(t("विषय दर्ज करें", "Enter a topic"));
      return;
    }
    setLoading(true);
    setQuiz(null);
    setAnswers({});
    setSubmitted(false);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, grade, count: Number(count), language: lang }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setQuiz(json.quiz);
      setMode(json.mode);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const score = quiz
    ? quiz.questions.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0)
    : 0;

  return (
    <div className="grid lg:grid-cols-5 gap-5">
      <Card className="lg:col-span-2 border-amber-200 h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Sparkles className="size-5 text-amber-600" />
            {t("क्विज़ जनरेटर", "Quiz Generator")}
          </CardTitle>
          <CardDescription>
            {t(
              "कोई भी विषय दर्ज करें — Gemma 4 तुरंत अभ्यास क्विज़ बनाएगा।",
              "Enter any topic — Gemma 4 instantly builds a practice quiz."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-slate-600">{t("विषय", "Topic")}</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t("जैसे: अपवर्तन, प्रकाश संश्लेषण, भिन्न", "e.g. refraction, photosynthesis, fractions")}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-600">{t("कक्षा", "Grade")}</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"].map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-600">{t("प्रश्न संख्या", "Questions")}</Label>
              <Select value={count} onValueChange={setCount}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["1", "2", "3", "4", "5"].map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={submit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white"
          >
            {loading ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Sparkles className="size-4 mr-2" />}
            {t("क्विज़ बनाएँ", "Generate quiz")}
          </Button>
          {mode && (
            <div className="flex justify-center pt-1">
              <ModeBadge mode={mode} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-slate-900">
            <span>{quiz?.title ?? t("क्विज़", "Quiz")}</span>
            {submitted && quiz && (
              <Badge className="bg-emerald-500 hover:bg-emerald-500">
                {t("स्कोर", "Score")}: {score}/{quiz.questions.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(Number(count) || 3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-amber-100 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-amber-50 rounded animate-pulse" />
                  <div className="h-3 bg-amber-50 rounded animate-pulse" />
                  <div className="h-3 bg-amber-50 rounded animate-pulse w-2/3" />
                </div>
              ))}
            </div>
          ) : quiz ? (
            <ScrollArea className="h-[500px] pr-3">
              <div className="space-y-5">
                {quiz.questions.map((q, i) => (
                  <div key={i} className="rounded-xl border border-amber-200 p-4 bg-white">
                    <p className="font-medium text-slate-900 mb-3">
                      <span className="text-amber-600 mr-1">Q{i + 1}.</span>
                      {q.q}
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {q.options.map((opt, j) => {
                        const picked = answers[i] === j;
                        const correct = submitted && q.answer === j;
                        const wrong = submitted && picked && !correct;
                        return (
                          <button
                            key={j}
                            disabled={submitted}
                            onClick={() => setAnswers((p) => ({ ...p, [i]: j }))}
                            className={`text-left text-sm rounded-lg border px-3 py-2 transition-colors ${
                              correct
                                ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                                : wrong
                                ? "border-rose-400 bg-rose-50 text-rose-800 line-through"
                                : picked
                                ? "border-amber-400 bg-amber-50"
                                : "border-slate-200 hover:border-amber-300 hover:bg-amber-50/50"
                            }`}
                          >
                            <span className="font-mono mr-2 text-xs text-slate-500">{String.fromCharCode(65 + j)}</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {submitted && (
                      <p className="text-xs text-slate-600 mt-2 italic">
                        💡 {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
                {!submitted ? (
                  <Button
                    onClick={() => setSubmitted(true)}
                    className="w-full bg-slate-900 hover:bg-slate-800"
                    disabled={Object.keys(answers).length < quiz.questions.length}
                  >
                    {t("जमा करें और जाँचें", "Submit & check")}
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setSubmitted(false);
                      setAnswers({});
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    {t("फिर से कोशिश करें", "Try again")}
                  </Button>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="h-[500px] grid place-items-center text-center text-slate-400 text-sm">
              {t("विषय दर्ज करें और \"क्विज़ बनाएँ\" दबाएँ।", "Enter a topic and press Generate quiz.")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agent Lab tab
// ---------------------------------------------------------------------------

function AgentLabTab({
  lang,
  t,
}: {
  lang: Lang;
  t: (hi: string, en: string) => string;
}) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    answer: string;
    trace: AgentTrace;
    toolsAvailable: string[];
    mode: "live" | "mock";
  } | null>(null);

  const examples = lang === "hi"
    ? [
        { q: "पटना में आज मौसम कैसा है?", icon: <Cloud className="size-3.5" /> },
        { q: "प्रकाश संश्लेषण के बारे में बताओ", icon: <Globe className="size-3.5" /> },
        { q: "245 × 18 कितना होता है?", icon: <Calculator className="size-3.5" /> },
      ]
    : [
        { q: "What is the weather in Patna today?", icon: <Cloud className="size-3.5" /> },
        { q: "Tell me about photosynthesis", icon: <Globe className="size-3.5" /> },
        { q: "What is 245 multiplied by 18?", icon: <Calculator className="size-3.5" /> },
      ];

  const submit = async (q?: string) => {
    const query = (q ?? question).trim();
    if (!query) {
      toast.error(t("सवाल दर्ज करें", "Enter a question"));
      return;
    }
    setQuestion(query);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query, language: lang }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setResult(json);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Brain className="size-5 text-rose-500" />
            {t("स्वायत्त एजेंट", "Autonomous agent")}
          </CardTitle>
          <CardDescription>
            {t(
              "Gemma 4 स्वयं तय करता है कि कौन सा टूल चलाना है — Wikipedia, मौसम, या गणित।",
              "Gemma 4 itself decides which tool to run — Wikipedia, weather, or math."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-slate-600">{t("उदाहरण", "Try examples")}</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {examples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => submit(ex.q)}
                  className="text-xs rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-slate-700 hover:bg-amber-100 inline-flex items-center gap-1.5"
                >
                  {ex.icon}
                  {ex.q}
                </button>
              ))}
            </div>
          </div>
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t("अपना सवाल लिखें…", "Type your question…")}
            rows={3}
          />
          <Button
            onClick={() => submit()}
            disabled={loading || !question.trim()}
            className="w-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white"
          >
            {loading ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Brain className="size-4 mr-2" />}
            {t("एजेंट चलाएँ", "Run agent")}
          </Button>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 mb-2">
              {t("उपलब्ध टूल्स", "Available tools")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: "search_wikipedia", icon: <Globe className="size-3" /> },
                { name: "get_weather", icon: <Cloud className="size-3" /> },
                { name: "calculate", icon: <Calculator className="size-3" /> },
              ].map((tool) => (
                <Badge key={tool.name} variant="secondary" className="font-mono text-[10px]">
                  {tool.icon}
                  <span className="ml-1">{tool.name}</span>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-slate-900">
            <span>{t("रिज़निंग ट्रेस", "Reasoning trace")}</span>
            {result && <ModeBadge mode={result.mode} />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result ? (
            <ScrollArea className="h-[500px] pr-3">
              <div className="space-y-3">
                {result.trace.map((msg, i) => (
                  <TraceMessage key={i} msg={msg} />
                ))}
                <Separator className="my-3" />
                <div className="rounded-xl bg-gradient-to-br from-amber-50 to-rose-50 border border-amber-200 p-4">
                  <p className="text-xs font-semibold text-amber-700 uppercase mb-2">
                    {t("अंतिम उत्तर", "Final answer")}
                  </p>
                  <div className="prose prose-sm prose-slate max-w-none">
                    <ReactMarkdown>{result.answer}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="h-[500px] grid place-items-center text-center text-slate-400 text-sm">
              {t("एजेंट यहाँ अपना रिज़निंग दिखाएगा।", "The agent will show its reasoning here.")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TraceMessage({ msg }: { msg: AgentTrace[number] }) {
  const isUser = msg.role === "user";
  const isAssistant = msg.role === "assistant";
  const isTool = msg.role === "tool";

  return (
    <div
      className={`rounded-lg p-3 text-sm border ${
        isUser
          ? "bg-slate-100 border-slate-200"
          : isAssistant
          ? "bg-amber-50 border-amber-200"
          : "bg-emerald-50 border-emerald-200 font-mono text-xs"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {isUser && <Mic className="size-3" />}
        {isAssistant && <Brain className="size-3" />}
        {isTool && <Calculator className="size-3" />}
        {msg.role}
      </div>
      <div className={`whitespace-pre-wrap ${isTool ? "break-all" : ""}`}>
        {msg.content || <span className="italic text-slate-400">(empty)</span>}
      </div>
    </div>
  );
}
