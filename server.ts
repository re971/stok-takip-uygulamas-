import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// Lazy initialization of Gemini API to prevent app crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY checks failed: Environment variable GEMINI_API_KEY is not defined.");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// AI Circuit suggestion endpoint
app.post("/api/ai/suggest", async (req, res) => {
  try {
    const { prompt, currentStock } = req.body;
    
    if (!prompt) {
      res.status(400).json({ error: "Lütfen bir proje tanımı veya fikri girin." });
      return;
    }

    const ai = getAiClient();
    
    const stockStr = currentStock && currentStock.length > 0
      ? currentStock.map((c: any) => `- Name: ${c.name}, Category: ${c.category}, Stock: ${c.quantity}, Location: ${c.location || "Belirtilmemiş"}`).join("\n")
      : "Stok boş. Hiçbir bileşen bulunmuyor.";

    const systemPrompt = `Sen bir Arduino ve elektronik uzmanısın. Kullanıcıların Arduino devre projeleri tasarlamasına, kod yazmasına ve stoklarındaki malzemelere göre malzeme analizi yapmasına yardımcı olursun.
Kullanıcının stok durumu şöyledir:
${stockStr}

Kullanıcı şu projeyi yapmak istiyor: "${prompt}"

Lütfen bu projenin tasarımını yap ve sonucu MUTLAKA aşağıdaki JSON formatında geriye döndür. Başka hiçbir açıklama yazısı ekleme, doğrudan geçerli bir JSON objesi üret.

JSON Formatı:
{
  "projectTitle": "Projenin adı",
  "projectDescription": "Projenin ne yaptığını açıklayan kısa ve net bir metin",
  "circuitInstructions": "Devre elemanlarının Arduino'ya ve birbirlerine nasıl bağlanacağını anlatan adım adım detaylı kurulum talimatı",
  "recommendedComponents": [
    {
      "name": "Bileşen Adı (Örn: Arduino Uno, HC-SR04 Sensör)",
      "quantity": 1,
      "category": "Kategori (Mikrodenetleyici, Sensör, Aktüatör, Ekran vb.)"
    }
  ],
  "arduinoCode": "Standard Arduino (.ino) code block with proper comment lines explaining setup and loop."
}

Bileşen eşleştirmesini yaparken: Eğer önerdiğin bileşen kullanıcının stok listesindeki bir bileşen ile benzerse, stok listesindeki tam ismi kullanmaya özen göster ki eşleştirebilsin.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const responseText = response.text || "{}";
    res.json(JSON.parse(responseText));
  } catch (err: any) {
    console.error("Gemini API hatası:", err);
    res.status(500).json({ 
      error: "AI önerisi alınırken bir hata oluştu veya API Anahtarı eksik.",
      details: err.message 
    });
  }
});

// Vite middleware setup
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

setupVite();
