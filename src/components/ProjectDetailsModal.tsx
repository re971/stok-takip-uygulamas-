import { useState } from "react";
import { X, Copy, Check, Info, ShieldAlert, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Project, StockComponent } from "../types";

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  stockComponents: StockComponent[];
  onDeductStock: (project: Project) => Promise<boolean>;
  onStatusChange: (projectId: string, status: Project["status"]) => Promise<void>;
  alreadyDeducted: boolean;
}

export default function ProjectDetailsModal({
  isOpen,
  onClose,
  project,
  stockComponents,
  onDeductStock,
  onStatusChange,
  alreadyDeducted
}: ProjectDetailsModalProps) {
  const [copied, setCopied] = useState(false);
  const [deducting, setDeducting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!project) return null;

  // Copy code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(project.codeSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Kopyalama hatası:", err);
    }
  };

  // Check BOM Availability
  const checkBOMStatus = () => {
    let allAvailable = true;
    const matches = project.neededComponents.map((needed) => {
      // Look for closely matching stock item (case insensitive, partial matched)
      const stockItem = stockComponents.find(
        (item) => item.name.toLowerCase().includes(needed.name.toLowerCase()) || 
                  needed.name.toLowerCase().includes(item.name.toLowerCase())
      );

      const stockExists = !!stockItem;
      const stockQty = stockItem ? stockItem.quantity : 0;
      const hasEnough = stockQty >= needed.quantity;

      if (!hasEnough) {
        allAvailable = false;
      }

      return {
        neededName: needed.name,
        neededQty: needed.quantity,
        category: needed.category,
        stockName: stockItem ? stockItem.name : null,
        stockQty,
        hasEnough,
        stockExists,
        itemRef: stockItem
      };
    });

    return { allAvailable, matches };
  };

  const { allAvailable, matches } = checkBOMStatus();

  // Handle stock deduction
  const handleDeduct = async () => {
    setDeducting(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const success = await onDeductStock(project);
      if (success) {
        setSuccessMessage("Devre bileşenleri envanterinizden başarıyla düşüldü!");
        // Update status to tamamlandı also
        if (project.id) {
          await onStatusChange(project.id, "Tamamlandı");
        }
      } else {
        setErrorMessage("Bazı malzemelerin stok miktarları yetersiz olduğu için stoktan düşülemedi.");
      }
    } catch (err: any) {
      setErrorMessage("Stok düşürme işlemi sırasında bir hata oluştu: " + err.message);
    } finally {
      setDeducting(false);
    }
  };

  const handleUpdateStatus = async (status: Project["status"]) => {
    if (project.id) {
      await onStatusChange(project.id, status);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="project-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <motion.div
            id="project-modal-card"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl my-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-950/40 border border-sky-800/40 rounded-xl">
                  <Cpu className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium tracking-tight text-white font-sans">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">Proje Detayları & Devre Şeması</p>
                </div>
              </div>
              <button
                type="button"
                id="close-project-modal"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              {/* Description & Status Controller */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-3">
                  <h4 className="text-xs font-mono text-sky-400 uppercase tracking-widest">Proje Açıklaması</h4>
                  <p className="text-sm text-slate-300 leading-relaxed font-sans">{project.description}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800/60 p-4 rounded-xl flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-xs font-mono text-slate-400 block mb-1">PROJE DURUMU</span>
                    <select
                      id="project-status-change"
                      value={project.status}
                      onChange={(e) => handleUpdateStatus(e.target.value as Project["status"])}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs font-medium focus:border-sky-500 focus:outline-none transition-colors cursor-pointer"
                    >
                      <option value="Planlandı">Planlandı 📅</option>
                      <option value="Yapım Aşamasında">Yapım Aşamasında 🛠️</option>
                      <option value="Tamamlandı">Tamamlandı  Verified</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-xs font-mono text-slate-400 block mb-1">STOK DURUMU</span>
                    {alreadyDeducted ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <Check className="w-4 h-4" /> Parçalar Stoktan Düşüldü
                      </div>
                    ) : allAvailable ? (
                      <div className="flex items-center gap-1.5 text-xs text-sky-400 font-medium">
                        <Check className="w-4 h-4" /> Tüm Parçalar Stokta Mevcut
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium">
                        <ShieldAlert className="w-4 h-4" /> Eksik Parçalar Mevcut
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Toast Messages inside Modal */}
              {successMessage && (
                <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}
              {errorMessage && (
                <div className="p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* BOM Stock Checking List */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
                    Gerekli Malzeme Durumu (BOM Analizi)
                  </h4>
                  {!alreadyDeducted && (
                    <button
                      type="button"
                      id="deduct-stock-btn"
                      disabled={deducting || !allAvailable}
                      onClick={handleDeduct}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
                        allAvailable 
                          ? "bg-sky-600 hover:bg-sky-500 text-white cursor-pointer shadow-md shadow-sky-950/30" 
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      }`}
                      title={allAvailable ? "Malzemeleri envanterden düş" : "Eksik malzemeler olduğu için stoktan düşülemez"}
                    >
                      {deducting ? "İşleniyor..." : "Gerekli Parçaları Stoktan Düş"}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {matches.map((match, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-900 border border-slate-800/50 rounded-lg flex items-center justify-between gap-4 text-xs font-sans"
                    >
                      <div className="space-y-1">
                        <span className="font-medium text-white block truncate max-w-[200px]" title={match.neededName}>
                          {match.neededName}
                        </span>
                        <span className="text-[10px] text-slate-400 px-1.5 py-0.5 bg-slate-950 border border-slate-800/60 rounded-md">
                          Gereken: {match.neededQty} adet
                        </span>
                      </div>

                      <div className="text-right">
                        {alreadyDeducted ? (
                          <span className="text-emerald-400 font-medium">Kullanıldı ✔</span>
                        ) : match.stockExists ? (
                          <div className="space-y-1">
                            {match.hasEnough ? (
                              <span className="text-sky-400 font-medium block">Yeterli ({match.stockQty})</span>
                            ) : (
                              <span className="text-amber-500 font-medium block">Yetersiz ({match.stockQty})</span>
                            )}
                            <span className="text-[10px] text-slate-500 block truncate max-w-[120px]" title={match.itemRef?.location}>
                              📍 {match.itemRef?.location || "Konum Yok"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-rose-500 font-medium block">Stokta Bulunmuyor</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Circuit Instructions */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-sky-400 uppercase tracking-widest">Devre Kurulum Talimatı</h4>
                <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-xl text-sm text-slate-300">
                  <ul className="space-y-2 list-none">
                    {project.circuitInstructions.split("\n").map((line, idx) => (
                      <li key={idx} className="flex gap-2.5 leading-relaxed font-sans">
                        <span className="text-sky-500 font-mono select-none">{idx + 1}.</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Arduino Code Segment */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono text-sky-400 uppercase tracking-widest">Arduino Kodu (.ino)</h4>
                  <button
                    type="button"
                    id="copy-code-btn"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium cursor-pointer transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Kopyalandı!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kodu Kopyala</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-slate-800">
                  <pre className="p-4 bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed max-h-80 select-all">
                    <code>{project.codeSnippet}</code>
                  </pre>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
              <button
                type="button"
                id="close-project-footer-btn"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-sm font-medium transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
