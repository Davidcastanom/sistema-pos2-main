import React, { useState } from 'react';
import { Tag, X, Plus, Trash2, RotateCcw, Check } from 'lucide-react';

interface ManageQuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  chips: string[];
  onAddChip: (chip: string) => void;
  onRemoveChip: (chip: string) => void;
  onResetDefaultChips: () => void;
}

export const ManageQuickSearchModal: React.FC<ManageQuickSearchModalProps> = ({
  isOpen,
  onClose,
  chips,
  onAddChip,
  onRemoveChip,
  onResetDefaultChips,
}) => {
  const [newChipText, setNewChipText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newChipText.trim();
    if (!trimmed) return;

    if (chips.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`"${trimmed}" ya está en la lista de búsqueda rápida`);
      return;
    }

    onAddChip(trimmed);
    setNewChipText('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#222E3A]/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#FFF9F0] rounded-none max-w-md w-full shadow-2xl border-2 border-[#214C6A] overflow-hidden flex flex-col max-h-[85vh] text-[#222E3A]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#214C6A] border-b border-[#214C6A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-none bg-[#BC6343] border border-white/20 flex items-center justify-center text-white shadow-xs">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold font-['Outfit',sans-serif] text-white">
                Personalizar Búsqueda Rápida
              </h3>
              <p className="text-xs text-[#F6E1C6]/80">
                Añade o quita las palabras y productos clave
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-none bg-[#1a3d55] hover:bg-[#0f2433] flex items-center justify-center text-[#F6E1C6] hover:text-white transition-colors cursor-pointer border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Add Input Form */}
        <div className="p-3.5 bg-[#F6E1C6]/60 border-b border-[#214C6A]/20">
          <form onSubmit={handleAdd} className="space-y-2">
            <label className="text-xs font-bold text-[#214C6A] block">
              Agregar nueva palabra o producto a la búsqueda rápida:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newChipText}
                onChange={(e) => {
                  setNewChipText(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Ej: Atún, Chocolate, Azúcar, Jabón Rey..."
                className="flex-1 px-3 py-2 rounded-none bg-[#FFF9F0] border border-[#214C6A]/30 text-[#222E3A] placeholder-[#63665B]/60 text-xs font-medium focus:ring-1 focus:ring-[#214C6A] focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                disabled={!newChipText.trim()}
                className="px-4 py-2 rounded-none bg-[#214C6A] hover:bg-[#1a3d55] disabled:bg-[#63665B]/30 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Añadir</span>
              </button>
            </div>
            {errorMsg && (
              <p className="text-xs text-rose-700 font-medium">{errorMsg}</p>
            )}
          </form>
        </div>

        {/* Chips List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#214C6A]">
              Palabras activas ({chips.length}):
            </span>
            <button
              type="button"
              onClick={onResetDefaultChips}
              className="text-[11px] text-[#214C6A] hover:text-[#BC6343] flex items-center gap-1 cursor-pointer font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar por defecto</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {chips.map((chip) => (
              <div
                key={chip}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-[#FFF9F0] border border-[#214C6A]/30 text-[#222E3A] text-xs font-medium shadow-2xs group hover:border-[#214C6A]"
              >
                <span>{chip}</span>
                <button
                  type="button"
                  onClick={() => onRemoveChip(chip)}
                  className="w-4 h-4 rounded-none bg-[#F6E1C6] hover:bg-rose-700 text-[#56291D] hover:text-white flex items-center justify-center transition-colors cursor-pointer ml-1"
                  title={`Eliminar "${chip}"`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {chips.length === 0 && (
            <div className="text-center py-6 text-[#63665B]">
              <p className="text-xs">No hay palabras en la búsqueda rápida.</p>
              <p className="text-[11px] text-[#63665B] mt-1">
                Escribe una arriba o toca &quot;Restaurar por defecto&quot;.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#F6E1C6]/60 border-t-2 border-[#214C6A] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-none bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};

