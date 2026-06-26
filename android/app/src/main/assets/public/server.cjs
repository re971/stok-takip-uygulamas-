var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
app.use(import_express.default.json());
var PORT = 3e3;
var aiClient = null;
function getAiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY checks failed: Environment variable GEMINI_API_KEY is not defined.");
    }
    aiClient = new import_genai.GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}
app.post("/api/ai/suggest", async (req, res) => {
  try {
    const { prompt, currentStock } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "L\xFCtfen bir proje tan\u0131m\u0131 veya fikri girin." });
      return;
    }
    const ai = getAiClient();
    const stockStr = currentStock && currentStock.length > 0 ? currentStock.map((c) => `- Name: ${c.name}, Category: ${c.category}, Stock: ${c.quantity}, Location: ${c.location || "Belirtilmemi\u015F"}`).join("\n") : "Stok bo\u015F. Hi\xE7bir bile\u015Fen bulunmuyor.";
    const systemPrompt = `Sen bir Arduino ve elektronik uzman\u0131s\u0131n. Kullan\u0131c\u0131lar\u0131n Arduino devre projeleri tasarlamas\u0131na, kod yazmas\u0131na ve stoklar\u0131ndaki malzemelere g\xF6re malzeme analizi yapmas\u0131na yard\u0131mc\u0131 olursun.
Kullan\u0131c\u0131n\u0131n stok durumu \u015F\xF6yledir:
${stockStr}

Kullan\u0131c\u0131 \u015Fu projeyi yapmak istiyor: "${prompt}"

L\xFCtfen bu projenin tasar\u0131m\u0131n\u0131 yap ve sonucu MUTLAKA a\u015Fa\u011F\u0131daki JSON format\u0131nda geriye d\xF6nd\xFCr. Ba\u015Fka hi\xE7bir a\xE7\u0131klama yaz\u0131s\u0131 ekleme, do\u011Frudan ge\xE7erli bir JSON objesi \xFCret.

JSON Format\u0131:
{
  "projectTitle": "Projenin ad\u0131",
  "projectDescription": "Projenin ne yapt\u0131\u011F\u0131n\u0131 a\xE7\u0131klayan k\u0131sa ve net bir metin",
  "circuitInstructions": "Devre elemanlar\u0131n\u0131n Arduino'ya ve birbirlerine nas\u0131l ba\u011Flanaca\u011F\u0131n\u0131 anlatan ad\u0131m ad\u0131m detayl\u0131 kurulum talimat\u0131",
  "recommendedComponents": [
    {
      "name": "Bile\u015Fen Ad\u0131 (\xD6rn: Arduino Uno, HC-SR04 Sens\xF6r)",
      "quantity": 1,
      "category": "Kategori (Mikrodenetleyici, Sens\xF6r, Akt\xFCat\xF6r, Ekran vb.)"
    }
  ],
  "arduinoCode": "Standard Arduino (.ino) code block with proper comment lines explaining setup and loop."
}

Bile\u015Fen e\u015Fle\u015Ftirmesini yaparken: E\u011Fer \xF6nerdi\u011Fin bile\u015Fen kullan\u0131c\u0131n\u0131n stok listesindeki bir bile\u015Fen ile benzerse, stok listesindeki tam ismi kullanmaya \xF6zen g\xF6ster ki e\u015Fle\u015Ftirebilsin.`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const responseText = response.text || "{}";
    res.json(JSON.parse(responseText));
  } catch (err) {
    console.error("Gemini API hatas\u0131:", err);
    res.status(500).json({
      error: "AI \xF6nerisi al\u0131n\u0131rken bir hata olu\u015Ftu veya API Anahtar\u0131 eksik.",
      details: err.message
    });
  }
});
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}
setupVite();
//# sourceMappingURL=server.cjs.map
