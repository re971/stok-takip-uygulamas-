import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  getDocs
} from "firebase/firestore";
import {
  Cpu,
  Plus,
  Search,
  Trash2,
  AlertTriangle,
  ClipboardList,
  Sparkles,
  Layers,
  MapPin,
  CheckCircle2,
  Bookmark,
  RefreshCw,
  Database,
  PlusCircle,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { db } from "./firebase";
import { StockComponent, Project, CATEGORIES, CategoryType } from "./types";
import { SAMPLE_COMPONENTS, SAMPLE_PROJECTS } from "./data/seedData";

// Modular Imports
import AddEditComponentModal from "./components/AddEditComponentModal";
import ProjectDetailsModal from "./components/ProjectDetailsModal";
import CircuitAiAssistant from "./components/CircuitAiAssistant";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  // Session Scoping
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    let localUid = localStorage.getItem("arduino_stock_uid");
    if (!localUid) {
      localUid = "maker_" + Math.random().toString(36).substring(2, 11);
      localStorage.setItem("arduino_stock_uid", localUid);
    }
    setUserId(localUid);
  }, []);

  // Application States
  const [components, setComponents] = useState<StockComponent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");
  const [stockStatusFilter, setStockStatusFilter] = useState<"Tümü" | "Kritik" | "Envanterde" | "Tükendi">("Tümü");

  // Modals & Active Selections
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<StockComponent | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectDetailsOpen, setIsProjectDetailsOpen] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"stok" | "ai_assistant" | "projeler">("stok");

  // High Density Logs & View Settings
  const [logs, setLogs] = useState<string[]>([
    "[SYSTEM] Arduino Stok Atölyesi başlatıldı.",
    "[INFO] Veritabanı senkronizasyonu tamamlandı."
  ]);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const addLog = (msg: string) => {
    const timeStr = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timeStr}] ${msg}`, ...prev].slice(0, 12));
  };

  // Load Component and Project Collections
  useEffect(() => {
    if (!userId) return;

    // Real-time listener for components
    const componentsQuery = query(
      collection(db, "components"),
      where("userId", "==", userId)
    );

    const unsubscribeComponents = onSnapshot(componentsQuery, (snapshot) => {
      const parts: StockComponent[] = [];
      snapshot.forEach((docSnap) => {
        parts.push({
          id: docSnap.id,
          ...docSnap.data()
        } as StockComponent);
      });
      // Sort alphabetically
      parts.sort((a, b) => a.name.localeCompare(b.name));
      setComponents(parts);
      setLoading(false);
    }, (error) => {
      console.error("Bileşen yükleme hatası:", error);
      setLoading(false);
      handleFirestoreError(error, OperationType.GET, "components");
    });

    // Real-time listener for projects
    const projectsQuery = query(
      collection(db, "projects"),
      where("userId", "==", userId)
    );

    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projs: Project[] = [];
      snapshot.forEach((docSnap) => {
        projs.push({
          id: docSnap.id,
          ...docSnap.data()
        } as Project);
      });
      setProjects(projs);
    }, (error) => {
      console.error("Projeleri yükleme hatası:", error);
      handleFirestoreError(error, OperationType.GET, "projects");
    });

    return () => {
      unsubscribeComponents();
      unsubscribeProjects();
    };
  }, [userId]);

  // Seeding Default Starter Kit
  const handleSeedStarterKit = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const batch = writeBatch(db);

      // Seed Components
      const sampleComps = SAMPLE_COMPONENTS(userId);
      for (const comp of sampleComps) {
        const compRef = doc(collection(db, "components"));
        batch.set(compRef, {
          ...comp,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // Seed Projects
      const sampleProjs = SAMPLE_PROJECTS(userId);
      for (const proj of sampleProjs) {
        const projRef = doc(collection(db, "projects"));
        batch.set(projRef, {
          ...proj,
          alreadyDeducted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      await batch.commit();
      addLog("[SYSTEM] Örnek başlangıç kitleri başarıyla yüklendi.");
    } catch (err) {
      console.error("Veri tohumlama hatası:", err);
      addLog("[ERROR] Örnek kiti yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Clear All Collections for Current User
  const handleClearAll = async () => {
    if (!userId || !confirm("Mevcut envanterinizi ve projelerinizi tamamen silmek istediğinizden emin misiniz?")) return;
    try {
      setLoading(true);
      
      // Delete components
      const compsSnapshot = await getDocs(
        query(collection(db, "components"), where("userId", "==", userId))
      );
      const compsBatch = writeBatch(db);
      compsSnapshot.forEach((docSnap) => {
        compsBatch.delete(docSnap.ref);
      });
      await compsBatch.commit();

      // Delete projects
      const projsSnapshot = await getDocs(
        query(collection(db, "projects"), where("userId", "==", userId))
      );
      const projsBatch = writeBatch(db);
      projsSnapshot.forEach((docSnap) => {
        projsBatch.delete(docSnap.ref);
      });
      await projsBatch.commit();

      addLog("[SYSTEM] Envanteriniz tamamen sıfırlandı.");
    } catch (err) {
      console.error("Silme hatası:", err);
      addLog("[ERROR] Veriler silinirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Add or Edit component handler
  const handleSaveComponent = async (data: Omit<StockComponent, "userId">) => {
    if (!userId) return;
    try {
      if (editingComponent && editingComponent.id) {
        const docRef = doc(db, "components", editingComponent.id);
        await updateDoc(docRef, {
          ...data,
          updatedAt: new Date().toISOString()
        });
        addLog(`[GÜNCELLEME] ${data.name} düzenlendi.`);
      } else {
        await addDoc(collection(db, "components"), {
          ...data,
          userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        addLog(`[YENİ] ${data.name} stoka eklendi.`);
      }
    } catch (err) {
      console.error("Malzeme kaydetme hatası:", err);
      addLog(`[HATA] ${data.name} kaydedilemedi.`);
    } finally {
      setEditingComponent(null);
    }
  };

  // Delete component from DB
  const handleDeleteComponent = async (id: string) => {
    if (!confirm("Bu bileşeni envanterden silmek istediğinize emin misiniz?")) return;
    try {
      const match = components.find((c) => c.id === id);
      await deleteDoc(doc(db, "components", id));
      if (match) {
        addLog(`[SİL] ${match.name} silindi.`);
      }
    } catch (err) {
      console.error("Silme hatası:", err);
      addLog("[HATA] Malzeme silinemedi.");
    }
  };

  // Modify stock level quickly (+/-)
  const adjustQuantity = async (id: string, current: number, delta: number) => {
    const nextVal = Math.max(0, current + delta);
    try {
      const docRef = doc(db, "components", id);
      await updateDoc(docRef, {
        quantity: nextVal,
        updatedAt: new Date().toISOString()
      });
      const match = components.find((c) => c.id === id);
      if (match) {
        addLog(`[HIZLI AYAR] ${match.name} adedi ${nextVal} olarak güncellendi.`);
      }
    } catch (err) {
      console.error("Miktar ayarlama hatası:", err);
    }
  };

  // Action callback to deduct stock on building a project
  const handleDeductStock = async (project: Project): Promise<boolean> => {
    if (!userId || !project.id) return false;

    // 1. Gather component matches first to make sure there are adequate quantities in stock
    const matches: { itemRef: StockComponent; deductQty: number }[] = [];
    let allAvailable = true;

    for (const needed of project.neededComponents) {
      const match = components.find(
        (c) => c.name.toLowerCase().includes(needed.name.toLowerCase()) || 
               needed.name.toLowerCase().includes(c.name.toLowerCase())
      );

      if (!match || match.quantity < needed.quantity) {
        allAvailable = false;
        break;
      }
      matches.push({ itemRef: match, deductQty: needed.quantity });
    }

    if (!allAvailable) return false;

    // 2. Run deduction updates
    try {
      const batch = writeBatch(db);
      for (const m of matches) {
        if (m.itemRef.id) {
          const partRef = doc(db, "components", m.itemRef.id);
          batch.update(partRef, {
            quantity: Math.max(0, m.itemRef.quantity - m.deductQty),
            updatedAt: new Date().toISOString()
          });
        }
      }

      // 3. Mark project itself as stock deducted
      const projRef = doc(db, "projects", project.id);
      batch.update(projRef, {
        alreadyDeducted: true,
        updatedAt: new Date().toISOString()
      });

      await batch.commit();
      addLog(`[STOK DÜŞÜŞÜ] "${project.title}" projesi için malzemeler stoktan karşılandı.`);

      // Refresh project selection state in view
      if (selectedProject?.id === project.id) {
        setSelectedProject({
          ...project,
          alreadyDeducted: true
        });
      }

      return true;
    } catch (err) {
      console.error("Deduction error:", err);
      addLog(`[HATA] "${project.title}" malzemeleri düşülemedi.`);
      return false;
    }
  };

  const handleProjectStatusChange = async (projectId: string, status: Project["status"]) => {
    try {
      const docRef = doc(db, "projects", projectId);
      await updateDoc(docRef, {
        status,
        updatedAt: new Date().toISOString()
      });
      
      const match = projects.find(p => p.id === projectId);
      if (match) {
        addLog(`[PROJE DURUMU] "${match.title}" durumu "${status}" yapıldı.`);
      }

      if (selectedProject?.id === projectId) {
        setSelectedProject({
          ...selectedProject,
          status
        });
      }
    } catch (err) {
      console.error("Proje durum güncelleme hatası:", err);
    }
  };

  // AI Assistant Save Suggestion Callback
  const handleSaveCreatedProject = async (projData: Omit<Project, "id">) => {
    try {
      await addDoc(collection(db, "projects"), {
        ...projData,
        alreadyDeducted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      addLog(`[AI DEVRE] "${projData.title}" devresi kaydedildi.`);
      // Automatically switch to Projects tab after successful AI creation
      setActiveTab("projeler");
    } catch (err) {
      console.error("AI proje kayıt hatası:", err);
      addLog("[HATA] AI projesi kaydedilirken hata oluştu.");
    }
  };

  // Filtering Logic
  const filteredComponents = components.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "Tümü" || item.category === selectedCategory;

    let matchesStatus = true;
    if (stockStatusFilter === "Kritik") {
      matchesStatus = item.quantity <= item.minQuantity && item.quantity > 0;
    } else if (stockStatusFilter === "Envanterde") {
      matchesStatus = item.quantity > item.minQuantity;
    } else if (stockStatusFilter === "Tükendi") {
      matchesStatus = item.quantity === 0;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate high-fidelity dashboard metrics
  const totalKindsCount = components.length;
  const criticalItemsCount = components.filter(c => c.quantity <= c.minQuantity && c.quantity > 0).length;
  const outOfStockCount = components.filter(c => c.quantity === 0).length;
  const totalPartsPieces = components.reduce((acc, curr) => acc + curr.quantity, 0);
  const activeProjectsCount = projects.filter(p => p.status !== "Tamamlandı").length;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* 1. High Density Top Navigation Console */}
      <header className="border-b border-slate-700 bg-[#1e293b] sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Brand/System Title */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-sky-500/10 border border-sky-400/20 rounded-lg text-sky-400">
              <Cpu className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wider flex items-center gap-1.5 uppercase font-mono">
                Arduino Atölyesi
                <span className="text-[9px] bg-sky-950 text-sky-400 border border-sky-800 px-1 py-0.5 rounded font-bold tracking-normal leading-none font-sans lowercase">v4.2</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider">SYSTEM_OPERATOR // ENVENTER_KONTROL</p>
            </div>
          </div>

          {/* Quick-Actions / Seed Tools */}
          <div className="flex items-center gap-2">
            {/* Search inputs */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                id="header-search"
                placeholder="Kod/parça ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-40 sm:w-56 pl-8 pr-2.5 py-1 bg-slate-900/90 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none transition-colors"
              />
            </div>

            {components.length === 0 ? (
              <button
                type="button"
                id="header-seed-btn"
                onClick={handleSeedStarterKit}
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold shadow transition-all flex items-center gap-1 cursor-pointer"
              >
                <Database className="w-3 h-3" />
                <span>Seti Yükle</span>
              </button>
            ) : (
              <button
                type="button"
                id="header-clear-btn"
                onClick={handleClearAll}
                className="px-2 py-1 bg-slate-900 border border-slate-700 hover:border-rose-900/40 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 rounded text-xs font-mono select-none transition-all flex items-center gap-1 cursor-pointer"
                title="Tüm verileri temizle"
              >
                <Trash2 className="w-3 h-3" />
                <span>Temizle</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main High-Density Workspace Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-5 flex flex-col md:flex-row gap-4 overflow-hidden">
        
        {/* Left Control Column (Sidebar) */}
        <aside className="w-full md:w-56 shrink-0 flex flex-col gap-4">
          {/* Category Navigation Wrapper */}
          <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-3 shadow-inner">
            <h3 className="text-[10px] text-slate-400 font-bold uppercase mb-2 tracking-wider font-mono border-b border-slate-700 pb-1.5 flex items-center justify-between">
              <span>Bileşen Sınıfları</span>
              <span className="text-[9px] bg-slate-950 px-1 py-0.5 rounded text-slate-500 font-mono font-normal">KATEGORİ</span>
            </h3>
            <ul className="space-y-0.5 max-h-60 md:max-h-none overflow-y-auto pr-1">
              <li
                id="cat-sidebar-all"
                onClick={() => setSelectedCategory("Tümü")}
                className={`flex items-center justify-between px-2 py-1.5 rounded text-xs cursor-pointer transition-all ${
                  selectedCategory === "Tümü"
                    ? "bg-slate-900 text-sky-400 border-l-2 border-sky-500 font-medium font-mono pl-3"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <span>Tüm Teçhizat</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-950 border border-slate-800/60 rounded text-slate-400">
                  {components.length}
                </span>
              </li>
              {CATEGORIES.map((cat) => {
                const count = components.filter((item) => item.category === cat).length;
                return (
                  <li
                    key={cat}
                    id={`cat-sidebar-${cat}`}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center justify-between px-2 py-1.5 rounded text-xs cursor-pointer transition-all ${
                      selectedCategory === cat
                        ? "bg-slate-900 text-sky-400 border-l-2 border-sky-500 font-medium font-mono pl-3"
                        : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                    }`}
                  >
                    <span className="truncate pr-1.5">{cat}</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-950 border border-slate-900/60 rounded text-slate-500 shrink-0">
                      {count}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Quick Realtime Hardware Metrics */}
          <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-3 shadow-sm space-y-2">
            <h3 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono border-b border-slate-700 pb-1.5">
              ATÖLYE TEKNİK DURUM
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-2 font-mono">
              <div className="bg-slate-950 border border-slate-800/80 p-2 rounded">
                <div className="text-[9px] text-slate-500 leading-none">BENZERSİZ SEÇENEK</div>
                <div className="text-sm font-semibold text-white mt-1">{totalKindsCount}</div>
              </div>
              <div className="bg-slate-950 border border-slate-800/80 p-2 rounded">
                <div className="text-[9px] text-slate-500 leading-none">TOPLAM PARÇA</div>
                <div className="text-sm font-semibold text-emerald-400 mt-1">{totalPartsPieces}</div>
              </div>
              <div className="bg-slate-950 border border-slate-800/80 p-2 rounded">
                <div className="text-[9px] text-slate-500 leading-none">KRİTİK LİMİT</div>
                <div className="text-sm font-semibold text-amber-500 mt-1">{criticalItemsCount}</div>
              </div>
              <div className="bg-slate-950 border border-slate-800/80 p-2 rounded">
                <div className="text-[9px] text-slate-500 leading-none">BEKLEYEN PROJELER</div>
                <div className="text-sm font-semibold text-sky-400 mt-1">{activeProjectsCount}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Active Dashboard Viewport */}
        <main className="flex-1 flex flex-col gap-4 overflow-y-auto">
          {/* Primary View Selector Navigation Tabs */}
          <div className="flex border-b border-slate-800 gap-1 p-0.5 bg-slate-900/50 rounded-lg">
            <button
              type="button"
              id="tab-stok"
              onClick={() => setActiveTab("stok")}
              className={`px-3 py-2 text-xs font-bold tracking-wider rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "stok"
                  ? "bg-slate-800 text-sky-400 border border-slate-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>LAB ENVANTERİ</span>
            </button>

            <button
              type="button"
              id="tab-ai-assistant"
              onClick={() => setActiveTab("ai_assistant")}
              className={`px-3 py-2 text-xs font-bold tracking-wider rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "ai_assistant"
                  ? "bg-slate-800 text-sky-400 border border-slate-700 shadow-sm animate-pulse"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>AI DEVRE TASARIM (GEMINI)</span>
            </button>

            <button
              type="button"
              id="tab-projeler"
              onClick={() => setActiveTab("projeler")}
              className={`px-3 py-2 text-xs font-bold tracking-wider rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "projeler"
                  ? "bg-slate-800 text-sky-400 border border-slate-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>DEVRE PROJELERİM ({projects.length})</span>
            </button>
          </div>

          {/* Core Panel Window */}
          <div className="flex-1 flex flex-col gap-4">
            {activeTab === "stok" && (
              <>
                {/* Secondary list filter actions (Status and View layout) */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-[#1e293b]/70 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    {/* Stock Status Selector inside */}
                    <div className="flex items-center bg-slate-950 border border-slate-850 rounded-lg p-0.5">
                      <button
                        type="button"
                        id="filter-status-all"
                        onClick={() => setStockStatusFilter("Tümü")}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                          stockStatusFilter === "Tümü" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Tümü
                      </button>
                      <button
                        type="button"
                        id="filter-status-critical"
                        onClick={() => setStockStatusFilter("Kritik")}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                          stockStatusFilter === "Kritik" ? "bg-rose-950/70 text-rose-300 border border-rose-900/40" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        ⚠️ Kritik Seviye
                      </button>
                      <button
                        type="button"
                        id="filter-status-ok"
                        onClick={() => setStockStatusFilter("Envanterde")}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                          stockStatusFilter === "Envanterde" ? "bg-emerald-950/70 text-emerald-300 border border-emerald-900/40" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Yeterli
                      </button>
                      <button
                        type="button"
                        id="filter-status-out"
                        onClick={() => setStockStatusFilter("Tükendi")}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                          stockStatusFilter === "Tükendi" ? "bg-red-950/80 text-rose-400 border border-red-900/40" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Tükendi
                      </button>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                      Analiz: {filteredComponents.length} eleman eşleşti
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Switcher toggle */}
                    <div className="flex items-center bg-slate-950 border border-slate-850 rounded-lg p-0.5 shrink-0 font-mono">
                      <button
                        type="button"
                        id="view-table-btn"
                        onClick={() => setViewMode("table")}
                        className={`px-2 py-1 text-[9px] font-bold rounded transition-all cursor-pointer ${
                          viewMode === "table" ? "bg-slate-800 text-sky-400" : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        TABLO (DENSE)
                      </button>
                      <button
                        type="button"
                        id="view-grid-btn"
                        onClick={() => setViewMode("grid")}
                        className={`px-2 py-1 text-[9px] font-bold rounded transition-all cursor-pointer ${
                          viewMode === "grid" ? "bg-slate-800 text-sky-400" : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        KUTULAR
                      </button>
                    </div>

                    <button
                      type="button"
                      id="add-component-btn"
                      onClick={() => {
                        setEditingComponent(null);
                        setIsAddEditOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-sm transition-all shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Parça Ekle</span>
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="p-16 text-center border border-slate-800 bg-[#1e293b]/20 rounded-2xl flex flex-col items-center justify-center space-y-3">
                    <div className="w-6 h-6 border-2 border-sky-800 border-t-sky-400 rounded-full animate-spin" />
                    <span className="text-xs text-slate-400 font-mono">Atölye kutuları okunuyor...</span>
                  </div>
                ) : filteredComponents.length === 0 ? (
                  /* Empty view state */
                  <div className="p-10 text-center border border-dashed border-slate-800 bg-slate-950/20 rounded-xl flex flex-col items-center justify-center space-y-3">
                    <div className="p-3 bg-[#1e293b] rounded-xl border border-slate-800">
                      <HelpCircle className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Eşleşen Teçhizat Bulunamadı</h3>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                        Aradığınız kategoride veya filtrelerde parça yok. Hızlı başlangıç kiti yükleyebilir ya da parça ekleyebilirsiniz.
                      </p>
                    </div>
                    {components.length === 0 && (
                      <button
                        type="button"
                        id="empty-state-seed-btn"
                        onClick={handleSeedStarterKit}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Başlangıç Kiti Yükle</span>
                      </button>
                    )}
                  </div>
                ) : viewMode === "table" ? (
                  /* Dense Table Layout (Perfect representation of High Density) */
                  <div className="overflow-x-auto bg-[#1e293b] border border-slate-800 rounded-xl shadow-lg">
                    <table className="w-full text-left border-collapse select-none">
                      <thead className="bg-slate-950 text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">
                        <tr>
                          <th className="px-4 py-2.5 border-b border-slate-800">Parça / Model</th>
                          <th className="px-4 py-2.5 border-b border-slate-800">Kategori</th>
                          <th className="px-4 py-2.5 border-b border-slate-800 text-center w-36">Stok Miktarı</th>
                          <th className="px-4 py-2.5 border-b border-slate-800">Depo Konumu</th>
                          <th className="px-4 py-2.5 border-b border-slate-800 text-center w-32">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs divide-y divide-slate-800/80 font-sans">
                        {filteredComponents.map((item) => {
                          const isCritical = item.quantity <= item.minQuantity && item.quantity > 0;
                          const isOutOfStock = item.quantity === 0;

                          return (
                            <tr
                              key={item.id}
                              id={`comp-row-${item.id}`}
                              className={`hover:bg-slate-800/50 transition-colors ${
                                isOutOfStock
                                  ? "bg-rose-950/20 text-rose-300/90"
                                  : isCritical
                                  ? "bg-amber-950/15 text-amber-300/90"
                                  : ""
                              }`}
                            >
                              {/* Name column */}
                              <td className="px-4 py-2 font-medium">
                                <div className="flex flex-col">
                                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                                    {item.name}
                                    {isOutOfStock && <span className="text-[8px] tracking-tight bg-rose-900/60 text-rose-300 px-1 rounded font-mono">TÜKENDİ</span>}
                                    {isCritical && <span className="text-[8px] tracking-tight bg-amber-900/60 text-amber-300 px-1 rounded font-mono">KRİTİK</span>}
                                  </span>
                                  <span className="text-[10px] text-slate-400 line-clamp-1 italic mt-0.5">{item.notes || "Not eklenmemiş."}</span>
                                </div>
                              </td>

                              {/* Category */}
                              <td className="px-4 py-2 text-slate-300">
                                <span className="text-[10px] border border-slate-700 bg-slate-900 px-1.5 py-0.5 rounded font-mono text-slate-400">
                                  {item.category}
                                </span>
                              </td>

                              {/* Stock Adjuster */}
                              <td className="px-4 py-2">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    id={`dec-row-${item.id}`}
                                    onClick={() => adjustQuantity(item.id!, item.quantity, -1)}
                                    className="w-5 h-5 flex items-center justify-center bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-750 text-xs font-bold cursor-pointer transition-colors"
                                  >
                                    -
                                  </button>
                                  <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded tracking-wider min-w-[2.2rem] text-center ${
                                    isOutOfStock
                                      ? "bg-rose-950/80 text-rose-400 border border-rose-800/40"
                                      : isCritical
                                      ? "bg-amber-950/80 text-amber-400 border border-amber-800/40"
                                      : "bg-slate-950 text-emerald-400 border border-slate-800"
                                  }`}>
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    id={`inc-row-${item.id}`}
                                    onClick={() => adjustQuantity(item.id!, item.quantity, 1)}
                                    className="w-5 h-5 flex items-center justify-center bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-750 text-xs font-bold cursor-pointer transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>

                              {/* Storage location */}
                              <td className="px-4 py-2 text-slate-300 font-mono text-[10px]">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                                  <span>{item.location || "Belirtilmemiş"}</span>
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    id={`edit-item-${item.id}`}
                                    onClick={() => {
                                      setEditingComponent(item);
                                      setIsAddEditOpen(true);
                                    }}
                                    className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-sky-400 hover:text-sky-300 border border-slate-750 rounded text-xs transition-colors cursor-pointer"
                                  >
                                    Düzenle
                                  </button>
                                  <button
                                    type="button"
                                    id={`del-item-${item.id}`}
                                    onClick={() => handleDeleteComponent(item.id!)}
                                    className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-rose-400 hover:text-rose-300 border border-slate-750 rounded text-xs transition-colors cursor-pointer"
                                  >
                                    Sil
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Compact Grid Layout */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredComponents.map((item) => {
                      const isCritical = item.quantity <= item.minQuantity && item.quantity > 0;
                      const isOutOfStock = item.quantity === 0;

                      return (
                        <div
                          key={item.id}
                          id={`comp-card-${item.id}`}
                          className={`p-3.5 rounded-xl border relative flex flex-col justify-between h-40 transition-colors ${
                            isOutOfStock
                              ? "bg-rose-950/20 border-rose-900/40"
                              : isCritical
                              ? "bg-amber-950/15 border-amber-900/40"
                              : "bg-[#1e293b]/70 border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          {/* Heading info */}
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-white text-xs tracking-tight line-clamp-1" title={item.name}>
                                  {item.name}
                                </h4>
                                <span className="text-[9px] font-mono text-sky-400 bg-sky-950/60 border border-sky-900 px-1.5 py-0.2 rounded mt-1 inline-block">
                                  {item.category}
                                </span>
                              </div>

                              {isOutOfStock ? (
                                <span className="bg-rose-950/40 border border-rose-800/30 text-rose-300 text-[8px] font-bold font-mono px-1.5 py-0.5 rounded">TÜKENDİ</span>
                              ) : isCritical ? (
                                <span className="bg-amber-950/40 border border-amber-800/30 text-amber-300 text-[8px] font-bold font-mono px-1.5 py-0.5 rounded">KRİTİK</span>
                              ) : null}
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight mt-1.5 italic" title={item.notes}>
                              {item.notes || "Not veya voltaj bağlantı açıklaması girilmemiş."}
                            </p>
                          </div>

                          {/* Footer items */}
                          <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 mt-2">
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate max-w-[110px]" title={item.location}>
                              <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                              <span className="truncate">{item.location || "-"}</span>
                            </div>

                            {/* Rapid counter panel */}
                            <div className="flex items-center bg-slate-950 border border-slate-800 roundedL overflow-hidden h-6">
                              <button
                                type="button"
                                id={`dec-${item.id}`}
                                onClick={() => adjustQuantity(item.id!, item.quantity, -1)}
                                className="px-1.5 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-xs font-bold cursor-pointer"
                              >
                                -
                              </button>
                              <span className="px-2 font-mono text-xs font-bold text-white bg-slate-900 border-x border-slate-800 shrink-0 min-w-[1.8rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                id={`inc-${item.id}`}
                                onClick={() => adjustQuantity(item.id!, item.quantity, 1)}
                                className="px-1.5 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-xs font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Overlaid Pencil and trash icons */}
                          <div className="absolute top-2.5 right-2 px-1 py-0.5 bg-slate-950/90 border border-slate-800 rounded flex gap-1 opacity-100 hover:opacity-100">
                            <button
                              type="button"
                              id={`edit-item-${item.id}`}
                              onClick={() => {
                                setEditingComponent(item);
                                setIsAddEditOpen(true);
                              }}
                              className="text-[9px] font-bold text-sky-400 hover:text-sky-300 cursor-pointer"
                            >
                              Kalem
                            </button>
                            <span className="text-slate-700">|</span>
                            <button
                              type="button"
                              id={`del-item-${item.id}`}
                              onClick={() => handleDeleteComponent(item.id!)}
                              className="text-[9px] font-bold text-rose-500 hover:text-rose-400 cursor-pointer"
                            >
                              Sil
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {activeTab === "ai_assistant" && (
              <CircuitAiAssistant
                stockComponents={components}
                onSaveCreatedProject={handleSaveCreatedProject}
              />
            )}

            {activeTab === "projeler" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">Devre Tasarımları</h3>
                    <p className="text-[11px] text-slate-400">Gemini veya sizin tarafınızdan eklenen devre kart şemaları</p>
                  </div>
                </div>

                {projects.length === 0 ? (
                  <div className="p-10 text-center border border-dashed border-slate-800 bg-slate-950/20 rounded-xl flex flex-col items-center justify-center space-y-3">
                    <div className="p-3 bg-[#1e293b] rounded-xl border border-slate-800">
                      <Bookmark className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono">Henüz Proje Yok</h3>
                      <p className="text-[11px] text-slate-400 max-w-sm mt-1 mx-auto leading-relaxed">
                        "AI DEVRE TASARIM" sekmesini kullanarak saniyeler içinde Arduino devreleri planlayabilirsiniz!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {projects.map((proj) => {
                      const neededCompsCount = proj.neededComponents?.length || 0;
                      
                      // Check stock availability
                      const loadedMatches = proj.neededComponents?.map(needed => {
                        const stockItem = components.find(c =>
                          c.name.toLowerCase().includes(needed.name.toLowerCase()) || 
                          needed.name.toLowerCase().includes(c.name.toLowerCase())
                        );
                        return stockItem ? stockItem.quantity >= needed.quantity : false;
                      }) || [];

                      const enoughStockCount = loadedMatches.filter(Boolean).length;
                      const stockFullyReady = enoughStockCount === neededCompsCount;

                      return (
                        <div
                          key={proj.id}
                          id={`project-card-${proj.id}`}
                          onClick={() => {
                            setSelectedProject(proj);
                            setIsProjectDetailsOpen(true);
                          }}
                          className="p-4 bg-[#1e293b]/70 border border-slate-800 hover:border-sky-500/40 hover:bg-[#1e293b] rounded-xl flex flex-col justify-between h-44 cursor-pointer transition-all shadow-sm"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono font-bold text-sky-400 bg-sky-950 border border-sky-900/60 px-1.5 py-0.2 rounded">
                                {proj.status}
                              </span>
                              {proj.alreadyDeducted ? (
                                <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-0.5">
                                  ✓ Stoktan Düştü
                                </span>
                              ) : stockFullyReady ? (
                                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-900 px-1.5 rounded">
                                  Hazır 🚀
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono text-amber-400 bg-amber-950/60 border border-amber-900 px-1.5 rounded">
                                  Eksik ({enoughStockCount}/{neededCompsCount})
                                </span>
                              )}
                            </div>

                            <h4 className="font-bold text-white tracking-tight text-xs line-clamp-1">
                              {proj.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight italic">
                              {proj.description}
                            </p>
                          </div>

                          <div className="border-t border-slate-800/60 pt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                            <span>{neededCompsCount} Malzeme</span>
                            <span className="text-sky-400 font-bold hover:underline">Aç →</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Terminal console log module at bottom (Highly appreciated for High Density builders) */}
          <div className="bg-black/45 border border-slate-800 rounded-xl p-3 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-2">
              <span className="text-[10px] font-bold text-[#38bdf8] tracking-widest uppercase font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                WORKBENCH STOK EVENT STREAM // TERMINAL GÜNLÜĞÜ
              </span>
              <span className="text-[9px] text-slate-500 font-mono">TELEMETRY ON // PORT 3000</span>
            </div>
            <div className="h-28 overflow-y-auto font-mono text-[11px] text-emerald-400/80 space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {logs.map((log, idx) => (
                <div key={idx} className="flex gap-1">
                  <span className="text-emerald-600/60 shrink-0">&gt;</span>
                  <span className="break-all">{log}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* 4. Footer credits matching aesthetic */}
      <footer className="border-t border-slate-850 bg-slate-900/40 py-4 text-center text-[10px] text-slate-500 space-y-0.5 select-none shrink-0 mt-6 font-mono">
        <p>Arduino Atölyesi — Envanter ve Akıllı BOM Planlama Workbench.</p>
        <p className="text-slate-600">Veritabanı: Google Firebase Realtime Cloud Firestore</p>
      </footer>

      {/* Modal - Add / Edit Component */}
      <AddEditComponentModal
        isOpen={isAddEditOpen}
        onClose={() => {
          setIsAddEditOpen(false);
          setEditingComponent(null);
        }}
        onSave={handleSaveComponent}
        initialComponent={editingComponent}
      />

      {/* Modal - Project Details and BOM Deduction */}
      <ProjectDetailsModal
        isOpen={isProjectDetailsOpen}
        onClose={() => {
          setIsProjectDetailsOpen(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
        stockComponents={components}
        onDeductStock={handleDeductStock}
        onStatusChange={handleProjectStatusChange}
        alreadyDeducted={selectedProject?.alreadyDeducted || false}
      />
    </div>
  );
}
