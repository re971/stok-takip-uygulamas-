import { useState } from "react";
import { Sparkles, MessageSquareCode, Play, Copy, Check, Save, Cpu, Layers } from "lucide-react";
import { motion } from "motion/react";
import { StockComponent, Project } from "../types";

interface CircuitAiAssistantProps {
  stockComponents: StockComponent[];
  onSaveCreatedProject: (project: Omit<Project, "id">) => Promise<void>;
}

interface AiResponse {
  projectTitle: string;
  projectDescription: string;
  circuitInstructions: string;
  recommendedComponents: { name: string; quantity: number; category: string }[];
  arduinoCode: string;
}

const CONSTANT_IDEAS = [
  "Sıcaklık kontrollü servo motorlu fan denetleyicisi",
  "Çift bölmeli mini mesafe takip ve park sensörü",
  "ESP32 ile LCD Ekranlı Wi-Fi Hava İstasyonu",
  "Röle modülü ve fotosel ile akıllı sokak lambası"
];

export default function CircuitAiAssistant({
  stockComponents,
  onSaveCreatedProject
}: CircuitAiAssistantProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorStatus, setErrorStatus] = useState("");

  const handleGenerate = async (targetPrompt: string) => {
    if (!targetPrompt.trim()) return;
    setLoading(true);
    setErrorStatus("");
    setSaved(false);
    setResult(null);

    try {
      const response = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: targetPrompt,
          currentStock: stockComponents
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Sunucu hatası oluştu.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Öneri alınırken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.arduinoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProject = async () => {
    if (!result) return;
    try {
      const newProj: Omit<Project, "id"> = {
        title: result.projectTitle,
        description: result.projectDescription,
        status: "Planlandı",
        circuitInstructions: result.circuitInstructions,
        codeSnippet: result.arduinoCode,
        neededComponents: result.recommendedComponents,
        userId: stockComponents[0]?.userId || "default_maker"
      };
      await onSaveCreatedProject(newProj);
      setSaved(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Utility to match generated components to current stock
  const matchWithStock = (neededName: string) => {
    const matched = stockComponents.find(c => 
      c.name.toLowerCase().includes(neededName.toLowerCase()) || 
      neededName.toLowerCase().includes(c.name.toLowerCase())
    );
    return matched;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-sky-400 animate-pulse" />
          <h3 className="text-base font-medium text-white font-sans">
            AI Devre ve Kod Yardımcısı (Gemini)
          </h3>
        </div>
        <span className="text-[10px] font-mono text-sky-400 bg-sky-950/40 border border-sky-800/30 px-2 py-0.5 rounded-md">
          v2.5 Flash
        </span>
      </div>

      {/* Suggestion Prompts */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {CONSTANT_IDEAS.map((idea, idx) => (
            <button
              key={idx}
              id={`idea-preset-${idx}`}
              onClick={() => {
                setPrompt(idea);
                handleGenerate(idea);
              }}
              className="text-left text-xs text-slate-400 hover:text-sky-300 bg-slate-950 hover:bg-slate-950/80 border border-slate-800 hover:border-sky-800/40 px-3 py-1.5 rounded-lg transition-all cursor-pointer truncate max-w-full"
            >
              🚀 {idea}
            </button>
          ))}
        </div>

        {/* Input Controller */}
        <div className="flex gap-2.5">
          <input
            type="text"
            id="ai-prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate(prompt)}
            placeholder="Yapmak istediğiniz devreyi veya projeyi tanımıyla yazın... (Örn: Mesafe kontrollü LCD radar devresi)"
            className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-sky-500 focus:outline-none transition-colors"
          />
          <button
            type="button"
            id="ai-generate-btn"
            disabled={loading}
            onClick={() => handleGenerate(prompt)}
            className="px-5 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:bg-slate-800 disabled:text-slate-500 shadow-lg shadow-sky-950/30"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-white text-transparent" />
            )}
            <span>Üret</span>
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-8 border border-dashed border-slate-800 bg-slate-950/40 rounded-xl flex flex-col items-center justify-center space-y-3"
        >
          <div className="p-4 bg-sky-950/30 border border-sky-800/30 rounded-2xl animate-spin">
            <Cpu className="w-6 h-6 text-sky-400" />
          </div>
          <span className="text-xs font-mono text-sky-400 animate-pulse">Sensörler taranıyor, devre şeması çiziliyor...</span>
        </motion.div>
      )}

      {/* Error state */}
      {errorStatus && (
        <div className="p-4 bg-rose-950/30 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex flex-col space-y-2">
          <span className="font-semibold font-mono">⚠️ Bağlantı Hatası:</span>
          <span>{errorStatus}</span>
          <span className="text-[10px] text-slate-400">Not: Projeyi çalıştırmak ve AI desteği almak için sol tarafta veya ayarlar penceresinde geçerli bir GEMINI_API_KEY bulunmalıdır.</span>
        </div>
      )}

      {/* Results panel */}
      {result && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5 border-t border-slate-800 pt-5 text-sm"
        >
          {/* Output Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950 p-4 border border-slate-800/40 rounded-xl">
            <div>
              <h4 className="text-base font-medium text-white font-sans">{result.projectTitle}</h4>
              <p className="text-xs text-slate-400 font-sans mt-0.5">{result.projectDescription}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                id="ai-project-save"
                onClick={handleSaveProject}
                disabled={saved}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                  saved 
                    ? "bg-slate-800 text-slate-400" 
                    : "bg-sky-600 hover:bg-sky-500 text-white"
                }`}
              >
                {saved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
                <span>{saved ? "Projelerime Kaydedildi" : "Proje Olarak Kaydet"}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Necessary Components with Stock Matching */}
            <div className="space-y-3">
              <h5 className="text-xs font-mono text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-400" /> Malzeme Listesi ve Stok Eşleme
              </h5>
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-2 max-h-60 overflow-y-auto">
                {result.recommendedComponents.map((rec, idx) => {
                  const matchedStock = matchWithStock(rec.name);
                  const isStockEnough = matchedStock ? matchedStock.quantity >= rec.quantity : false;

                  return (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-900 border border-slate-800/60 rounded-lg flex items-center justify-between text-xs gap-3"
                    >
                      <div>
                        <span className="text-white font-medium block">{rec.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Gereken: {rec.quantity} adet ({rec.category})</span>
                      </div>

                      <div className="text-right">
                        {matchedStock ? (
                          isStockEnough ? (
                            <span className="text-emerald-400 font-semibold text-[10px] bg-emerald-950/40 px-2 py-0.5 border border-emerald-800/40 rounded-md">
                              Mevcut ({matchedStock.quantity})
                            </span>
                          ) : (
                            <span className="text-amber-500 font-semibold text-[10px] bg-amber-950/40 px-2 py-0.5 border border-amber-800/40 rounded-md">
                              Eksik ({matchedStock.quantity})
                            </span>
                          )
                        ) : (
                          <span className="text-rose-500 font-semibold text-[10px] bg-rose-950/40 px-2 py-0.5 border border-rose-800/40 rounded-md">
                            Stokta Yok
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Connection Guide */}
            <div className="space-y-3">
              <h5 className="text-xs font-mono text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquareCode className="w-4 h-4 text-sky-400" /> Devre Kurulum Talimatı
              </h5>
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 text-xs text-slate-300 space-y-2 max-h-60 overflow-y-auto leading-relaxed">
                {result.circuitInstructions.split("\n").map((line, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-sky-500 font-mono select-none">{idx + 1}.</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Code Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-mono text-sky-400 uppercase tracking-wider">Otomatik Üretilen Arduino Kodu (.ino)</h5>
              <button
                type="button"
                id="copy-ai-code-btn"
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md text-xs font-medium cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Kopyalandı!" : "Kodu Kopyala"}</span>
              </button>
            </div>
            <div className="relative rounded-xl overflow-hidden border border-slate-800">
              <pre className="p-4 bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed max-h-60 select-all">
                <code>{result.arduinoCode}</code>
              </pre>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
