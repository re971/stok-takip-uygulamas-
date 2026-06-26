import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StockComponent, CATEGORIES, CategoryType } from "../types";

interface AddEditComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (component: Omit<StockComponent, "userId">) => void;
  initialComponent?: StockComponent | null;
}

export default function AddEditComponentModal({
  isOpen,
  onClose,
  onSave,
  initialComponent
}: AddEditComponentModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<CategoryType>("Mikrodenetleyici");
  const [quantity, setQuantity] = useState<number>(0);
  const [minQuantity, setMinQuantity] = useState<number>(1);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (initialComponent) {
      setName(initialComponent.name);
      setCategory(initialComponent.category as CategoryType);
      setQuantity(initialComponent.quantity);
      setMinQuantity(initialComponent.minQuantity);
      setLocation(initialComponent.location || "");
      setNotes(initialComponent.notes || "");
    } else {
      setName("");
      setCategory("Mikrodenetleyici");
      setQuantity(0);
      setMinQuantity(1);
      setLocation("");
      setNotes("");
    }
  }, [initialComponent, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      category,
      quantity: Math.max(0, quantity),
      minQuantity: Math.max(0, minQuantity),
      location: location.trim(),
      notes: notes.trim()
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="modal-container" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            id="modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
              <h3 className="text-lg font-medium tracking-tight text-white font-sans">
                {initialComponent ? "Bileşeni Düzenle" : "Yeni Bileşen Ekle"}
              </h3>
              <button
                type="button"
                id="close-modal-btn"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                  Bileşen / Parça Adı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="component-name-input"
                  placeholder="Örn: Arduino Uno R3, DHT22 Sensör, SG90 Servo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-sky-500 focus:outline-none transition-colors font-sans"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                  Kategori
                </label>
                <select
                  id="component-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryType)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-sky-500 focus:outline-none transition-colors font-sans cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantities (Current & Minimum Warning) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                    Stok Miktarı <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    id="component-qty-input"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-sky-500 focus:outline-none transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                    Kritik Limit (Uyarı) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    id="component-min-qty-input"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-sky-500 focus:outline-none transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Storage Location */}
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                  Saklama Konumu / Çekmece
                </label>
                <input
                  type="text"
                  id="component-location-input"
                  placeholder="Örn: Kutu A1, Çekmece 3, Mavi Dolap"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-sky-500 focus:outline-none transition-colors font-sans"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                  Açıklama / Notlar
                </label>
                <textarea
                  id="component-notes-input"
                  placeholder="Modülün çalışma voltajı, pin bağlantısı veya özel notlar..."
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-sky-500 focus:outline-none transition-colors font-sans resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 bg-slate-900/50 -mx-6 -mb-6 p-6">
                <button
                  type="button"
                  id="cancel-modal-btn"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  id="submit-modal-btn"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-sky-950/40 hover:shadow-sky-900/40 transition-all cursor-pointer"
                >
                  {initialComponent ? "Değişiklikleri Kaydet" : "Stoka Ekle"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
